import React, { useState, useCallback, useEffect } from 'react';

import LancherixIcon from '../icons/lancherix.svg';
import LancherixDarkIcon from '../icons/lancherixDark.svg';
import SearchIcon from '../icons/search.svg';
import SearchDarkIcon from '../icons/searchDark.svg';

import './Styles/SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [themeMode, setThemeMode] = useState('light');

  // ─────────────────────────────────────────────
  // Fetch user theme (on mount)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          'https://lancherixstudio-backend.onrender.com/auth/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const user = await response.json();
        setThemeMode(user.themeMode);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // ─────────────────────────────────────────────
  // Debounced search (users + projects)
  // ─────────────────────────────────────────────
  const debouncedSearch = useCallback(() => {
    let timeout;

    return (value) => {
      clearTimeout(timeout);

      timeout = setTimeout(async () => {
        if (!value) {
          onSearch({ users: [], projects: [] });
          return;
        }

        try {
          const token = localStorage.getItem('token');

          const [usersRes, projectsRes] = await Promise.all([
            fetch(
              `https://lancherixstudio-backend.onrender.com/api/users/search?query=${value}`
            ),
            fetch(
              `https://lancherixstudio-backend.onrender.com/api/projects/search?query=${value}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            ),
          ]);

          if (!usersRes.ok || !projectsRes.ok) {
            throw new Error('Search failed');
          }

          const users = await usersRes.json();
          const projects = await projectsRes.json();

          onSearch({ users, projects });
        } catch (err) {
          console.error('Search error:', err);
          onSearch({ users: [], projects: [] });
        }
      }, 400);
    };
  }, [onSearch])();

  // ─────────────────────────────────────────────
  // Input handler
  // ─────────────────────────────────────────────
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className="all-searchBar">
      <div className="search-searchBar">
        <img
          src={
            themeMode === 'dark' || themeMode === 'glass'
              ? LancherixDarkIcon
              : LancherixIcon
          }
          alt="Lancherix"
          className="icon-searchBar iconOn-searchBar"
        />

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Lancherix Search…"
          spellCheck={false}
        />

        <img
          src={
            themeMode === 'dark' || themeMode === 'glass'
              ? SearchDarkIcon
              : SearchIcon
          }
          alt="Search"
          className="icon-searchBar iconOn-searchBar iconRight-searchBar"
        />
      </div>
    </div>
  );
};

export default SearchBar;