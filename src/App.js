import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import classnames from 'classnames';
import { jwtDecode } from 'jwt-decode';

import logo from './icons/loginLogo.png';

import SearchBar from './pages/SearchBar';
import HeaderBar from './pages/Mobile/HeaderBar';
import GlobeIcon from '../src/icons/globe.svg';
import LancherixIcon from './icons/lancherix.svg';
import PlayIcon from './icons/play.svg';
import ForwardIcon from './icons/forward.svg';
import BackIcon from './icons/back.svg';
import './App.css';

import SideMenu from './SideMenu';
import MenuMobile from './MenuMobile';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import SettingsPageMobile from './pages/Mobile/SettingsPageMobile';
import UserProfilePage from './pages/userPages/UserProfilePage';
import ProjectPage from './pages/ProjectPage';
import ProjectPageMobile from './pages/Mobile/ProjectPageMobile';
import AllProjectsPage from './pages/AllProjectsPage';
import AllProjectsMobile from './pages/Mobile/AllProjectsMobile';
import AuthRedirector from './api/AuthRedirector';

import './pages/Styles/LoginPage.css';
import './pages/Styles/RegisterPage.css';

const isUrl = (query) => /^(ftp|http[s]?):\/\/[^ "]+(\.[^ "]+)+$/.test(query);

