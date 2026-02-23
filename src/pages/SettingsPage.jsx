import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import LogoutPage from './LogoutPage';
import './Styles/SettingsPage.css';
import { language } from '../language';

import UserIcon from '../icons/profile.svg';
import AspectIcon from '../icons/aspect.svg';
import TermsOfUseIcon from '../icons/termsofuse.svg';
import LogoutIcon from '../icons/logout.svg';

const SettingsPage = () => {
  const [selectedOption, setSelectedOption] = useState('General');
  const [wallpaper, setWallpaper] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState(null);
  const [profilePictureChanged, setProfilePictureChanged] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [sideMenuColor, setSideMenuColor] = useState('rgba(0, 147, 203, 1)');
  const [currentLang, setCurrentLang] = useState('en-US');

  const t = (key) => {
    return language[currentLang]?.[key] || language['en-US']?.[key] || key;
  };

  document.title = `Lancherix Settings`;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
        }

        const user = await response.json();

        setFirstName(user.firstName);
        setLastName(user.lastName);
        setUsername(user.username);
        setEmail(user.email);
        setBirthMonth(user.month);   // backend uses "month"
        setBirthDate(user.date);     // backend uses "date"
        setBirthYear(user.year);     // backend uses "year"
        setGender(user.gender);
        setCurrentLang(user.language || 'en-US');

        setProfilePicturePreview(user.profilePicture?.url || "https://studio.lancherix.com/Images/defaultProfilePicture.png");
        setWallpaper(`url(${user.wallpaper?.url})`);

        setSideMenuColor(user.sideMenuColor || 'rgba(0, 147, 203, 1)');

        // Update background visually
        document.body.style.backgroundImage =
          `url(${user.wallpaper?.url})` || 'url(/Images/backgroundImage.jpeg)';

        setError(null);

      } catch (error) {
        console.error('Error fetching user data:', error);
        localStorage.clear();
        window.location.reload();
      }
    };

    fetchUserData();
  }, []);

  const handleWallpaperChange = async (input) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      // If user clicked built-in wallpaper
      if (typeof input === 'string') {
        setWallpaper(`url(${input})`);
        document.body.style.backgroundImage = `url(${input})`;
        const wallpaperPreview = document.querySelector('.wallpaperPreview');
        if (wallpaperPreview) wallpaperPreview.style.backgroundImage = `url(${input})`;

        const response = await fetch(
          'https://lancherixstudio-backend.onrender.com/api/users',
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              wallpaper: { url: input, public_id: "" }, // built-in wallpapers have empty public_id
            }),
          }
        );

        if (!response.ok) throw new Error('Failed to update wallpaper');
        return;
      }

      // If user uploaded a file
      const file = input.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('Wallpaper must be smaller than 5MB');
        return;
      }

      const formData = new FormData();
      formData.append('wallpaper', file);

      const uploadRes = await fetch(
        'https://lancherixstudio-backend.onrender.com/api/users/wallpaper',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      if (!uploadRes.ok) throw new Error('Wallpaper upload failed');

      const uploadData = await uploadRes.json();

      // Update wallpaper immediately
      setWallpaper(`url(${uploadData.url})`);
      document.body.style.backgroundImage = `url(${uploadData.url})`;
      const wallpaperPreview = document.querySelector('.wallpaperPreview');
      if (wallpaperPreview) wallpaperPreview.style.backgroundImage = `url(${uploadData.url})`;

    } catch (error) {
      console.error('Error updating wallpaper:', error);
    }
  };

  const updateBackgroundImage = (imageUrl) => {
    document.body.style.backgroundImage = `url(${imageUrl})`;
    const wallpaperPreview = document.querySelector('.wallpaperPreview');
    if (wallpaperPreview) {
      wallpaperPreview.style.backgroundImage = `url(${imageUrl})`;
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    setProfilePictureFile(file);
    setProfilePicturePreview(URL.createObjectURL(file));
    setProfilePictureChanged(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    setProfilePictureFile(file);
    setProfilePicturePreview(URL.createObjectURL(file));
    setProfilePictureChanged(true);
  };

  const handleRemovePicture = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch(
        'https://lancherixstudio-backend.onrender.com/api/users/profile-picture',
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to remove profile picture');

      setProfilePictureFile(null);
      setProfilePicturePreview('https://studio.lancherix.com/Images/defaultProfilePicture.png');
      setProfilePictureChanged(false);

      window.location.reload();
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setError(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      if (!email || !firstName || !birthMonth || !birthDate || !birthYear || !gender) {
        throw new Error("All fields are required");
      }

      const body = {
        firstName,
        email,
        month: birthMonth,
        date: birthDate,
        year: birthYear,
        gender,
      };

      if (lastName.trim() === "") {
        body.lastName = " ";
      } else {
        body.lastName = lastName;
      }

      console.log("Submited");

      if (profilePictureChanged && profilePictureFile) {
        console.log(profilePictureFile, profilePictureFile instanceof File);

        const formData = new FormData();
        formData.append("profilePicture", profilePictureFile);

        const uploadRes = await fetch(
          "https://lancherixstudio-backend.onrender.com/api/users/profile-picture",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          throw new Error("Profile picture upload failed");
        }

        const uploadData = await uploadRes.json();

        body.profilePicture = {
          url: uploadData.url,
          public_id: uploadData.public_id
        };

        setProfilePictureChanged(false);
      }

      const response = await fetch(
        "https://lancherixstudio-backend.onrender.com/api/users",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user data");
      }

      window.location.reload();

    } catch (error) {
      console.error("Error updating user data:", error);
      setError(error.message);
    }
  };

  const handleLogoutAccept = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  const handleColorChange = async (color) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      let menuColor;
      let buttonColor;
      let hoverButtonColor;
      let hoverTextColor;
      let topMenu;
      let textMenu;
      if (color === 'rgba(0, 147, 203, 1)') {
        menuColor = 'rgba(0, 147, 203, 0.65)';
        buttonColor = '#0074ff';
        hoverButtonColor = '#0056b3';
        hoverTextColor = 'aliceblue';
        topMenu = '#09191f';
        textMenu = '#09191f';
      } else if (color === 'rgba(0, 128, 0, 1)') {
        menuColor = 'rgba(0, 128, 0, 0.65)';
        buttonColor = 'rgba(0, 128, 0, 1)';
        hoverButtonColor = 'rgba(0, 86, 0, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(0, 21, 0, 1)';
        textMenu = 'aliceblue';
      } else if (color === 'rgba(128, 0, 128, 1)') {
        menuColor = 'rgba(128, 0, 128, 0.65)';
        buttonColor = 'rgba(128, 0, 128, 1)';
        hoverButtonColor = 'rgba(86, 0, 86, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(22, 0, 22, 1)';
        textMenu = 'aliceblue';
      } else if (color === 'rgba(255, 0, 0, 1)') {
        menuColor = 'rgba(255, 0, 0, 0.65)';
        buttonColor = 'rgba(255, 0, 0, 1)';
        hoverButtonColor = 'rgba(179, 0, 0, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(43, 0, 0, 1)';
        textMenu = 'rgba(43, 0, 0, 1)';
      } else if (color === 'rgba(255, 255, 0, 1)') {
        menuColor = 'rgba(255, 255, 0, 0.65)';
        buttonColor = 'rgba(255, 255, 0, 1)';
        hoverButtonColor = 'rgba(179, 179, 0, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 43, 0, 1)';
        textMenu = 'rgba(43, 43, 0, 1)';
      } else if (color === 'rgba(255, 129, 0, 1)') {
        menuColor = 'rgba(255, 129, 0, 0.65)';
        buttonColor = 'rgba(255, 129, 0, 1)';
        hoverButtonColor = 'rgba(179, 81, 0, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 22, 0, 1)';
        textMenu = 'rgba(43, 22, 0, 1)';
      } else if (color === 'rgba(255, 192, 203, 1)') {
        menuColor = 'rgba(255, 192, 203, 0.65)';
        buttonColor = 'rgba(255, 192, 203, 1)';
        hoverButtonColor = 'rgba(179, 144, 152, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 32, 34, 1)';
        textMenu = 'rgba(43, 32, 34, 1)';
      } else if (color === 'rgba(0, 255, 255, 1)') {
        menuColor = 'rgba(0, 255, 255, 0.65)';
        buttonColor = 'rgba(0, 255, 255, 1)';
        hoverButtonColor = 'rgba(0, 179, 179, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(0, 43, 43, 1)';
        textMenu = 'rgba(0, 43, 43, 1)';
      } else if (color === 'rgba(0, 0, 139, 1)') {
        menuColor = 'rgba(0, 0, 139, 0.65)';
        buttonColor = 'rgba(0, 0, 139, 1)';
        hoverButtonColor = 'rgba(0, 0, 96, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(0, 0, 23, 1)';
        textMenu = 'aliceblue';
      } else if (color === 'rgba(0, 255, 0, 1)') {
        menuColor = 'rgba(0, 255, 0, 0.65)';
        buttonColor = 'rgba(0, 255, 0, 1)';
        hoverButtonColor = 'rgba(0, 179, 0, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(0, 43, 0, 1)';
        textMenu = 'rgba(0, 43, 0, 1)';
      } else if (color === 'rgba(255, 0, 255, 1)') {
        menuColor = 'rgba(255, 0, 255, 0.65)';
        buttonColor = 'rgba(255, 0, 255, 1)';
        hoverButtonColor = 'rgba(179, 0, 179, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 0, 43, 1)';
        textMenu = 'rgba(43, 0, 43, 1)';
      } else if (color === 'rgba(255, 255, 254, 1)') {
        menuColor = 'rgba(255, 255, 255, 0.65)';
        buttonColor = '#A4A5A6';
        hoverButtonColor = '#737373';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 43, 43, 1)';
        textMenu = 'rgba(43, 43, 43, 1)';
      } else if (color === 'rgba(64, 64, 64, 1)') {
        menuColor = 'rgba(64, 64, 64, 0.65)';
        buttonColor = '#A4A5A6';
        hoverButtonColor = '#737373';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(11, 11, 11, 1)';
        textMenu = 'aliceblue';
      } else {
        throw new Error('Invalid theme mode');
      }

      document.documentElement.style.setProperty('--menuColor', menuColor);
      document.documentElement.style.setProperty('--buttonColor', buttonColor);
      document.documentElement.style.setProperty('--hoverButtonColor', hoverButtonColor);
      document.documentElement.style.setProperty('--hoverTextColor', hoverTextColor);
      document.documentElement.style.setProperty('--topMenu', topMenu);
      document.documentElement.style.setProperty('--textMenu', textMenu);

      const response = await fetch('https://lancherixstudio-backend.onrender.com/api/users', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sideMenuColor: color,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update side menu color: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('Error updating side menu color:', error);
      setError(`Failed to update side menu color. ${error.message}`);
    }
  };

  const handleThemeChange = async (theme) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      let themeValue;
      let textThemeValue;
      let placeholderThemeValue;
      let borderThemeValue;
      let altRowValue
      if (theme === 'glass') {
        themeValue = 'rgba(64, 64, 64, 0.3)';
        textThemeValue = 'aliceblue';
        placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
        borderThemeValue = '1px solid rgba(255, 255, 255, 0.2)';
        altRowValue = 'rgba(255, 255, 255, 0.06)';
      } else if (theme === 'light') {
        themeValue = 'rgba(255, 255, 255, 0.7)';
        textThemeValue = 'black';
        placeholderThemeValue = '#888';
        borderThemeValue = '1px solid transparent';
        altRowValue = 'rgba(0, 0, 0, 0.05)';
      } else if (theme === 'dark') {
        themeValue = 'rgba(64, 64, 64, 0.7)';
        textThemeValue = 'aliceblue';
        placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
        borderThemeValue = '1px solid transparent';
        altRowValue = 'rgba(255, 255, 255, 0.04)';
      } else {
        throw new Error('Invalid theme mode');
      }

      document.documentElement.style.setProperty('--theme', themeValue);
      document.documentElement.style.setProperty('--textTheme', textThemeValue);
      document.documentElement.style.setProperty('--placeholderTheme', placeholderThemeValue);
      document.documentElement.style.setProperty('--borderTheme', borderThemeValue);
      document.documentElement.style.setProperty('--altRow', altRowValue);

      const response = await fetch('https://lancherixstudio-backend.onrender.com/api/users', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeMode: theme,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user's theme mode: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('Error updating theme mode:', error);
      setError(`Failed to update theme mode. ${error.message}`);
    }
  };

  const renderMyProfile = () => {
    return (
      <div className='allProfile-settingsPage'>
        <form onSubmit={handleSubmit}>
          <div
            className='profilePicture-settingsPage profilePictureLarge-settingsPage'
            style={{
              backgroundImage: `url(${profilePicturePreview ||
                'https://studio.lancherix.com/Images/defaultProfilePicture.png'})`,
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('fileInput').click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          ></div>
          <a onClick={handleRemovePicture}>{t('removeProfilePicture')}</a>
          <input
            id='fileInput'
            type='file'
            accept='image/*'
            onChange={handleProfilePictureChange}
            style={{ display: 'none' }}
          />
          <div className='input-registerPage border-settingsPage'>
            <input
              type='email'
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='inputEmail-registerPage'
              pattern='^[^\s@]+@[^\s@]+\.[^\s@]+$'
              title='Please enter a valid email address'
              spellcheck="false"
            />
          </div>
          <div className='input-registerPage border-settingsPage'>
            <input
              type='text'
              placeholder={t('firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className='inputName-registerPage'
              spellcheck="false"
            />
            <input
              type='text'
              placeholder={t('lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className='inputName-registerPage'
              spellcheck="false"
            />
          </div>
          <div className='fullDate-registerPage'>
            <div className='inputDate-registerPage border-settingsPage'>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className='inputD-registerPage'
              >
                <option value=''>{t('month')}</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i + 1, 0).toLocaleString('en-US', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className='inputDate-registerPage border-settingsPage'>
              <select
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className='inputD-registerPage'
              >
                <option value=''>{t('date')}</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className='inputDate-registerPage border-settingsPage'>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className='inputD-registerPage'
              >
                <option value=''>{t('year')}</option>
                {Array.from({ length: 100 }, (_, i) => (
                  <option key={i + 1924} value={i + 1924}>
                    {i + 1924}
                  </option>
                )).reverse()}
              </select>
            </div>
          </div>
          <div className='input-registerPage border-settingsPage'>
            <div className='inputD-registerPage'>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className='inputD-registerPage'>
                <option value=''>{t('gender')}</option>
                <option value='male'>{t('male')}</option>
                <option value='female'>{t('female')}</option>
                <option value="preferNotToSay">{t('preferNotToSay')}</option>
              </select>
            </div>
          </div>
          {error && <p className="error-registerPage">{error}</p>}
          <button className='border-settingsPage' type='submit'>{t('saveChanges')}</button>
        </form>
      </div>
    );
  };

  const renderGeneral = () => {
    return (
      <div className='allGeneral-settingsPage'>
        <div
          className='profilePicture-settingsPage profilePictureLarge-settingsPage'
          style={{
            backgroundImage: `url(${profilePicturePreview ||
              'https://studio.lancherix.com/Images/defaultProfilePicture.png'})`,
            cursor: 'pointer'
          }}
        ></div>
        <h1>{firstName}{" "}{lastName}</h1>
        <p className='allGeneral-settingsPageUsername'>{username}</p>

      </div>
    );
  };

  const renderColorOptions = () => {
    const colors = [
      { name: 'Blue', value: 'rgba(0, 147, 203, 1)' },
      { name: 'Green', value: 'rgba(0, 128, 0, 1)' },
      { name: 'Purple', value: 'rgba(128, 0, 128, 1)' },
      { name: 'Red', value: 'rgba(255, 0, 0, 1)' },
      { name: 'Yellow', value: 'rgba(255, 255, 0, 1)' },
      { name: 'Orange', value: 'rgba(255, 129, 0, 1)' },
      { name: 'Pink', value: 'rgba(255, 192, 203, 1)' },
      { name: 'Cyan', value: 'rgba(0, 255, 255, 1)' },
      { name: 'Dark Blue', value: 'rgba(0, 0, 139, 1)' },
      { name: 'Lime', value: 'rgba(0, 255, 0, 1)' },
      { name: 'Magenta', value: 'rgba(255, 0, 255, 1)' },
      { name: 'bright', value: 'rgba(255, 255, 254, 1)' },
      { name: 'space', value: 'rgba(64, 64, 64, 1)' },
    ];

    return (
      <div className='colorOptions-settingsPage'>
        {colors.map(color => (
          <div
            key={color.name}
            className='colorOption-settingsPage'
            style={{ backgroundColor: color.value }}
            onClick={() => handleColorChange(color.value)}
          >
          </div>
        ))}
      </div>
    );
  };

  const renderThemeOptions = () => {
    return (
      <div className='themeOptions-settingsPage'>
        <div
          className='themeOptionGlass-settingsPage'
          style={{ backgroundColor: 'rgba(64, 64, 64, 0.3)' }}
          onClick={() => handleThemeChange('glass')}
        >
          {t('glass')}
        </div>
        <div
          className='themeOptionLight-settingsPage'
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          onClick={() => handleThemeChange('light')}
        >
          {t('light')}
        </div>
        <div
          className='themeOptionDark-settingsPage'
          style={{ backgroundColor: 'rgba(0, 0, 0, 1)' }}
          onClick={() => handleThemeChange('dark')}
        >
          {t('dark')}
        </div>
      </div>
    );
  };

  const renderAspect = () => {
    return (
      <div className='allAspect-settingsPage'>
        <div className='wallpaperAspect'>
          <div className='top-aspect'>
            <div className='wallpaperPreview' style={{ backgroundImage: wallpaper }}></div>
            <div className='left-aspect'>
              <div>{renderThemeOptions()}</div>
              <div>{renderColorOptions()}</div>
            </div>
          </div>
          <div className='selectWallpaper'>
            <div className='aWall upload-aWall'>
              <p>{t('uploadWallpaper')}</p>
              <input
                type="file"
                accept="image/*"
                style={{ width: '100%', height: '100%', opacity: 0, cursor: 'pointer', position: 'absolute' }}
                onChange={handleWallpaperChange}
              />
            </div>
            <div className='aWall aRealWall aWall1' onClick={() => handleWallpaperChange('/Images/backgroundImage.jpeg')}></div>
            <div className='aWall aRealWall aWall2' onClick={() => handleWallpaperChange('/Images/grandCanyon.jpg')}></div>
            <div className='aWall aRealWall aWall3' onClick={() => handleWallpaperChange('/Images/ireland.jpg')}></div>
            <div className='aWall aRealWall aWall4' onClick={() => handleWallpaperChange('/Images/earth.jpg')}></div>
            <div className='aWall aRealWall aWall5' onClick={() => handleWallpaperChange('/Images/dark101.jpg')}></div>
            <div className='aWall aRealWall aWall6' onClick={() => handleWallpaperChange('/Images/grandCanyon2.jpg')}></div>
            <div className='aWall aRealWall aWall7' onClick={() => handleWallpaperChange('/Images/NASA.jpg')}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderTermsOfUse = () => {
    return (
      <div className="terms-container">
        <div className="termsContent">
          <h1>Terms of Use</h1>
          <p><strong>Effective Date:</strong> December 24th 2025</p>
          <p>
            These Terms of Use (“Terms”) govern your access to and use of Lancherix Studio (the “Service”) provided by Lancherix.
            By using the Service, you agree to be bound by these Terms.
          </p>

          <h3>1. Eligibility</h3>
          <p>
            You must be at least 10 years old to use the Service. By using the Service, you represent that you meet this requirement.
          </p>

          <h3>2. User Accounts</h3>
          <p>
            You may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
          </p>

          <h3>3. Personal Information</h3>
          <p>
            We may collect personal information, including your name and username. This information may be shared with other users only as necessary to provide the Service.
          </p>

          <h3>4. Use of the Service</h3>
          <p>
            You agree to use the Service responsibly and in compliance with applicable laws. You may not engage in unauthorized or harmful activities, including but not limited to hacking, distributing malware, or infringing on intellectual property.
          </p>

          <h3>5. Content and License</h3>
          <p>
            You retain ownership of any content you submit to the Service (“User Content”). By submitting User Content, you grant Lancherix a non-exclusive, worldwide, royalty-free license to use, reproduce, and display such content to operate and provide the Service.
          </p>

          <h3>6. Modifications</h3>
          <p>
            Lancherix may modify these Terms at any time. Significant changes will be communicated, and continued use of the Service constitutes acceptance of the updated Terms.
          </p>

          <h3>7. Termination</h3>
          <p>
            Lancherix may suspend or terminate your access to the Service at its discretion, including for violations of these Terms.
          </p>

          <h3>8. Disclaimers & Limitation of Liability</h3>
          <p>
            The Service is provided “as is” without warranties of any kind. Lancherix is not liable for indirect, incidental, or consequential damages arising from use of the Service.
          </p>

          <h3>9. Governing Law</h3>
          <p>
            These Terms are governed by the laws of the Republic of Colombia, without regard to its conflict of law provisions.
          </p>

          <h3>10. Contact</h3>
          <p>
            Questions about these Terms can be directed to: <a href="mailto:lancherix.service@gmail.com">lancherix.service@gmail.com</a>
          </p>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (selectedOption) {
      case 'General':
        return renderGeneral();
      case 'My profile':
        return renderMyProfile();
      case 'Aspect':
        return renderAspect();
      case 'Terms of use':
        return renderTermsOfUse();
      default:
        return renderMyProfile();
    }
  };

  return (
    <div className='all-settingsPage'>
      <div className='window-settingsPage'>
        <div className='menu-settingsPage'>
          <div className='profile-settingsPage'>
            <div
              className='profilePicture-settingsPage'
              style={{
                backgroundImage: `url(${profilePicturePreview ||
                  'https://studio.lancherix.com/Images/defaultProfilePicture.png'})`,
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('fileInput').click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            ></div>
            <input
              id='fileInput'
              type='file'
              accept='image/*'
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
            />
            <div className='profileName-settingsPage'>
              <p className='profileNameLarge-settingsPage'>{firstName}{" "}{lastName}</p>
              <p>{username}</p>
            </div>
          </div>
          <div className='options-settingsPage'>
            <button onClick={() => setSelectedOption('General')}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z" />
              <path fill-rule="evenodd" d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 0 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 0 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z" clip-rule="evenodd" />
            </svg>{t('general')}</button>
            <button onClick={() => setSelectedOption('My profile')}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
            </svg>{t('editProfile')}</button>
            <button onClick={() => setSelectedOption('Aspect')}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
              <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
            </svg>{t('aspect')}</button>
            <button onClick={() => setSelectedOption('Terms of use')}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path fill-rule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
            </svg>{t('termsOfUse')}</button>
            <button onClick={() => setShowLogoutConfirmation(true)}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
              <path fill-rule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
            </svg>{t('logout')}</button>
          </div>
        </div>
        <div className='content-settingsPage'>{renderContent()}</div>
      </div>
      <LogoutPage
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
      />
    </div>
  );
};

export default SettingsPage;