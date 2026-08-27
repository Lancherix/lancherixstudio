import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ICON_KEYS } from '../../../icons/registry';
import ProjectIcon from '../../../icons/ProjectIcon';
import './IconPickerMobile.css';

const IconPickerMobile = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Focus the search input once the sheet has slid in
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, [open]);

  const filteredKeys = useMemo(() => {
    if (!query.trim()) return ICON_KEYS;
    const q = query.trim().toLowerCase();
    return ICON_KEYS.filter(key => key.toLowerCase().includes(q));
  }, [query]);

  const closeSheet = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, 250);
  };

  const handleSelect = (key) => {
    onChange(key);
    closeSheet();
  };

  return (
    <div className="icon-picker-mobile">
      <button
        type="button"
        className="icon-picker-mobile-trigger"
        onClick={() => setOpen(true)}
      >
        <ProjectIcon name={value} size={22} />
      </button>

      {open && createPortal(
        <div
          className={`icon-picker-mobile-backdrop ${closing ? 'icon-picker-mobile-backdrop--out' : 'icon-picker-mobile-backdrop--in'}`}
          onClick={closeSheet}
        >
          <div
            className={`icon-picker-mobile-sheet ${closing ? 'icon-picker-mobile-sheet--out' : 'icon-picker-mobile-sheet--in'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="icon-picker-mobile-handle" />

            <div className="icon-picker-mobile-header">
              <span className="icon-picker-mobile-title">Choose Icon</span>
              <button
                type="button"
                className="icon-picker-mobile-close"
                onClick={closeSheet}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L10.94 12l-5.72 5.72a.75.75 0 1 0 1.06 1.06L12 13.06l5.72 5.72a.75.75 0 1 0 1.06-1.06L13.06 12l5.72-5.72a.75.75 0 0 0-1.06-1.06L12 10.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <input
              ref={searchRef}
              type="text"
              className="icon-picker-mobile-search"
              placeholder="Search icons..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
            />

            <div className="icon-picker-mobile-grid">
              {filteredKeys.length > 0 ? (
                filteredKeys.map(key => (
                  <button
                    type="button"
                    key={key}
                    className={`icon-picker-mobile-option ${value === key ? 'selected' : ''}`}
                    onClick={() => handleSelect(key)}
                    title={key}
                  >
                    <ProjectIcon name={key} size={24} />
                  </button>
                ))
              ) : (
                <div className="icon-picker-mobile-empty">No icons found</div>
              )}
            </div>

            <div className="icon-picker-mobile-safe-bottom" />
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  );
};

export default IconPickerMobile;