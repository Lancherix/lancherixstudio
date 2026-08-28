import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './SearchPageMobile.css';
import ProjectIcon from '../../icons/ProjectIcon';

const SearchPageMobile = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [themeMode, setThemeMode] = useState('light');
  const [results, setResults] = useState({ users: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const user = await response.json();
        setThemeMode(user.themeMode);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const debouncedSearch = useCallback(() => {
    let timeout;
    return (value) => {
      clearTimeout(timeout);
      if (!value) { setResults({ users: [], projects: [] }); return; }
      timeout = setTimeout(async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const [usersRes, projectsRes] = await Promise.all([
            fetch(`https://lancherixstudio-backend.onrender.com/api/users/search?query=${value}`),
            fetch(`https://lancherixstudio-backend.onrender.com/api/projects/search?query=${value}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          const users = usersRes.ok ? await usersRes.json() : [];
          const projects = projectsRes.ok ? await projectsRes.json() : [];
          setResults({ users, projects });
        } catch (err) {
          setResults({ users: [], projects: [] });
        } finally {
          setLoading(false);
        }
      }, 400);
    };
  }, [])();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setQuery('');
      setResults({ users: [], projects: [] });
      onClose();
    }, 260);
  };

  const handleResultClick = () => {
    handleClose();
  };

  const hasResults = results.users.length > 0 || results.projects.length > 0;

  return (
    <>
      {/* Full-screen overlay portal */}
      {(isOpen || closing) && createPortal(
        <div className={`sbm-overlay ${closing ? 'sbm-overlay--out' : 'sbm-overlay--in'}`}>

          {/* Search bar row */}
          <div className="sbm-bar">
            <div className="sbm-input-wrap">
              <svg className="sbm-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                className="sbm-input"
                placeholder={t('searchPeopleProjectsPlaceholder')}
                value={query}
                onChange={handleInputChange}
                spellCheck={false}
                autoComplete="off"
              />
              {query.length > 0 && (
                <button className="sbm-clear" onClick={() => { setQuery(''); setResults({ users: [], projects: [] }); }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </div>
            <button className="sbm-cancel" onClick={handleClose}>{t('cancel')}</button>
          </div>

          {/* Results */}
          <div className="sbm-results">
            {loading && (
              <div className="sbm-state">
                <div className="sbm-spinner" />
              </div>
            )}

            {!loading && query && !hasResults && (
              <div className="sbm-state sbm-state--empty">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                </svg>
                <p>{t('noResultsFor')} <strong>"{query}"</strong></p>
              </div>
            )}

            {!loading && !query && (
              <div className="sbm-state sbm-state--hint">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
                </svg>
                <p>{t('searchHint')}</p>
              </div>
            )}

            {!loading && results.users.length > 0 && (
              <div className="sbm-section">
                <p className="sbm-section-label">{t('peopleLabel')}</p>
                {results.users.map(user => {
                  const pic = user.profilePicture?.url || 'https://studio.lancherix.com/Images/defaultProfilePicture.png';
                  return (
                    <Link
                      key={user._id}
                      to={`/member/${user.username}`}
                      className="sbm-result-row"
                      onClick={handleResultClick}
                    >
                      <div className="sbm-avatar" style={{ backgroundImage: `url(${pic})` }} />
                      <div className="sbm-result-info">
                        <strong>{user.username}</strong>
                        <span>{user.firstName} {user.lastName}</span>
                      </div>
                      <svg className="sbm-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            )}

            {!loading && results.projects.length > 0 && (
              <div className="sbm-section">
                <p className="sbm-section-label">{t('projects')}</p>
                {results.projects.map(project => (
                  <Link
                    key={project._id}
                    to={`/projects/${project.slug}`}
                    className="sbm-result-row"
                    onClick={handleResultClick}
                  >
                    <div className="sbm-project-icon"><ProjectIcon name={project.icon} size={26} /></div>
                    <div className="sbm-result-info">
                      <strong>{project.name}</strong>
                      <span>{project.owner?.firstName} {project.owner?.lastName}</span>
                    </div>
                    <svg className="sbm-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.getElementById('modal-root')
      )}
    </>
  );
};

export default SearchPageMobile;