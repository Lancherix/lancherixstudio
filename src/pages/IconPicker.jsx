import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ICON_KEYS } from '../icons/registry';
import ProjectIcon from '../icons/ProjectIcon';
import './Styles/IconPicker.css';

const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0, width: 260 });

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close when clicking outside either the trigger OR the portaled dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Compute position relative to the trigger, keep it updated on scroll/resize
  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + 6,
        left: rect.left,
        width: 260,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  // Focus the search input as soon as the picker opens
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const filteredKeys = useMemo(() => {
    if (!query.trim()) return ICON_KEYS;
    const q = query.trim().toLowerCase();
    return ICON_KEYS.filter(key => key.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="icon-picker">
      <button
        type="button"
        ref={triggerRef}
        className="icon-picker-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <ProjectIcon name={value} size={22} />
      </button>

      {open && createPortal(
        <div
          className="icon-picker-dropdown icon-picker-dropdown-portal"
          ref={dropdownRef}
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
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
        </div>,
        document.getElementById('modal-root') || document.body
      )}
    </div>
  );
};

export default IconPicker;