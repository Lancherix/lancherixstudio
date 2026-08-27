import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './EditProjectPageMobile.css';

import IconPickerMobile from './IconPickerMobile';

const EditProjectPageMobile = ({ isOpen, onClose, project, onUpdated }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [visibility, setVisibility] = useState('private');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [collaborators, setCollaborators] = useState([]);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [username, setUsername] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef(null);

  // Pre-populate fields when project changes
  useEffect(() => {
    if (!project) return;
    setName(project.name || '');
    setIcon(project.icon || 'folder');
    setVisibility(project.visibility || 'private');
    setSubject(project.subject || '');
    setDeadline(project.deadline ? project.deadline.slice(0, 16) : '');
    setPriority(project.priority || 'medium');
    setCollaborators(project.collaborators || []);
    setError(null);
  }, [project]);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const user = await res.json();
        setUsername(user.username);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setAdvancedOpen(false);
      setInviteQuery('');
      setInviteResults([]);
      setError(null);
      onClose();
    }, 300);
  };

  // Debounced collaborator search
  const debouncedInviteSearch = useCallback(() => {
    let timeout;
    return async (query) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        if (!query.trim() || !username) { setInviteResults([]); return; }
        try {
          const res = await fetch(
            `https://lancherixstudio-backend.onrender.com/api/users/search?query=${query}`
          );
          if (!res.ok) throw new Error('Search failed');
          const users = await res.json();
          const filtered = users.filter(
            u => u.username !== username && !collaborators.some(c => c._id === u._id)
          );
          setInviteResults(filtered);
        } catch {
          setInviteResults([]);
        }
      }, 400);
    };
  }, [collaborators, username])();

  const handleInviteChange = (e) => {
    setInviteQuery(e.target.value);
    debouncedInviteSearch(e.target.value);
  };

  const inviteUser = async (user) => {
    setCollaborators(prev => [...prev, user]);
    setInviteQuery('');
    setInviteResults([]);

    // Persist invite immediately (same as desktop EditProjectPage)
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `https://lancherixstudio-backend.onrender.com/api/projects/${project._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            collaborators: [...collaborators.map(c => c._id), user._id],
          }),
        }
      );
      await fetch(
        `https://lancherixstudio-backend.onrender.com/api/users/${user._id}/add-project`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ projectId: project._id }),
        }
      );
    } catch (err) {
      setError('Failed to invite user');
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Project name is required'); return; }
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/projects/${project._id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name, icon, visibility, subject,
            deadline: deadline || null,
            priority,
            collaborators: collaborators.map(u => u._id),
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to update project');
      const updated = await res.json();
      onUpdated?.(updated);
      handleClose();
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen && !closing) return null;

  return createPortal(
    <div
      className={`epm-overlay ${closing ? 'epm-overlay--out' : 'epm-overlay--in'}`}
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        className={`epm-sheet ${closing ? 'epm-sheet--out' : 'epm-sheet--in'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="epm-handle-bar" />

        {/* Header */}
        <div className="epm-header">
          <button className="epm-cancel-btn" onClick={handleClose}>Cancel</button>
          <h2 className="epm-title">Edit Project</h2>
          <button className="epm-save-btn" onClick={handleSave} disabled={loading}>
            {loading ? '...' : 'Save'}
          </button>
        </div>

        {/* Scrollable body */}
        <div className="epm-body">

          {/* Icon + Name */}
          <div className="epm-icon-name-row">
            <div className="epm-icon-picker">
              <IconPickerMobile value={icon} onChange={setIcon} />
              <span className="epm-icon-hint">Icon</span>
            </div>
            <div className="epm-name-field">
              <label className="epm-label">Project Name</label>
              <input
                type="text"
                className="epm-input"
                placeholder="My Project"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="epm-section">
            <label className="epm-label">Privacy</label>
            <div className="epm-segment">
              <button
                className={`epm-segment-btn ${visibility === 'private' ? 'epm-segment-btn--active' : ''}`}
                onClick={() => setVisibility('private')}
              >
                🔒 Private
              </button>
              <button
                className={`epm-segment-btn ${visibility === 'public' ? 'epm-segment-btn--active' : ''}`}
                onClick={() => setVisibility('public')}
              >
                🌐 Public
              </button>
            </div>
          </div>

          {/* Advanced toggle */}
          <button className="epm-advanced-toggle" onClick={() => setAdvancedOpen(v => !v)}>
            <span>Advanced Options</span>
            <svg
              className={`epm-chevron ${advancedOpen ? 'epm-chevron--open' : ''}`}
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
            >
              <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Advanced panel */}
          <div className={`epm-advanced-panel ${advancedOpen ? 'epm-advanced-panel--open' : ''}`}>

            <div className="epm-section">
              <label className="epm-label">Subject</label>
              <input
                type="text"
                className="epm-input"
                placeholder="e.g. Physics"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <div className="epm-section">
              <label className="epm-label">Deadline</label>
              <input
                type="datetime-local"
                className="epm-input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>

            <div className="epm-section">
              <label className="epm-label">Priority</label>
              <div className="epm-segment">
                {['low', 'medium', 'high'].map(p => (
                  <button
                    key={p}
                    className={`epm-segment-btn epm-segment-btn--priority ${priority === p ? `epm-segment-btn--active epm-priority--${p}` : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="epm-section">
              <label className="epm-label">Invite Collaborators</label>
              <div className="epm-invite-row">
                <input
                  type="text"
                  className="epm-input epm-invite-input"
                  placeholder="Search username…"
                  value={inviteQuery}
                  onChange={handleInviteChange}
                  spellCheck={false}
                />
                <button
                  className="epm-invite-btn"
                  disabled={!inviteQuery || !inviteResults[0]}
                  onClick={() => { if (inviteResults[0]) inviteUser(inviteResults[0]); }}
                >
                  Add
                </button>
              </div>

              {inviteResults.length > 0 && (
                <div className="epm-invite-results">
                  {inviteResults.map(user => {
                    const pic = user.profilePicture?.url ||
                      'https://studio.lancherix.com/Images/defaultProfilePicture.png';
                    return (
                      <div key={user._id} className="epm-invite-result" onClick={() => inviteUser(user)}>
                        <div className="epm-invite-avatar" style={{ backgroundImage: `url(${pic})` }} />
                        <div className="epm-invite-info">
                          <strong>{user.username}</strong>
                          <span>{user.firstName} {user.lastName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Current collaborators (read-only chips, matching desktop) */}
              {collaborators.length > 0 && (
                <div className="epm-chips">
                  {collaborators.map(user => (
                    <div key={user._id} className="epm-chip">
                      {user.username}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <div className="epm-error">{error}</div>}

          <div className="epm-safe-bottom" />
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default EditProjectPageMobile;