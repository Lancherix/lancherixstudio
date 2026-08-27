import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ICON_KEYS } from '../icons/registry';
import ProjectIcon from '../icons/ProjectIcon';
import './Styles/IconPicker.css';

const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Focus the search input as soon as the picker opens
  useEffect(() => {
    if (open) {
      setQuery('');
      // slight delay so the input exists in the DOM before focusing
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const filteredKeys = useMemo(() => {
    if (!query.trim()) return ICON_KEYS;
    const q = query.trim().toLowerCase();
    return ICON_KEYS.filter(key => key.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="icon-picker" ref={wrapperRef}>
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <ProjectIcon name={value} size={22} />
      </button>

      {open && (
        <div className="icon-picker-dropdown">
          <input
            ref={searchRef}
            type="text"
            className="icon-picker-search"
            placeholder="Search icons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />

          <div className="icon-picker-grid">
            {filteredKeys.length > 0 ? (
              filteredKeys.map(key => (
                <button
                  type="button"
                  key={key}
                  className={`icon-picker-option ${value === key ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  title={key}
                >
                  <ProjectIcon name={key} size={20} />
                </button>
              ))
            ) : (
              <div className="icon-picker-empty">No icons found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;