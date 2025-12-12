import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import classnames from 'classnames';
import { jwtDecode } from 'jwt-decode';

import SearchBar from './pages/SearchBar';
import MusicIcon from '../src/icons/music.svg';
import HeadphonesIcon from '../src/icons/headphones.svg';
import TvIcon from '../src/icons/tv.svg';
import GlobeIcon from '../src/icons/globe.svg';
import LancherixIcon from './icons/lancherix.svg';
import PlayIcon from './icons/play.svg';
import ForwardIcon from './icons/forward.svg';
import BackIcon from './icons/back.svg';
import { fetchItunesData } from './pages/api/itunes';
import './App.css';

import IntroPage from './pages/IntroPage/IntroPage';
import LoginPage from './pages/IntroPage/LoginPage';
import RegisterPage from './pages/IntroPage/RegisterPage';
import SideMenu from './SideMenu';
import HomePage from './pages/HomePage';
import CoolPage from './pages/CoolPage';
import SettingsPage from './pages/SettingsPage';
import ITunesPage from './pages/iTunesPage';
import ItemDetails from './pages/ItemDetails';
import NotFound from './pages/NotFound';
import UserProfilePage from './pages/userPages/UserProfilePage';

const isUrl = (query) => /^(ftp|http[s]?):\/\/[^ "]+(\.[^ "]+)+$/.test(query);

