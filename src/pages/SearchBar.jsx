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
          throw new Error('No token found');
        }

        const decodedToken = jwtDecode(token);

        const response = await fetch('https://lancherixstudioapi.onrender.com/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();

        const user = userData.find(user => user.username === decodedToken.username);
        if (user) {
          setThemeMode(user.themeMode);
          const body = document.querySelector('body');
          body.style.backgroundImage = (user.wallpaper) || 'url(/Images/backgroundImage.jpeg)';
        } else {
          localStorage.clear();
          window.location.reload();
        }

        setUsername(decodedToken.username);
        setError(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(`Failed to fetch user data. ${error.message}`);
      }
    };

    fetchUserData();
  }, []);

  const debouncedSearch = useCallback(
    _.debounce((searchQuery) => {
      onSearch(searchQuery);
    }, 500),
    []
  );

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    debouncedSearch(event.target.value);
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
          spellcheck="false"
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