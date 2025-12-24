import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './Styles/LogoutPage.css';

const LogoutPage = ({ isOpen, onClose }) => {
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
        <div className="new-project-overlay" onClick={handleLogoutCancel}>
            <div className="logout-window" onClick={(e) => e.stopPropagation()}>

                {/* Content */}
                <div className="logout-content">
                    <span style={{ fontSize: '3rem', textAlign: 'center', display: 'block' }}>⚠️</span>
                    <p>
                        Are you sure you want to log out?
                    </p>
                </div>
                <div className="logout-footer">
                    <button
                        className="secondary-btn logout-btn"
                        onClick={handleLogoutCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="primary-btn logout-btn"
                        onClick={handleLogoutAccept}
                        disabled={loading}
                    >
                        {loading ? 'Logging out...' : 'Log Out'}
                    </button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default LogoutPage;