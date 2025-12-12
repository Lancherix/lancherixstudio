import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import HomeIcon from '../src/icons/home.svg';
import NotesIcon from '../src/icons/notes.svg';
import SettingsIcon from '../src/icons/settings.svg';
import ArrowLeftIcon from '../src/icons/arrow-left.svg';
import ArrowRightIcon from '../src/icons/arrow-right.svg';

import './SideMenu.css';

const SideMenu = ({ isCollapsed, toggleMenu }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [error, setError] = useState(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [sideMenuColor, setSideMenuColor] = useState('rgba(0, 147, 203, 1)');
  const [themeMode, setThemeMode] = useState('light');
  const [wallpaper, setWallpaper] = useState('url(/Images/backgroundImage.jpeg)');

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
        setFullName(user.fullName);
        setProfilePicture(user.profilePicture);
        setSideMenuColor(user.sideMenuColor);
        setWallpaper(user.wallpaper);
        setThemeMode(user.themeMode);
        setUsername(user.username); // Comes directly from backend now

        // Background wallpaper
        const body = document.querySelector('body');
        body.style.backgroundImage =
          `url(${user.wallpaper})` || 'url(/Images/backgroundImage.jpeg)';

        setError(null);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(`Failed to fetch user data. ${error.message}`);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    let themeValue;
    let textThemeValue;
    let placeholderThemeValue;
    let borderThemeValue;
    if (themeMode === 'glass') {
      themeValue = 'rgba(64, 64, 64, 0.3)';
      textThemeValue = 'aliceblue';
      placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
      borderThemeValue = '1px solid rgba(255, 255, 255, 0.2)';
    } else if (themeMode === 'light') {
      themeValue = 'rgba(255, 255, 255, 0.7)';
      textThemeValue = 'black';
      placeholderThemeValue = '#888';
      borderThemeValue = '1px solid transparent';
    } else if (themeMode === 'dark') {
      themeValue = 'rgba(64, 64, 64, 0.7)';
      textThemeValue = 'aliceblue';
      placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
      borderThemeValue = '1px solid transparent';
    } else {
      themeValue = 'rgba(64, 64, 64, 0.3)';
      textThemeValue = 'aliceblue';
      placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
      borderThemeValue = '1px solid rgba(255, 255, 255, 0.2)';
    }

    document.documentElement.style.setProperty('--theme', themeValue);
    document.documentElement.style.setProperty('--textTheme', textThemeValue);
    document.documentElement.style.setProperty('--placeholderTheme', placeholderThemeValue);
    document.documentElement.style.setProperty('--borderTheme', borderThemeValue);
  }, [themeMode]);

  useEffect(() => {
    let menuColor;
    let buttonColor;
    let hoverButtonColor;
    let hoverTextColor;
    let topMenu;
    if (sideMenuColor === 'rgba(0, 147, 203, 1)') {
      menuColor = 'rgba(0, 147, 203, 0.65)';
      buttonColor = '#0074ff';
      hoverButtonColor = '#0056b3';
      hoverTextColor = 'aliceblue';
      topMenu = '#09191f';
    } else if (sideMenuColor === 'rgba(0, 128, 0, 1)') {
      menuColor = 'rgba(0, 128, 0, 0.65)';
      buttonColor = 'rgba(0, 128, 0, 1)';
      hoverButtonColor = 'rgba(0, 86, 0, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(0, 21, 0, 1)';
    } else if (sideMenuColor === 'rgba(128, 0, 128, 1)') {
      menuColor = 'rgba(128, 0, 128, 0.65)';
      buttonColor = 'rgba(128, 0, 128, 1)';
      hoverButtonColor = 'rgba(86, 0, 86, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(22, 0, 22, 1)';
    } else if (sideMenuColor === 'rgba(255, 0, 0, 1)') {
      menuColor = 'rgba(255, 0, 0, 0.65)';
      buttonColor = 'rgba(255, 0, 0, 1)';
      hoverButtonColor = 'rgba(179, 0, 0, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(43, 0, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 255, 0, 1)') {
      menuColor = 'rgba(255, 255, 0, 0.65)';
      buttonColor = 'rgba(255, 255, 0, 1)';
      hoverButtonColor = 'rgba(179, 179, 0, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 43, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 129, 0, 1)') {
      menuColor = 'rgba(255, 129, 0, 0.65)';
      buttonColor = 'rgba(255, 129, 0, 1)';
      hoverButtonColor = 'rgba(179, 81, 0, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 22, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 192, 203, 1)') {
      menuColor = 'rgba(255, 192, 203, 0.65)';
      buttonColor = 'rgba(255, 192, 203, 1)';
      hoverButtonColor = 'rgba(179, 144, 152, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 32, 34, 1)';
    } else if (sideMenuColor === 'rgba(0, 255, 255, 1)') {
      menuColor = 'rgba(0, 255, 255, 0.65)';
      buttonColor = 'rgba(0, 255, 255, 1)';
      hoverButtonColor = 'rgba(0, 179, 179, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(0, 43, 43, 1)';
    } else if (sideMenuColor === 'rgba(0, 0, 139, 1)') {
      menuColor = 'rgba(0, 0, 139, 0.65)';
      buttonColor = 'rgba(0, 0, 139, 1)';
      hoverButtonColor = 'rgba(0, 0, 96, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(0, 0, 23, 1)';
    } else if (sideMenuColor === 'rgba(0, 255, 0, 1)') {
      menuColor = 'rgba(0, 255, 0, 0.65)';
      buttonColor = 'rgba(0, 255, 0, 1)';
      hoverButtonColor = 'rgba(0, 179, 0, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(0, 43, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 0, 255, 1)') {
      menuColor = 'rgba(255, 0, 255, 0.65)';
      buttonColor = 'rgba(255, 0, 255, 1)';
      hoverButtonColor = 'rgba(179, 0, 179, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 0, 43, 1)';
    } else if (sideMenuColor === 'rgba(255, 255, 254, 1)') {
      menuColor = 'rgba(255, 255, 255, 0.65)';
      buttonColor = '#A4A5A6';
      hoverButtonColor = '#737373';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 43, 43, 1)';
    } else if (sideMenuColor === 'rgba(64, 64, 64, 1)') {
      menuColor = 'rgba(64, 64, 64, 0.65)';
      buttonColor = '#A4A5A6';
      hoverButtonColor = '#737373';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(11, 11, 11, 1)';
    } else {
      menuColor = 'rgba(0, 147, 203, 0.65)';
      buttonColor = '#0074ff';
      hoverButtonColor = '#0056b3';
      hoverTextColor = 'aliceblue';
      topMenu = '#09191f';
    }

    document.documentElement.style.setProperty('--menuColor', menuColor);
    document.documentElement.style.setProperty('--buttonColor', buttonColor);
    document.documentElement.style.setProperty('--hoverButtonColor', hoverButtonColor);
    document.documentElement.style.setProperty('--hoverTextColor', hoverTextColor);
    document.documentElement.style.setProperty('--topMenu', topMenu);
  }, [sideMenuColor]);

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

  const handleToggleMenu = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    toggleMenu(newCollapsed);
  };

  return (
    <div className={`side-menu ${collapsed ? 'collapsed' : ''}`}>
      <div className="profile-section">
        <Link to={`/member/${username}`} className="profile-link">
          <div className="profile-picture" style={{ backgroundImage: `url(${profilePicture || 'https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7'})` }}>
          </div>
          {!collapsed && (
            <div className="profile-info">
              <p className='fullName-sideMenu'>{fullName}</p>
            </div>
          )}
        </Link>
      </div>
      <div className="menu-toggle" onClick={handleToggleMenu}>
        {collapsed ? (
          <img src={ArrowRightIcon} alt="Expand Menu" className="menu-icon arrow-icon" />
        ) : (
          <img src={ArrowLeftIcon} alt="Collapse Menu" className="menu-icon arrow-icon" />
        )}
      </div>
      <ul>
        <li>
          <Link to="/">
            <img src={HomeIcon} alt="Home" className="menu-icon" />
            {!collapsed && <span className="menu-text">Home</span>}
          </Link>
        </li>
        <li>
          <Link to="/notes">
            <img src={NotesIcon} alt="Cool" className="menu-icon" />
            {!collapsed && <span className="menu-text">Notes</span>}
          </Link>
        </li>
        <li>
          <Link to="/settings">
            <img src={SettingsIcon} alt="Settings" className="menu-icon" />
            {!collapsed && <span className="menu-text">Settings</span>}
          </Link>
        </li>
      </ul>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SideMenu;