import React, { useState, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { jwtDecode } from 'jwt-decode';
import LancherixIcon from '../icons/lancherix.svg';
import LancherixDarkIcon from '../icons/lancherixDark.svg';
import SearchIcon from '../icons/search.svg';
import SearchDarkIcon from '../icons/searchDark.svg';

import './Styles/SearchBar.css'

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [username, setUsername] = useState('');
  const [themeMode, setThemeMode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found');
          setThemeMode('light'); // fallback theme
          return;
        }

        const decodedToken = jwtDecode(token);

        // Make sure this matches your backend route:
        const response = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/users?username=${decodedToken.username}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          console.warn(
            `Failed to fetch user data: ${response.status} ${response.statusText}`
          );
          setThemeMode('light'); // fallback theme
          return;
        }

        const user = await response.json();

        if (user) {
          setThemeMode(user.themeMode || 'light');
          setUsername(decodedToken.username);
          const body = document.querySelector('body');
          body.style.backgroundImage =
            user.wallpaper || 'url(/Images/backgroundImage.jpeg)';
        } else {
          console.warn('User not found, clearing local storage');
          localStorage.clear();
          setThemeMode('light');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setThemeMode('light'); // ensure input still renders
      }
    };

    fetchUserData();
  }, []);

  const debouncedSearch = useCallback(
    _.debounce(async (searchQuery) => {
      console.log("Debounced search query:", searchQuery);
      if (!searchQuery) {
        onSearch({ itunes: [], users: [] });
        return;
      }

      try {
        const response = await fetch(`https://lancherixstudio-backend.onrender.com/api/users/search?query=${searchQuery}`);
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);
        const users = await response.json();
        console.log("Users from backend:", users);
        onSearch({ itunes: [], users }); // merge with iTunes in App.js if needed
      } catch (err) {
        console.error('Search error:', err);
        onSearch({ itunes: [], users: [] });
      }
    }, 500),
    [onSearch]
  );

  const handleInputChange = (event) => {
    const value = event.target.value;
    console.log("SearchBar input:", value);
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className='all-searchBar'>
      <div className='search-searchBar'>
        {themeMode === 'dark' || themeMode === 'glass' ? (
          <img src={LancherixDarkIcon} alt='Lancherix' className='icon-searchBar iconOn-searchBar' />
        ) : (
          <img src={LancherixIcon} alt='Lancherix' className='icon-searchBar iconOn-searchBar' />
        )}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Lancherix Search..."
          spellCheck={false}
        />

        {themeMode === 'dark' || themeMode === 'glass' ? (
          <img src={SearchDarkIcon} alt='Search' className='icon-searchBar iconOn-searchBar iconRight-searchBar' />
        ) : (
          <img src={SearchIcon} alt='Search' className='icon-searchBar iconOn-searchBar iconRight-searchBar' />
        )}
      </div>
    </div>
  );
};

export default SearchBar;