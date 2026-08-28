import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LogoutPageMobile.css';

const LogoutPageMobile = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogoutAccept = () => {
    setLoading(true);
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
    setLoading(false);
    onClose();
  };

  const handleLogoutCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="mob-sheet-overlay" onClick={handleLogoutCancel}>
      <div className="mob-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mob-sheet-handle" />

        <div className="mob-sheet-content">
          <span className="mob-sheet-icon">⚠️</span>
          <p className="mob-sheet-title">{t('confirmLogout')}</p>
        </div>

        <div className="mob-sheet-footer">
          <button
            className="mob-sheet-btn mob-sheet-btn-secondary"
            onClick={handleLogoutCancel}
            disabled={loading}
          >
            {t('cancel')}
          </button>
          <button
            className="mob-sheet-btn mob-sheet-btn-primary"
            onClick={handleLogoutAccept}
            disabled={loading}
          >
            {loading ? t('loggingOut') : t('logOut')}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default LogoutPageMobile;