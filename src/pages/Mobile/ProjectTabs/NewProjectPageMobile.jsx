import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NewProjectPageMobile.css';

import IconPickerMobile from './IconPickerMobile';

const NewProjectPageMobile = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('rocket');
  const [visibility, setVisibility] = useState('private');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);
  const navigate = useNavigate();

  const resetForm = () => {
    setName('');
    setIcon('rocket');
    setVisibility('private');
    setSubject('');
    setDeadline('');
    setPriority('medium');
    setCollaborators([]);
    setInviteQuery('');
    setInviteResults([]);
    setError(null);
    setAdvancedOpen(false);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      resetForm();
      onClose();
    }, 300);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);
        const user = await response.json();
        setUsername(user.username);
        setError(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const debouncedInviteSearch = useCallback(() => {
    let timeout;
    return async (query) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        if (!query.trim() || !username) { setInviteResults([]); return; }
        try {
          const res = await fetch(`https://lancherixstudio-backend.onrender.com/api/users/search?query=${query}`);
          if (!res.ok) throw new Error('Invite search failed');
          const users = await res.json();
          const filtered = users.filter(u => u.username !== username && !collaborators.some(c => c._id === u._id));
          setInviteResults(filtered);
        } catch (err) {
          setInviteResults([]);
        }
      }, 400);
    };
  }, [collaborators, username])();

  const handleInviteChange = (e) => {
    const value = e.target.value;
    setInviteQuery(value);
    debouncedInviteSearch(value);
  };

  const inviteUser = (user) => {
    setCollaborators(prev => [...prev, user]);
    setInviteQuery('');
    setInviteResults([]);
  };

  const removeCollaborator = (id) => {
    setCollaborators(prev => prev.filter(u => u._id !== id));
  };

  const handleCreateProject = async () => {
    if (!name.trim()) { setError(t('projectNameRequired')); return; }
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('https://lancherixstudio-backend.onrender.com/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name, icon, visibility, subject,
          deadline: deadline || null,
          priority,
          collaborators: collaborators.map(u => u._id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('failedCreateProject'));
      resetForm();
      onClose();
      navigate(`/projects/${data.slug}`);
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !closing) return null;

  return createPortal(
    <div className={`npm-overlay ${closing ? 'npm-overlay--out' : 'npm-overlay--in'}`} onClick={handleClose}>
      <div
        ref={sheetRef}
        className={`npm-sheet ${closing ? 'npm-sheet--out' : 'npm-sheet--in'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="npm-handle-bar" />

        {/* Header */}
        <div className="npm-header">
          <button className="npm-cancel-btn" onClick={handleClose}>{t('cancel')}</button>
          <h2 className="npm-title">{t('newProject')}</h2>
          <button
            className="npm-create-btn"
            onClick={handleCreateProject}
            disabled={loading}
          >
            {loading ? '...' : t('create')}
          </button>
        </div>

        {/* Scrollable body */}
        <div className="npm-body">

          {/* Icon + Name row */}
          <div className="npm-icon-name-row">
            <div className="npm-icon-picker">
              <IconPickerMobile value={icon} onChange={setIcon} />
              <span className="npm-icon-hint">{t('icon')}</span>
            </div>
            <div className="npm-name-field">
              <label className="npm-label">{t('projectNameLabel')}</label>
              <input
                type="text"
                className="npm-input"
                placeholder={t('projectNamePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Privacy toggle */}
          <div className="npm-section">
            <label className="npm-label">{t('privacy')}</label>
            <div className="npm-segment">
              <button
                className={`npm-segment-btn ${visibility === 'private' ? 'npm-segment-btn--active' : ''}`}
                onClick={() => setVisibility('private')}
              >
                🔒 {t('private')}
              </button>
              <button
                className={`npm-segment-btn ${visibility === 'public' ? 'npm-segment-btn--active' : ''}`}
                onClick={() => setVisibility('public')}
              >
                🌐 {t('public')}
              </button>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            className="npm-advanced-toggle"
            onClick={() => setAdvancedOpen(v => !v)}
          >
            <span>{t('advancedOptions')}</span>
            <svg
              className={`npm-chevron ${advancedOpen ? 'npm-chevron--open' : ''}`}
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
            >
              <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Advanced panel */}
          <div className={`npm-advanced-panel ${advancedOpen ? 'npm-advanced-panel--open' : ''}`}>
            <div className="npm-section">
              <label className="npm-label">{t('subject')}</label>
              <input
                type="text"
                className="npm-input"
                placeholder={t('subjectPlaceholderExample')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div className="npm-section">
              <label className="npm-label">{t('colDeadline')}</label>
              <input
                type="datetime-local"
                className="npm-input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            <div className="npm-section">
              <label className="npm-label">{t('priority')}</label>
              <div className="npm-segment">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    className={`npm-segment-btn npm-segment-btn--priority ${priority === p ? `npm-segment-btn--active npm-priority--${p}` : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {t(p)}
                  </button>
                ))}
              </div>
            </div>

            <div className="npm-section">
              <label className="npm-label">{t('inviteCollaborators')}</label>
              <div className="npm-invite-row">
                <input
                  type="text"
                  className="npm-input npm-invite-input"
                  placeholder={t('searchUsernamePlaceholder')}
                  value={inviteQuery}
                  onChange={handleInviteChange}
                  spellCheck={false}
                />
                <button
                  className="npm-invite-btn"
                  disabled={!inviteQuery || !inviteResults[0]}
                  onClick={() => { if (inviteResults[0]) inviteUser(inviteResults[0]); }}
                >
                  {t('add')}
                </button>
              </div>

              {inviteResults.length > 0 && (
                <div className="npm-invite-results">
                  {inviteResults.map(user => {
                    const pic = user.profilePicture?.url || 'https://studio.lancherix.com/Images/defaultProfilePicture.png';
                    return (
                      <div key={user._id} className="npm-invite-result" onClick={() => inviteUser(user)}>
                        <div className="npm-invite-avatar" style={{ backgroundImage: `url(${pic})` }} />
                        <div className="npm-invite-info">
                          <strong>{user.username}</strong>
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {collaborators.length > 0 && (
                <div className="npm-chips">
                  {collaborators.map(user => (
                    <div key={user._id} className="npm-chip">
                      {user.username}
                      <span className="npm-chip-remove" onClick={() => removeCollaborator(user._id)}>×</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="npm-error">{error}</div>}

          {/* Bottom padding for safe area */}
          <div className="npm-safe-bottom" />
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default NewProjectPageMobile;