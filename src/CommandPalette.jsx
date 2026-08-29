import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommandPalette } from './CommandPaletteContext';
import './CommandPalette.css';

// Small, dependency-free fuzzy-ish scorer: rewards prefix matches highest,
// then "contains", then subsequence matches (so "np" can still find
// "New Project"). Returns null when the query doesn't match at all.
const score = (label, query) => {
  const l = label.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;
  if (l.startsWith(q)) return 3;
  if (l.includes(q)) return 2;

  let qi = 0;
  for (let li = 0; li < l.length && qi < q.length; li++) {
    if (l[li] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : null;
};

const CommandPalette = () => {
  const { t } = useTranslation();
  const { isOpen, close, commands } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Wait a tick so the element is mounted before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const withScores = commands
      .filter((cmd) => !cmd.disabled)
      .map((cmd) => {
        const haystack = [cmd.label, cmd.subtitle, ...(cmd.keywords || [])].filter(Boolean).join(' ');
        return { cmd, s: score(haystack, query) };
      })
      .filter((entry) => entry.s !== null)
      .sort((a, b) => b.s - a.s);

    return withScores.map((entry) => entry.cmd);
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups = [];
    const byGroup = {};
    filtered.forEach((cmd) => {
      const groupName = cmd.group || t('commandPaletteOther', 'Other');
      if (!byGroup[groupName]) {
        byGroup[groupName] = [];
        groups.push(groupName);
      }
      byGroup[groupName].push(cmd);
    });
    return groups.map((groupName) => ({ groupName, items: byGroup[groupName] }));
  }, [filtered, t]);

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector('[data-active="true"]');
    if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const runCommand = (cmd) => {
    if (!cmd) return;
    close();
    // Defer so the palette's own unmount/close doesn't fight with whatever
    // focus change the command performs (e.g. focusing the "new task" input).
    setTimeout(() => cmd.perform(), 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!isOpen) return null;

  let flatIndex = -1;

  return (
    <div className="command-palette-backdrop" onMouseDown={close}>
      <div
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('commandPaletteAria', 'Command palette')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="command-palette-input-row">
          <svg className="command-palette-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            className="command-palette-input"
            placeholder={t('commandPalettePlaceholder', 'Type a command or search…')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-palette-esc-hint">Esc</kbd>
        </div>

        <div className="command-palette-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="command-palette-empty">{t('commandPaletteNoResults', 'No matching commands')}</div>
          )}

          {grouped.map(({ groupName, items }) => (
            <div className="command-palette-group" key={groupName}>
              <div className="command-palette-group-label">{groupName}</div>
              {items.map((cmd) => {
                flatIndex += 1;
                const isActive = flatIndex === activeIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    className="command-palette-item"
                    data-active={isActive}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => runCommand(cmd)}
                  >
                    {cmd.icon && <span className="command-palette-item-icon">{cmd.icon}</span>}
                    <span className="command-palette-item-text">
                      <span className="command-palette-item-label">{cmd.label}</span>
                      {cmd.subtitle && <span className="command-palette-item-subtitle">{cmd.subtitle}</span>}
                    </span>
                    {cmd.shortcut && <span className="command-palette-item-shortcut">{cmd.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;