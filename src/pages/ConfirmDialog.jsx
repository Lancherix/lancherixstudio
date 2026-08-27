import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './Styles/LogoutPage.css';

const ConfirmDialog = ({
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
    <div className="new-project-overlay" onClick={onClose}>
      <div className="logout-window" onClick={(e) => e.stopPropagation()}>
        <div className="logout-content">
          <span style={{ fontSize: '3rem', textAlign: 'center', display: 'block' }}>
            {icon}
          </span>
          <p>{title}</p>
        </div>
        <div className="logout-footer">
          <button
            className="secondary-btn logout-btn"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            className={`${danger ? 'primary-btn' : 'secondary-btn'} logout-btn`}
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

export default ConfirmDialog;