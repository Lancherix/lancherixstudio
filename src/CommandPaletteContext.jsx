import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import useKeyboardShortcuts from './useKeyboardShortcuts';

const CommandPaletteContext = createContext(null);

/**
 * Wrap the app in <CommandPaletteProvider>. Any component can then call
 * useCommands(namespace, commands, deps) to contribute commands while it's
 * mounted — they're automatically removed on unmount, so page-specific
 * commands (e.g. "New Task") only show up while that page is active.
 */
export const CommandPaletteProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Map of namespace -> commands[], merged for rendering. Using a namespace
  // per registering component means ProjectPage can re-register on every
  // render (e.g. when tasks change) without stepping on SideMenu's commands.
  const [registry, setRegistry] = useState({});
  const registryRef = useRef(registry);
  registryRef.current = registry;

  const registerCommands = useCallback((namespace, commands) => {
    setRegistry((prev) => ({ ...prev, [namespace]: commands }));
    return () => {
      setRegistry((prev) => {
        if (!(namespace in prev)) return prev;
        const next = { ...prev };
        delete next[namespace];
        return next;
      });
    };
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useKeyboardShortcuts(
    {
      'mod+k': { handler: toggle, allowInInputs: true },
      esc: { handler: close, allowInInputs: true },
    },
    { enabled: true }
  );

  const commands = useMemo(() => {
    const seen = new Set();
    const all = [];
    Object.values(registry).forEach((list) => {
      (list || []).forEach((cmd) => {
        if (!cmd || !cmd.id || seen.has(cmd.id)) return;
        seen.add(cmd.id);
        all.push(cmd);
      });
    });
    return all;
  }, [registry]);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle, registerCommands, commands }),
    [isOpen, open, close, toggle, registerCommands, commands]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
};

export const useCommandPalette = () => {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return ctx;
};

/**
 * Register a set of commands under `namespace` for as long as the calling
 * component is mounted. Re-registers whenever `deps` changes, so commands
 * can reference current component state (e.g. the current project id).
 *
 * Example:
 *   useCommands('project-page', [
 *     { id: 'go-tasks', label: 'Go to Tasks', group: t('project'), perform: () => setActiveFolder('Tasks') },
 *   ], [project?._id]);
 */
export const useCommands = (namespace, commands, deps = []) => {
  const { registerCommands } = useCommandPalette();

  useEffect(() => {
    const unregister = registerCommands(namespace, commands);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, registerCommands, ...deps]);
};

export default CommandPaletteContext;