const App = () => {
  const [results, setResults] = useState({ itunes: [], users: [] });
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [collapsed, setCollapsed] = useState(() => {
    const storedValue = localStorage.getItem('menuCollapsed');
    return storedValue !== null ? JSON.parse(storedValue) : true;
  });
  const [resultsClass, setResultsClass] = useState('result-homePage noResult-homePage');
  const [resultsScrollClass, setResultsScrollClass] = useState('resultsScroll-homePage noResult-homePage');
  const [urlClass, setUrlClass] = useState('aResult-homePage noResult-homePage');
  const [username, setUsername] = useState('');
  const [themeMode, setThemeMode] = useState('');

  const searchRef = useRef(null);
  const resultsScrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('menuCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const decodedToken = jwtDecode(token);

        const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const user = await response.json();
        setThemeMode(user.themeMode);
        setUsername(user.username);
        setError(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(`Failed to fetch user data. ${error.message}`);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchRef.current.contains(event.target) && !resultsScrollRef.current.contains(event.target)) {
        setResultsScrollClass('resultsScroll-homePage noResult-homePage');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickInside = (event) => {
      if (searchRef.current && searchRef.current.contains(event.target) && query.length !== 0) {
        setResultsScrollClass('resultsScroll-homePage');
      }
    };

    document.addEventListener('click', handleClickInside);
    return () => {
      document.removeEventListener('click', handleClickInside);
    };
  }, [query]);

  const handleSearch = async (query) => {
    setError(null);
    setQuery(query);

    if (!query) {
      setResults({ itunes: [], users: [] });
      return;
    }

    try {
      const [itunesData, usersData] = await Promise.all([
        fetchItunesData(query),
        fetch(`https://lancherixstudio-backend.onrender.com/api/users/search?query=${query}`).then((res) => res.json())
      ]);

      if (itunesData.length === 0 && usersData.length === 0) {
        setError("No results found.");
        setResultsClass("result-homePage noResult-homePage");
        setResultsScrollClass("resultsScroll-homePage noResult-homePage");
      } else {
        setResults({ itunes: itunesData, users: usersData });
        setResultsClass("result-homePage");
        setResultsScrollClass("resultsScroll-homePage");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("An error occurred while fetching data.");
      setResults({ itunes: [], users: [] });
      setResultsClass("result-homePage");
      setResultsScrollClass("resultsScroll-homePage");
    }
  };

  const renderResult = (result, type) => {
    if (type === 'itunes') {
      if (!result.trackName || !result.collectionName) {
        return null;
      }

      let imgSrc;
      switch (result.kind) {
        case 'song':
          imgSrc = MusicIcon;
          break;
        case 'tv-episode':
          imgSrc = TvIcon;
          break;
        case 'podcast':
          imgSrc = HeadphonesIcon;
          break;
        default:
          imgSrc = GlobeIcon;
          break;
      }

      return (
        <div key={result.trackId}>
          <div className='aResult-homePage'>
            <img src={imgSrc} className='resultIcon-homePage' alt="Icon" />
            {result.trackName || result.collectionName}
          </div>
        </div>
      );
    }

    if (type === 'user') {
      const profilePicture = result.profilePicture || 'https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7';
      return (
        <Link to={`/member/${result.username}`} key={result._id} className='aResultUser-homePage' onClick={() => setResultsScrollClass('resultsScroll-homePage noResult-homePage')}>
          <div className='aResult-homePage aResultUser-homePage'>
            <div className='resultPicture-homePage'
              style={{
                backgroundImage: `url(${profilePicture})`,
                cursor: 'pointer'
              }}>
            </div>
            <div className='resultUserInfo-homePage'>
              <h3>{result.username}</h3>
              <p>{result.fullName}</p>
            </div>
          </div>
        </Link>
      );
    }

    return null;
  };

  useEffect(() => {
    const updateUrlClass = () => {
      if (isUrl(query)) {
        setUrlClass('aResult-homePage');
        setResultsClass('result-homePage');
        setResultsScrollClass('resultsScroll-homePage');
      } else {
        setUrlClass('aResult-homePage noResult-homePage');
      }
    };
    updateUrlClass();
  }, [query]);

  const handleButtonClick = () => {
    window.open(query, '_blank');
  };

  return (
    <Router>
      <div className="app-container">
        {token && <SideMenu isCollapsed={collapsed} toggleMenu={setCollapsed} />}
        <div className={classnames('all-homePage', { collapsed })}>
          <div className={classnames('header-homePage', { collapsed })} ref={searchRef}>
            {token && <SearchBar onSearch={handleSearch} />}
          </div>
          <div ref={resultsScrollRef} className={classnames(resultsScrollClass, { collapsed })}>
            <div className={resultsClass}>
              {isUrl(query) && (
                <div className='aResult-homePage' onClick={handleButtonClick}>
                  <img src={GlobeIcon} className='resultIcon-homePage' alt="Icon" />
                  <p className='aResult-url'>Open URL in a new tab.</p>
                </div>
              )}
              {error && <p>{error}</p>}
              {results.users.map((user) => renderResult(user, 'user'))}
              {results.itunes.map((result) => renderResult(result, 'itunes'))}
            </div>
          </div>
          <div className='pod-musicPage no'>
            <div className='podCover-musicPage'>
              <img src={LancherixIcon} alt='Lancherix' className='podLancherix-musicPage' />
            </div>
            <div className='podBottom-musicPage'>
              <div className='podTimeline-musicPage'>

              </div>
              <div className='podControls-musicPage'>
                <img src={BackIcon} alt='Lancherix' className='podSkip-musicPage' />
                <img src={PlayIcon} alt='Lancherix' className='podPlay-musicPage' />
                <img src={ForwardIcon} alt='Lancherix' className='podSkip-musicPage' />
              </div>
            </div>
          </div>
        </div>
        <div className={classnames('content', { collapsed })} style={!token ? { marginLeft: '0', padding: '0', width: '100vw' } : {}}>
          <Routes>
            {!token ? (
              <>
                <Route path="/" element={<LoginPage setToken={setToken} />} />
                <Route path="/login" element={<LoginPage setToken={setToken} />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/notes" element={<CoolPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/itunes" element={<ITunesPage />} />
                <Route path="/itunes/:kind/:trackName/:trackId" element={<ItemDetails />} />
                <Route path="/member/:username" element={<UserProfilePage />} />
                <Route path="*" element={<HomePage />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;