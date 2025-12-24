import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './Styles/NewProjectPage.css';

const NewProjectPage = ({ isOpen, onClose }) => {
  const [error, setError] = useState(null);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [username, setUsername] = useState('');
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🚀");
  const [visibility, setVisibility] = useState("private");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const resetForm = () => {
    setName("");
    setIcon("🚀");
    setVisibility("private");
    setSubject("");
    setDeadline("");
    setPriority("medium");
    setCollaborators([]);
    setInviteQuery("");
    setInviteResults([]);
    setError(null);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const user = await response.json();

        setUsername(user.username);

        setError(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(`Failed to fetch user data. ${error.message}`);
      }
    };

    fetchUserData();
  }, []);

  const debouncedInviteSearch = useCallback(() => {
    let timeout;

    return async (query) => {
      clearTimeout(timeout);

      timeout = setTimeout(async () => {
        if (!query.trim()) {
          setInviteResults([]);
          return;
        }

        if (!username) {
          setInviteResults([]);
          return;
        }

        try {
          const res = await fetch(
            `https://lancherixstudio-backend.onrender.com/api/users/search?query=${query}`
          );

          if (!res.ok) throw new Error('Invite search failed');

          const users = await res.json();

          // Remove already invited users
          const filtered = users.filter(
            u => u.username !== username && !collaborators.some(c => c._id === u._id)
          );

          setInviteResults(filtered);
        } catch (err) {
          console.error(err);
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
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        "https://lancherixstudio-backend.onrender.com/api/projects",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            icon,
            visibility,
            subject,
            deadline: deadline || null,
            priority,
            collaborators: collaborators.map((u) => u._id),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      resetForm();
      onClose();
      navigate(`/projects/${data.slug}`);
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="new-project-overlay">
      <div
        className="new-project-window"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="new-project-header">
          <h4>New Project</h4>
        </div>

        {/* Content */}
        <div className="new-project-content">
          <div className="form-row form-row-a form-row-name">
            <label>Name</label>
            <input
              type="text"
              placeholder="My New Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row form-row-a form-row-name">
            <label>Icon</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => {
                const value = e.target.value;
                const emojiRegex = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu;
                const match = value.match(emojiRegex);
                if (match) {
                  setIcon(match[0]);
                } else {
                  setIcon('');
                }
              }}
              placeholder="Choose an emoji (Windows: Win + (.) or Mac: Ctrl + Cmd + Space)"
              maxLength={2}
            />
          </div>

          <div className="form-row form-row-a form-row-privacy">
            <label>Privacy</label>
            <div className="radio-group">
              <div>
                <input
                  type="radio"
                  name="privacy"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                /> Private
              </div>
              <div>
                <input
                  type="radio"
                  name="privacy"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                /> Public
              </div>
            </div>
          </div>

          <div className="advanced">
            <details>
              <summary>Advanced Options</summary>

              <div className="form-row form-row-subject">
                <label>Subject</label>
                <input
                  type="text"
                  placeholder="Physics"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-row form-row-priority">
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="form-row form-row-priority">
                <label>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="advanced-collaborators">
                <label>Invite Collaborators</label>

                {/* Input */}
                <div className="inviteCollaborators-row">
                  <input
                    type="text"
                    placeholder="Add username"
                    value={inviteQuery}
                    onChange={handleInviteChange}
                    spellCheck={false}
                  />
                  <button
                    className="primary-btn"
                    disabled={!inviteQuery}
                    onClick={() => {
                      if (inviteResults[0]) inviteUser(inviteResults[0]);
                    }}
                  >
                    Invite
                  </button>
                </div>

                {/* Results dropdown */}
                {inviteResults.length > 0 && (
                  <div className="invite-results">
                    {inviteResults.map(user => {
                      const profilePicture =
                        user.profilePicture?.url ||
                        'https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7';

                      return (
                        <div
                          key={user._id}
                          className="invite-result"
                          onClick={() => inviteUser(user)}
                        >
                          <div
                            className="invite-avatar"
                            style={{ backgroundImage: `url(${profilePicture})` }}
                          />
                          <div className="invite-info">
                            <strong>{user.username}</strong>
                            <span>{user.fullName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Chips */}
                <div className="collaborator-chips">
                  {collaborators.map(user => (
                    <div key={user._id} className="chip">
                      {user.username}
                      <span onClick={() => removeCollaborator(user._id)}>×</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
          <div className='new-project-content-error'>
            {error && <div className="form-error">{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="new-project-footer">
          <button
            className="secondary-btn"
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={handleCreateProject}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );

};

export default NewProjectPage;