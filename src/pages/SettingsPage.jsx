import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import './Styles/SettingsPage.css';

import UserIcon from '../icons/profile.svg';
import AspectIcon from '../icons/aspect.svg';
import TermsOfUseIcon from '../icons/termsofuse.svg';
import LogoutIcon from '../icons/logout.svg';

const SettingsPage = () => {
  const [selectedOption, setSelectedOption] = useState('My profile');
  const [wallpaper, setWallpaper] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [sideMenuColor, setSideMenuColor] = useState('rgba(0, 147, 203, 1)');

  document.title = `Lancherix Settings`;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const decodedToken = jwtDecode(token);

        const response = await fetch('http://localhost:3000/api/users', {
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
          setFullName(user.fullName);
          setUsername(user.username);
          setEmail(user.email);
          setBirthMonth(user.birthMonth);
          setBirthDate(user.birthDate);
          setBirthYear(user.birthYear);
          setGender(user.gender);
          setProfilePicturePreview(user.profilePicture);
          setWallpaper(`url(${user.wallpaper})` || 'url(/Images/backgroundImage.jpeg)');
          setSideMenuColor(user.sideMenuColor || 'rgba(0, 147, 203, 1)');
        } else {
          throw new Error('User not found in fetched data');
        }

        setError(null);
      } catch (error) {
        localStorage.clear();
        window.location.reload();
        console.error('Error fetching user data:', error);
        setError(`Failed to fetch user data. ${error.message}`);
      }
    };

    fetchUserData();
  }, []);

  const handleWallpaperChange = async (input) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const formData = new FormData();
      let imageUrl;

      if (typeof input === 'string') {
        formData.append('wallpaper', input);
        imageUrl = input;
      } else if (input.target.files && input.target.files.length > 0) {
        formData.append('wallpaper', input.target.files[0]);

        const reader = new FileReader();
        reader.onloadend = () => {
          imageUrl = reader.result;
          updateBackgroundImage(imageUrl);
        };
        reader.readAsDataURL(input.target.files[0]);
      }

      const response = await fetch('http://localhost:3000/api/users', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to update wallpaper: ${response.status} ${response.statusText}`);
      }

      if (typeof input === 'string') {
        updateBackgroundImage(imageUrl);
      }

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
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(file);
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(file);
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePicture = (e) => {
    setProfilePicture('https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7');
    setProfilePicturePreview('https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      if (!email || !fullName || !birthMonth || !birthDate || !birthYear || !gender) {
        throw new Error('All fields are required');
      }

      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('fullName', fullName);
      formData.append('birthMonth', birthMonth);
      formData.append('birthDate', birthDate);
      formData.append('birthYear', birthYear);
      formData.append('gender', gender);

      if (profilePicture) {
        console.log(profilePicture);
        if (typeof profilePicture === 'string') {
          if (profilePicture === 'https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7') {
            formData.append('profilePicture', profilePicture);
          } else {
            throw new Error('Invalid URL. Please use the provided default URL or upload a valid image.');
          }
        } else if (profilePicture instanceof File) {
          const validImageTypes = ['image/jpeg', 'image/png'];
          if (!validImageTypes.includes(profilePicture.type)) {
            throw new Error('Invalid file format. Please upload a JPEG, JPG, or PNG image.');
          } else {
            formData.append('profilePicture', profilePicture);
          }
        } else {
          throw new Error('Invalid profile picture. Please upload a valid image or use the provided default URL.');
        }
      }

      const response = await fetch('http://localhost:3000/api/users', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to update user data: ${response.status} ${response.statusText}`);
      }

      window.location.reload();
    } catch (error) {
      console.error('Error updating user data:', error);
      setError(`Failed to update user data. ${error.message}`);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirmation(true);
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
      if (color === 'rgba(0, 147, 203, 1)') {
        menuColor = 'rgba(0, 147, 203, 0.65)';
        buttonColor = '#0074ff';
        hoverButtonColor = '#0056b3';
        hoverTextColor = 'aliceblue';
        topMenu = '#09191f';
      } else if (color === 'rgba(0, 128, 0, 1)') {
        menuColor = 'rgba(0, 128, 0, 0.65)';
        buttonColor = 'rgba(0, 128, 0, 1)';
        hoverButtonColor = 'rgba(0, 86, 0, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(0, 21, 0, 1)';
      } else if (color === 'rgba(128, 0, 128, 1)') {
        menuColor = 'rgba(128, 0, 128, 0.65)';
        buttonColor = 'rgba(128, 0, 128, 1)';
        hoverButtonColor = 'rgba(86, 0, 86, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(22, 0, 22, 1)';
      } else if (color === 'rgba(255, 0, 0, 1)') {
        menuColor = 'rgba(255, 0, 0, 0.65)';
        buttonColor = 'rgba(255, 0, 0, 1)';
        hoverButtonColor = 'rgba(179, 0, 0, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(43, 0, 0, 1)';
      } else if (color === 'rgba(255, 255, 0, 1)') {
        menuColor = 'rgba(255, 255, 0, 0.65)';
        buttonColor = 'rgba(255, 255, 0, 1)';
        hoverButtonColor = 'rgba(179, 179, 0, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 43, 0, 1)';
      } else if (color === 'rgba(255, 129, 0, 1)') {
        menuColor = 'rgba(255, 129, 0, 0.65)';
        buttonColor = 'rgba(255, 129, 0, 1)';
        hoverButtonColor = 'rgba(179, 81, 0, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 22, 0, 1)';
      } else if (color === 'rgba(255, 192, 203, 1)') {
        menuColor = 'rgba(255, 192, 203, 0.65)';
        buttonColor = 'rgba(255, 192, 203, 1)';
        hoverButtonColor = 'rgba(179, 144, 152, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 32, 34, 1)';
      } else if (color === 'rgba(0, 255, 255, 1)') {
        menuColor = 'rgba(0, 255, 255, 0.65)';
        buttonColor = 'rgba(0, 255, 255, 1)';
        hoverButtonColor = 'rgba(0, 179, 179, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(0, 43, 43, 1)';
      } else if (color === 'rgba(0, 0, 139, 1)') {
        menuColor = 'rgba(0, 0, 139, 0.65)';
        buttonColor = 'rgba(0, 0, 139, 1)';
        hoverButtonColor = 'rgba(0, 0, 96, 1)';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(0, 0, 23, 1)';
      } else if (color === 'rgba(0, 255, 0, 1)') {
        menuColor = 'rgba(0, 255, 0, 0.65)';
        buttonColor = 'rgba(0, 255, 0, 1)';
        hoverButtonColor = 'rgba(0, 179, 0, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(0, 43, 0, 1)';
      } else if (color === 'rgba(255, 0, 255, 1)') {
        menuColor = 'rgba(255, 0, 255, 0.65)';
        buttonColor = 'rgba(255, 0, 255, 1)';
        hoverButtonColor = 'rgba(179, 0, 179, 1)';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 0, 43, 1)';
      } else if (color === 'rgba(255, 255, 254, 1)') {
        menuColor = 'rgba(255, 255, 255, 0.65)';
        buttonColor = '#A4A5A6';
        hoverButtonColor = '#737373';
        hoverTextColor = '#000';
        topMenu = 'rgba(43, 43, 43, 1)';
      } else if (color === 'rgba(64, 64, 64, 1)') {
        menuColor = 'rgba(64, 64, 64, 0.65)';
        buttonColor = '#A4A5A6';
        hoverButtonColor = '#737373';
        hoverTextColor = 'aliceblue';
        topMenu = 'rgba(11, 11, 11, 1)';
      } else {
        throw new Error('Invalid theme mode');
      }

      document.documentElement.style.setProperty('--menuColor', menuColor);
      document.documentElement.style.setProperty('--buttonColor', buttonColor);
      document.documentElement.style.setProperty('--hoverButtonColor', hoverButtonColor);
      document.documentElement.style.setProperty('--hoverTextColor', hoverTextColor);
      document.documentElement.style.setProperty('--topMenu', topMenu);

      const response = await fetch('http://localhost:3000/api/users', {
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
      if (theme === 'glass') {
        themeValue = 'rgba(64, 64, 64, 0.3)';
        textThemeValue = 'aliceblue';
        placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
        borderThemeValue = '1px solid rgba(255, 255, 255, 0.2)';
      } else if (theme === 'light') {
        themeValue = 'rgba(255, 255, 255, 0.7)';
        textThemeValue = 'black';
        placeholderThemeValue = '#888';
        borderThemeValue = '1px solid transparent';
      } else if (theme === 'dark') {
        themeValue = 'rgba(64, 64, 64, 0.7)';
        textThemeValue = 'aliceblue';
        placeholderThemeValue = 'rgba(200, 200, 200, 0.8)';
        borderThemeValue = '1px solid transparent';
      } else {
        throw new Error('Invalid theme mode');
      }

      document.documentElement.style.setProperty('--theme', themeValue);
      document.documentElement.style.setProperty('--textTheme', textThemeValue);
      document.documentElement.style.setProperty('--placeholderTheme', placeholderThemeValue);
      document.documentElement.style.setProperty('--borderTheme', borderThemeValue);

      const response = await fetch('http://localhost:3000/api/users', {
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
                'https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7'})`,
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('fileInput').click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          ></div>
          <a onClick={handleRemovePicture}>Remove profile picture</a>
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
              placeholder='Email'
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
              placeholder='Full Name'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
                <option value=''>Month</option>
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
                <option value=''>Date</option>
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
                <option value=''>Year</option>
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
                <option value=''>Gender</option>
                <option value='male'>Male</option>
                <option value='female'>Female</option>
                <option value="preferNotToSay">Prefer not to say</option>
              </select>
            </div>
          </div>
          {error && <p className="error-registerPage">{error}</p>}
          <button className='border-settingsPage' type='submit'>Save Changes</button>
        </form>
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
          Glass
        </div>
        <div
          className='themeOptionLight-settingsPage'
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
          onClick={() => handleThemeChange('light')}
        >
          Light
        </div>
        <div
          className='themeOptionDark-settingsPage'
          style={{ backgroundColor: 'rgba(0, 0, 0, 1)' }}
          onClick={() => handleThemeChange('dark')}
        >
          Dark
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
              <p>Upload a wallpaper</p>
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
            <div className='aWall aRealWall aWall8' onClick={() => handleWallpaperChange('/Images/newyork.jpg')}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderTermsOfUse = () => {
    return (
      <div className="terms-container">
        <div className='termsContent'>
          <h1>Terms of Use</h1>
          <p>Welcome to Lancherix! These terms outline how you can use our services. By using our services, you agree to these terms. Please read them carefully.</p>

          <h3>1. Personal Information</h3>
          <p>We may collect and use your personal information, including your name and username. We only share this information with other users as necessary for our services.</p>

          <h3>2. Service Use</h3>
          <p>You agree to use our services responsibly. This includes following our guidelines and not engaging in any unlawful activities.</p>

          <h3>3. Content</h3>
          <p>Any content you submit to our services remains your responsibility. You grant us permission to use this content to provide our services.</p>

          <h3>4. Modifications</h3>
          <p>We may update these terms as our services evolve. We'll notify you of any significant changes.</p>

          <h3>5. Termination</h3>
          <p>We reserve the right to terminate or suspend your access to our services if you violate these terms.</p>

          <h3>6. Contact Us</h3>
          <p>If you have any questions about these terms, please contact us at <a href="mailto:lancherix.service@gmail.com">lancherix.service@gmail.com</a>.</p>
        </div>
      </div>
    );
  };

  const renderLogout = () => {
    return (
      <div className='back-logoutConfirmation'>
        <div className='all-logoutConfirmation'>
          <div className='question-logoutConfirmation'>
            <h3>Are you sure you want to logout?</h3>
          </div>
          <div className='options-logoutConfirmation'>
            <button className='accept-logoutConfirmation' onClick={handleLogoutAccept}>Accept</button>
            <button className='cancel-logoutConfirmation' onClick={handleLogoutCancel}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (selectedOption) {
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
                  'https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7'})`,
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
              <p className='profileNameLarge-settingsPage'>{fullName}</p>
              <p>{username}</p>
            </div>
          </div>
          <div className='options-settingsPage'>
            <button onClick={() => setSelectedOption('My profile')}><img src={UserIcon} className='resultIcon-coolPage' alt="Edit my profile" />Edit my profile</button>
            <button onClick={() => setSelectedOption('Aspect')}><img src={AspectIcon} className='resultIcon-coolPage' alt="Aspect" />Aspect</button>
            <button onClick={() => setSelectedOption('Terms of use')}><img src={TermsOfUseIcon} className='resultIcon-coolPage' alt="Terms of use" />Terms of use</button>
            <button onClick={handleLogout}><img src={LogoutIcon} className='resultIcon-coolPage' alt="Logout" />Logout</button>
          </div>
        </div>
        <div className='content-settingsPage'>{renderContent()}</div>
      </div>
      {showLogoutConfirmation && renderLogout()}
    </div>
  );
};

export default SettingsPage;