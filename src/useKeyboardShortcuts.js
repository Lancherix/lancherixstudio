import { useEffect, useRef } from 'react';

// Detect once — used to map "mod" to the platform-appropriate modifier
// (Cmd on Mac, Ctrl everywhere else) so shortcut maps can stay platform-agnostic.
const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

export const isMac = IS_MAC;

// Human-readable modifier key label, for rendering shortcut hints in the UI.
export const modKeyLabel = IS_MAC ? '⌘' : 'Ctrl';

const KEY_ALIASES = {
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  ' ': 'space',
  spacebar: 'space',
};

const normalizeKey = (key) => {
  const lower = key.toLowerCase();
  return KEY_ALIASES[lower] || lower;
};

// Returns true if the event's key + modifiers match a shortcut string like
// "mod+k", "shift+/", "g t" (sequence — not supported here, kept single-chord
// on purpose for reliability), "esc", "1".
const matches = (event, shortcut) => {
  const tokens = shortcut.toLowerCase().split('+').map((t) => t.trim());
  const key = normalizeKey(tokens[tokens.length - 1]);
  const wantMod = tokens.includes('mod');
  const wantShift = tokens.includes('shift');
  const wantAlt = tokens.includes('alt');
  const wantCtrl = tokens.includes('ctrl') && !wantMod;

  const eventKey = normalizeKey(event.key || '');
  if (eventKey !== key) return false;

  const modPressed = IS_MAC ? event.metaKey : event.ctrlKey;
  if (wantMod && !modPressed) return false;
  if (!wantMod && modPressed) return false;

  if (wantCtrl !== event.ctrlKey && !IS_MAC) {
    // On non-Mac, "mod" already checked ctrlKey above, so only enforce
    // explicit "ctrl" requests here (rare — mostly used on Mac for Ctrl-specific binds).
  }
  if (wantShift !== event.shiftKey) return false;
  if (wantAlt !== event.altKey) return false;

  return true;
};

const isTypingTarget = (target) => {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
};

/**
 * Bind a map of shortcuts to keydown events.
 *
 * shortcuts: {
 *   'mod+k': (e) => { ... },
 *   'esc': { handler: (e) => {...}, allowInInputs: true },
 * }
 *
 * By default, shortcuts are ignored while the user is typing in an <input>,
 * <textarea>, <select>, or a contentEditable element (e.g. the notes editor)
 * — pass `allowInInputs: true` on an individual shortcut (e.g. Escape, or
 * Cmd+K) to let it fire everywhere.
 *
 * options.enabled lets a caller temporarily disable a whole shortcut set
 * (e.g. while a modal from *another* component is open).
 */
export default function useKeyboardShortcuts(shortcuts, options = {}) {
  const { enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event) => {
      const map = shortcutsRef.current;
      const typing = isTypingTarget(event.target);

      for (const shortcut of Object.keys(map)) {
        if (!matches(event, shortcut)) continue;

        const entry = map[shortcut];
        const handler = typeof entry === 'function' ? entry : entry.handler;
        const allowInInputs = typeof entry === 'function' ? false : !!entry.allowInInputs;
        const preventDefault = typeof entry === 'function' ? true : entry.preventDefault !== false;

        if (typing && !allowInInputs) continue;

        if (preventDefault) event.preventDefault();
        handler(event);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}