const App = () => {
  const [results, setResults] = useState({
    users: [],
    projects: []
  });
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  const searchRef = useRef(null);
  const resultsScrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('menuCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const decodedToken = jwtDecode(token);

        const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const user = await response.json();
        setThemeMode(user.themeMode);
        setUsername(user.username);
        setError(null);

        // ── Apply wallpaper ──────────────────────────────────────────────────────
        if (user.wallpaper?.url) {
          document.body.style.backgroundImage = `url(${user.wallpaper.url})`;
        }

        // ── Apply saved theme mode ───────────────────────────────────────────────
        const themeMap = {
          glass: {
            theme: 'rgba(64,64,64,0.3)',
            text: 'aliceblue',
            placeholder: 'rgba(200,200,200,0.8)',
            border: '1px solid rgba(255,255,255,0.2)',
            alt: 'rgba(255,255,255,0.06)',
          },
          light: {
            theme: 'rgba(255,255,255,0.7)',
            text: 'black',
            placeholder: '#888',
            border: '1px solid transparent',
            alt: 'rgba(0,0,0,0.05)',
          },
          dark: {
            theme: 'rgba(64,64,64,0.7)',
            text: 'aliceblue',
            placeholder: 'rgba(200,200,200,0.8)',
            border: '1px solid transparent',
            alt: 'rgba(255,255,255,0.04)',
          },
        };
        const th = themeMap[user.themeMode] || themeMap.light;
        document.documentElement.style.setProperty('--theme', th.theme);
        document.documentElement.style.setProperty('--textTheme', th.text);
        document.documentElement.style.setProperty('--placeholderTheme', th.placeholder);
        document.documentElement.style.setProperty('--borderTheme', th.border);
        document.documentElement.style.setProperty('--altRow', th.alt);

        // ── Apply saved accent colour ────────────────────────────────────────────
        const colorMap = {
          'rgba(0, 147, 203, 1)': { menu: 'rgba(0,147,203,0.65)', btn: '#0074ff', hoverBtn: '#0056b3', hoverText: 'aliceblue', top: '#09191f', text: '#09191f' },
          'rgba(0, 128, 0, 1)': { menu: 'rgba(0,128,0,0.65)', btn: 'rgba(0,128,0,1)', hoverBtn: 'rgba(0,86,0,1)', hoverText: 'aliceblue', top: 'rgba(0,21,0,1)', text: 'aliceblue' },
          'rgba(128, 0, 128, 1)': { menu: 'rgba(128,0,128,0.65)', btn: 'rgba(128,0,128,1)', hoverBtn: 'rgba(86,0,86,1)', hoverText: 'aliceblue', top: 'rgba(22,0,22,1)', text: 'aliceblue' },
          'rgba(255, 0, 0, 1)': { menu: 'rgba(255,0,0,0.65)', btn: 'rgba(255,0,0,1)', hoverBtn: 'rgba(179,0,0,1)', hoverText: 'aliceblue', top: 'rgba(43,0,0,1)', text: 'rgba(43,0,0,1)' },
          'rgba(255, 255, 0, 1)': { menu: 'rgba(255,255,0,0.65)', btn: 'rgba(255,255,0,1)', hoverBtn: 'rgba(179,179,0,1)', hoverText: '#000', top: 'rgba(43,43,0,1)', text: 'rgba(43,43,0,1)' },
          'rgba(255, 129, 0, 1)': { menu: 'rgba(255,129,0,0.65)', btn: 'rgba(255,129,0,1)', hoverBtn: 'rgba(179,81,0,1)', hoverText: '#000', top: 'rgba(43,22,0,1)', text: 'rgba(43,22,0,1)' },
          'rgba(255, 192, 203, 1)': { menu: 'rgba(255,192,203,0.65)', btn: 'rgba(255,192,203,1)', hoverBtn: 'rgba(179,144,152,1)', hoverText: '#000', top: 'rgba(43,32,34,1)', text: 'rgba(43,32,34,1)' },
          'rgba(0, 255, 255, 1)': { menu: 'rgba(0,255,255,0.65)', btn: 'rgba(0,255,255,1)', hoverBtn: 'rgba(0,179,179,1)', hoverText: '#000', top: 'rgba(0,43,43,1)', text: 'rgba(0,43,43,1)' },
          'rgba(0, 0, 139, 1)': { menu: 'rgba(0,0,139,0.65)', btn: 'rgba(0,0,139,1)', hoverBtn: 'rgba(0,0,96,1)', hoverText: 'aliceblue', top: 'rgba(0,0,23,1)', text: 'aliceblue' },
          'rgba(0, 255, 0, 1)': { menu: 'rgba(0,255,0,0.65)', btn: 'rgba(0,255,0,1)', hoverBtn: 'rgba(0,179,0,1)', hoverText: '#000', top: 'rgba(0,43,0,1)', text: 'rgba(0,43,0,1)' },
          'rgba(255, 0, 255, 1)': { menu: 'rgba(255,0,255,0.65)', btn: 'rgba(255,0,255,1)', hoverBtn: 'rgba(179,0,179,1)', hoverText: '#000', top: 'rgba(43,0,43,1)', text: 'rgba(43,0,43,1)' },
          'rgba(255, 255, 254, 1)': { menu: 'rgba(255,255,255,0.65)', btn: '#A4A5A6', hoverBtn: '#737373', hoverText: '#000', top: 'rgba(43,43,43,1)', text: 'rgba(43,43,43,1)' },
          'rgba(64, 64, 64, 1)': { menu: 'rgba(64,64,64,0.65)', btn: '#A4A5A6', hoverBtn: '#737373', hoverText: 'aliceblue', top: 'rgba(11,11,11,1)', text: 'aliceblue' },
        };
        const savedColor = user.sideMenuColor || 'rgba(0, 147, 203, 1)';
        const c = colorMap[savedColor] || colorMap['rgba(0, 147, 203, 1)'];
        document.documentElement.style.setProperty('--menuColor', c.menu);
        document.documentElement.style.setProperty('--buttonColor', c.btn);
        document.documentElement.style.setProperty('--hoverButtonColor', c.hoverBtn);
        document.documentElement.style.setProperty('--hoverTextColor', c.hoverText);
        document.documentElement.style.setProperty('--topMenu', c.top);
        document.documentElement.style.setProperty('--textMenu', c.text);

      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(`Failed to fetch user data. ${error.message}`);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      if (
        searchRef.current &&
        searchRef.current.contains(event.target) &&
        (results.users.length > 0 || results.projects.length > 0)
      ) {
        setResultsScrollClass('resultsScroll-homePage');
      }
    };

    document.addEventListener('click', handleClickInside);
    return () => {
      document.removeEventListener('click', handleClickInside);
    };
  }, [results]);

  const handleSearch = ({ users, projects }) => {
    setError(null);
    setResults({ users, projects });

    if (users.length > 0 || projects.length > 0) {
      setResultsScrollClass('resultsScroll-homePage');
      setResultsClass('result-homePage');
    } else {
      setResultsScrollClass('resultsScroll-homePage noResult-homePage');
    }
  };

  const renderResult = (result, type) => {
    /*if (type === 'itunes') {
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
    }*/


    const profilePicture = result.profilePicture?.url || 'https://studio.lancherix.com/Images/defaultProfilePicture.png';
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
            <p>{result.firstName}{" "}{result.lastName}</p>
          </div>
        </div>
      </Link>
    );
  };

  const renderProjectResult = (project) => {
    return (
      <Link
        to={`/projects/${project.slug}`}
        key={project._id}
        className="aResult-homePage"
        onClick={() =>
          setResultsScrollClass('resultsScroll-homePage noResult-homePage')
        }
      >
        <div className="resultIcon-homePage">
          {project.icon || '📁'}
        </div>

        <p>
          <strong>{project.name} ·</strong> {project.owner.firstName}{" "}{project.owner.lastName}
        </p>
      </Link>
    );
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

  /*if (isMobile) {
    return (
      <div className="mobile-block">
        <div><img src={logo} alt='Lancherix' />
          This service is currently not available on mobile devices.
          Access it from a desktop or laptop computer.</div>
      </div>
    );
  }*/

  return (
    <Router>
      <div className="app-container">
        {token && (
          isMobile
            ? <MenuMobile />
            : <SideMenu isCollapsed={collapsed} toggleMenu={setCollapsed} />
        )}
        <div className={classnames('all-homePage', { collapsed })}>
          <div className={classnames('header-homePage', { collapsed })} ref={searchRef}>
            {token && (
              isMobile
                ? <HeaderBar />
                : <SearchBar onSearch={handleSearch} />
            )}
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
              {results.users.map(user => renderResult(user))}
              {results.projects.map(project => renderProjectResult(project))}
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
              <Route path="*" element={<AuthRedirector setToken={setToken} />} />
            ) : (
              <>
                <Route path="/" element={<HomePage />} />
                <Route path="/settings" element={isMobile ? <SettingsPageMobile /> : <SettingsPage />} />
                <Route path="/projects" element={isMobile ? <AllProjectsMobile /> : <AllProjectsPage />} />
                <Route path="/member/:username" element={<UserProfilePage />} />
                <Route path="/projects/:slug" element={isMobile ? <ProjectPageMobile /> : <ProjectPage />} />
                <Route path="/projects/:slug/notes" element={isMobile ? <ProjectPageMobile /> : <ProjectPage />} />
                <Route path="/projects/:slug/board" element={isMobile ? <ProjectPageMobile /> : <ProjectPage />} />
                <Route path="/projects/:slug/board/:filename" element={isMobile ? <ProjectPageMobile /> : <ProjectPage />} />
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