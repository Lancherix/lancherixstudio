import React, { useState, useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

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

        // Set user data
        setThemeMode(user.themeMode);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // ─────────────────────────────────────────────
  // Debounced username search
  // ─────────────────────────────────────────────
  const debouncedSearch = useCallback(() => {
    let timeout;

    return async (searchQuery) => {
      clearTimeout(timeout);

      timeout = setTimeout(async () => {
        if (!searchQuery) {
          onSearch([]);
          return;
        }

        try {
          const res = await fetch(
            `https://lancherixstudio-backend.onrender.com/api/users/search?query=${searchQuery}`
          );

          if (!res.ok) throw new Error('Search failed');

          const users = await res.json();
          onSearch(users);
        } catch (err) {
          console.error('Search error:', err);
          onSearch([]);
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
          key={`logo-${themeMode}`}
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
          placeholder="Lancherix Search..."
          spellCheck={false}
        />

        <img
          key={`search-${themeMode}`}
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