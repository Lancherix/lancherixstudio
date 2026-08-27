import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './LogoutPageMobile.css';
import './ConfirmDialogMobile.css';

const ConfirmDialogMobile = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  icon = '⚠️',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="mob-sheet-overlay" onClick={onClose}>
      <div className="mob-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mob-sheet-handle" />

        <div className="mob-sheet-content">
          <span className="mob-sheet-icon">{icon}</span>
          <p className="mob-sheet-title">{title}</p>
        </div>

        <div className="mob-sheet-footer">
          <button
            className="mob-sheet-btn mob-sheet-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`mob-sheet-btn ${danger ? 'mob-sheet-btn-primary' : 'mob-sheet-btn-neutral'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default ConfirmDialogMobile;