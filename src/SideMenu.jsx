import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import NewProjectPage from './pages/NewProjectPage';
import { language } from './language';

import './SideMenu.css';

const SideMenu = ({ isCollapsed, toggleMenu }) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [error, setError] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [sideMenuColor, setSideMenuColor] = useState('rgba(0, 147, 203, 1)');
  const [themeMode, setThemeMode] = useState('light');
  const [wallpaper, setWallpaper] = useState('url(/Images/backgroundImage.jpeg)');
  const [showNewProject, setShowNewProject] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentLang, setCurrentLang] = useState('en-US');

  const t = (key) => {
    return language[currentLang]?.[key] || language['en-US'][key];
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

        // Set user data
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setProfilePicture(user.profilePicture?.url || "https://studio.lancherix.com/Images/defaultProfilePicture.png");
        setSideMenuColor(user.sideMenuColor);
        setWallpaper(user.wallpaper?.url || "/Images/backgroundImage.jpeg");
        setThemeMode(user.themeMode);
        setUsername(user.username);
        setProjects(user.projects || []);
        setCurrentLang(user.language || 'en-US');

        // Background wallpaper
        const body = document.querySelector('body');
        body.style.backgroundImage =
          `url(${user.wallpaper?.url})` || 'url(/Images/backgroundImage.jpeg)';

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
    let altRowValue;
    if (themeMode === 'glass') {
      themeValue = 'rgba(64, 64, 64, 0.3)';
      textThemeValue = 'aliceblue';
      placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
      borderThemeValue = '1px solid rgba(255, 255, 255, 0.2)';
      altRowValue = 'rgba(255, 255, 255, 0.06)';
    } else if (themeMode === 'light') {
      themeValue = 'rgba(255, 255, 255, 0.7)';
      textThemeValue = 'black';
      placeholderThemeValue = '#888';
      borderThemeValue = '1px solid transparent';
      altRowValue = 'rgba(0, 0, 0, 0.05)';
    } else if (themeMode === 'dark') {
      themeValue = 'rgba(64, 64, 64, 0.7)';
      textThemeValue = 'aliceblue';
      placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
      borderThemeValue = '1px solid transparent';
      altRowValue = 'rgba(255, 255, 255, 0.04)';
    } else {
      themeValue = 'rgba(255, 255, 255, 0.7)';
      textThemeValue = 'black';
      placeholderThemeValue = '#888)';
      borderThemeValue = '1px solid transparent';
      altRowValue = 'rgba(0, 0, 0, 0.05)';
    }

    document.documentElement.style.setProperty('--theme', themeValue);
    document.documentElement.style.setProperty('--textTheme', textThemeValue);
    document.documentElement.style.setProperty('--placeholderTheme', placeholderThemeValue);
    document.documentElement.style.setProperty('--borderTheme', borderThemeValue);
    document.documentElement.style.setProperty('--altRow', altRowValue);
  }, [themeMode]);

  useEffect(() => {
    let menuColor;
    let buttonColor;
    let hoverButtonColor;
    let hoverTextColor;
    let topMenu;
    let textMenu;
    if (sideMenuColor === 'rgba(0, 147, 203, 1)') {
      menuColor = 'rgba(0, 147, 203, 0.65)';
      buttonColor = '#0074ff';
      hoverButtonColor = '#0056b3';
      hoverTextColor = 'aliceblue';
      topMenu = '#09191f';
      textMenu = '#09191f';
    } else if (sideMenuColor === 'rgba(0, 128, 0, 1)') {
      menuColor = 'rgba(0, 128, 0, 0.65)';
      buttonColor = 'rgba(0, 128, 0, 1)';
      hoverButtonColor = 'rgba(0, 86, 0, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(0, 21, 0, 1)';
      textMenu = 'aliceblue';
    } else if (sideMenuColor === 'rgba(128, 0, 128, 1)') {
      menuColor = 'rgba(128, 0, 128, 0.65)';
      buttonColor = 'rgba(128, 0, 128, 1)';
      hoverButtonColor = 'rgba(86, 0, 86, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(22, 0, 22, 1)';
      textMenu = 'aliceblue';
    } else if (sideMenuColor === 'rgba(255, 0, 0, 1)') {
      menuColor = 'rgba(255, 0, 0, 0.65)';
      buttonColor = 'rgba(255, 0, 0, 1)';
      hoverButtonColor = 'rgba(179, 0, 0, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(43, 0, 0, 1)';
      textMenu = 'rgba(43, 0, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 255, 0, 1)') {
      menuColor = 'rgba(255, 255, 0, 0.65)';
      buttonColor = 'rgba(255, 255, 0, 1)';
      hoverButtonColor = 'rgba(179, 179, 0, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 43, 0, 1)';
      textMenu = 'rgba(43, 43, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 129, 0, 1)') {
      menuColor = 'rgba(255, 129, 0, 0.65)';
      buttonColor = 'rgba(255, 129, 0, 1)';
      hoverButtonColor = 'rgba(179, 81, 0, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 22, 0, 1)';
      textMenu = 'rgba(43, 22, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 192, 203, 1)') {
      menuColor = 'rgba(255, 192, 203, 0.65)';
      buttonColor = 'rgba(255, 192, 203, 1)';
      hoverButtonColor = 'rgba(179, 144, 152, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 32, 34, 1)';
      textMenu = 'rgba(43, 32, 34, 1)';
    } else if (sideMenuColor === 'rgba(0, 255, 255, 1)') {
      menuColor = 'rgba(0, 255, 255, 0.65)';
      buttonColor = 'rgba(0, 255, 255, 1)';
      hoverButtonColor = 'rgba(0, 179, 179, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(0, 43, 43, 1)';
      textMenu = 'rgba(0, 43, 43, 1)';
    } else if (sideMenuColor === 'rgba(0, 0, 139, 1)') {
      menuColor = 'rgba(0, 0, 139, 0.65)';
      buttonColor = 'rgba(0, 0, 139, 1)';
      hoverButtonColor = 'rgba(0, 0, 96, 1)';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(0, 0, 23, 1)';
      textMenu = 'aliceblue';
    } else if (sideMenuColor === 'rgba(0, 255, 0, 1)') {
      menuColor = 'rgba(0, 255, 0, 0.65)';
      buttonColor = 'rgba(0, 255, 0, 1)';
      hoverButtonColor = 'rgba(0, 179, 0, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(0, 43, 0, 1)';
      textMenu = 'rgba(0, 43, 0, 1)';
    } else if (sideMenuColor === 'rgba(255, 0, 255, 1)') {
      menuColor = 'rgba(255, 0, 255, 0.65)';
      buttonColor = 'rgba(255, 0, 255, 1)';
      hoverButtonColor = 'rgba(179, 0, 179, 1)';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 0, 43, 1)';
      textMenu = 'rgba(43, 0, 43, 1)';
    } else if (sideMenuColor === 'rgba(255, 255, 254, 1)') {
      menuColor = 'rgba(255, 255, 255, 0.65)';
      buttonColor = '#A4A5A6';
      hoverButtonColor = '#737373';
      hoverTextColor = '#000';
      topMenu = 'rgba(43, 43, 43, 1)';
      textMenu = 'rgba(43, 43, 43, 1)';
    } else if (sideMenuColor === 'rgba(64, 64, 64, 1)') {
      menuColor = 'rgba(64, 64, 64, 0.65)';
      buttonColor = '#A4A5A6';
      hoverButtonColor = '#737373';
      hoverTextColor = 'aliceblue';
      topMenu = 'rgba(11, 11, 11, 1)';
      textMenu = 'aliceblue';
    } else {
      menuColor = 'rgba(0, 147, 203, 0.65)';
      buttonColor = '#0074ff';
      hoverButtonColor = '#0056b3';
      hoverTextColor = 'aliceblue';
      topMenu = '#09191f';
      textMenu = '#09191f';
    }

    document.documentElement.style.setProperty('--menuColor', menuColor);
    document.documentElement.style.setProperty('--buttonColor', buttonColor);
    document.documentElement.style.setProperty('--hoverButtonColor', hoverButtonColor);
    document.documentElement.style.setProperty('--hoverTextColor', hoverTextColor);
    document.documentElement.style.setProperty('--topMenu', topMenu);
    document.documentElement.style.setProperty('--textMenu', textMenu);
  }, [sideMenuColor]);

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

  const handleToggleMenu = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    toggleMenu(newCollapsed);
  };

  const visibleProjects = projects
    // 1. Hide unwanted statuses
    .filter(project =>
      !["hidden", "archived", "completed"].includes(project?.status)
    )
    // 2. Pinned projects first
    .sort((a, b) => {
      if (a?.status === "pinned" && b?.status !== "pinned") return -1;
      if (a?.status !== "pinned" && b?.status === "pinned") return 1;
      return 0;
    });

  return (
    <div className={`side-menu ${collapsed ? 'collapsed' : ''}`}>
      <div className="profile-section">
        <Link to={`/member/${username}`} className="profile-link">
          <div className="profile-picture" style={{ backgroundImage: `url(${profilePicture || 'https://studio.lancherix.com/Images/defaultProfilePicture.png'})` }}>
          </div>
          {!collapsed && (
            <div className="profile-info">
              <p className='fullName-sideMenu'>{firstName}{" "}{lastName}</p>
            </div>
          )}
        </Link>
      </div>
      <div className='menu-settings'>
        <ul>
          <li>
            <Link to="/settings">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z" />
                <path fill-rule="evenodd" d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 0 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 0 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z" clip-rule="evenodd" />
              </svg>
              {!collapsed && <span className="menu-text">{t('settings')}</span>}
            </Link>
          </li>
        </ul>
      </div>
      <div className="menu-toggle" onClick={handleToggleMenu}>
        {collapsed ? (
          <svg className='menu-icon' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 10.28a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 1 0-1.06 1.06l1.72 1.72H8.25a.75.75 0 0 0 0 1.5h5.69l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3Z" clip-rule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
            <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-4.28 9.22a.75.75 0 0 0 0 1.06l3 3a.75.75 0 1 0 1.06-1.06l-1.72-1.72h5.69a.75.75 0 0 0 0-1.5h-5.69l1.72-1.72a.75.75 0 0 0-1.06-1.06l-3 3Z" clip-rule="evenodd" />
          </svg>
        )}
      </div>
      <ul>
        {/* Home */}
        <li>
          <Link to="/">
            <svg className="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
            {!collapsed && <span className="menu-text">{t('home')}</span>}
          </Link>
        </li>

        {/* User Projects */}
        {visibleProjects.length > 0 && (
          <ul className="projects-list">
            {visibleProjects.map((project) => (
              <li key={project._id}>
                <Link to={`/projects/${project.slug}`} className="menu-link">
                  <span className="menu-icon project-emoji">
                    {project.icon || "📁"}
                  </span>
                  {!collapsed && (
                    <span className="menu-text">
                      {project.name || "Untitled Project"}
                      {project.status === "pinned" && " 📌"}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* New Project */}
        <li>
          <Link to="/projects">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
            </svg>
            {!collapsed && <span className="menu-text">{t('allProjects')}</span>}
          </Link>
        </li>
        {/* New Project */}
        <li>
          <button
            className="menu-button menu-link"
            onClick={() => setShowNewProject(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd" />
            </svg>
            {!collapsed && <span className="menu-text">{t('newProject')}</span>}
          </button>
        </li>
      </ul>
      <NewProjectPage
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
      />
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default SideMenu;