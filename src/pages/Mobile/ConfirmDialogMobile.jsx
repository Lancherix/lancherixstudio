import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './LogoutPageMobile.css';
import './ConfirmDialogMobile.css';

const ConfirmDialogMobile = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  icon = '⚠️',
  confirmText,
  cancelText,
  danger = true,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const resolvedTitle = title ?? t('areYouSure');
  const resolvedConfirmText = confirmText ?? t('confirm');
  const resolvedCancelText = cancelText ?? t('cancel');

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
          <p className="mob-sheet-title">{resolvedTitle}</p>
        </div>

        <div className="mob-sheet-footer">
          <button
            className="mob-sheet-btn mob-sheet-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {resolvedCancelText}
          </button>
          <button
            className={`mob-sheet-btn ${danger ? 'mob-sheet-btn-primary' : 'mob-sheet-btn-neutral'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '...' : resolvedConfirmText}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default ConfirmDialogMobile;