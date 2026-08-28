import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './Styles/LogoutPage.css';

const ConfirmDialog = ({
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
    <div className="new-project-overlay" onClick={onClose}>
      <div className="logout-window" onClick={(e) => e.stopPropagation()}>
        <div className="logout-content">
          <span style={{ fontSize: '3rem', textAlign: 'center', display: 'block' }}>
            {icon}
          </span>
          <p>{resolvedTitle}</p>
        </div>
        <div className="logout-footer">
          <button
            className="secondary-btn logout-btn"
            onClick={onClose}
            disabled={loading}
          >
            {resolvedCancelText}
          </button>
          <button
            className={`${danger ? 'primary-btn' : 'secondary-btn'} logout-btn`}
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

export default ConfirmDialog;