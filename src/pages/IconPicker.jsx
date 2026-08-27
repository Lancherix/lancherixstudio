import React, { useState, useRef, useEffect } from 'react';
import { ICON_KEYS } from '../icons/registry';
import ProjectIcon from '../icons/ProjectIcon';
import './Styles/IconPicker.css';

const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

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
        <div className="icon-picker-grid">
          {ICON_KEYS.map(key => (
            <button
              type="button"
              key={key}
              className={`icon-picker-option ${value === key ? 'selected' : ''}`}
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
            >
              <ProjectIcon name={key} size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default IconPicker;