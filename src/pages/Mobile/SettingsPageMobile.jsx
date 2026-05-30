import React, { useState, useEffect } from 'react';
import LogoutPage from '../LogoutPage';
import './Styles/SettingsPageMobile.css';
import { language } from '../../language';

const SettingsPageMobile = () => {
  const [selectedOption, setSelectedOption] = useState(null); // null = show main menu
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
  const [region, setRegion] = useState('');

  const t = (key) => language[currentLang]?.[key] || language['en-US']?.[key] || key;

  document.title = 'Lancherix Settings';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error(`Failed to fetch user data: ${response.status}`);

        const user = await response.json();

        setFirstName(user.firstName);
        setLastName(user.lastName);
        setUsername(user.username);
        setEmail(user.email);
        setBirthMonth(user.month);
        setBirthDate(user.date);
        setBirthYear(user.year);
        setGender(user.gender);
        setCurrentLang(user.language || 'en-US');
        setRegion(user.country);
        setProfilePicturePreview(
          user.profilePicture?.url || 'https://studio.lancherix.com/Images/defaultProfilePicture.png'
        );
        setWallpaper(`url(${user.wallpaper?.url})`);
        setSideMenuColor(user.sideMenuColor || 'rgba(0, 147, 203, 1)');
        document.body.style.backgroundImage = `url(${user.wallpaper?.url})` || 'url(/Images/backgroundImage.jpeg)';
        setError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
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

      if (typeof input === 'string') {
        setWallpaper(`url(${input})`);
        document.body.style.backgroundImage = `url(${input})`;
        const response = await fetch('https://lancherixstudio-backend.onrender.com/api/users', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallpaper: { url: input, public_id: '' } }),
        });
        if (!response.ok) throw new Error('Failed to update wallpaper');
        return;
      }

      const file = input.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { alert('Wallpaper must be smaller than 5MB'); return; }

      const formData = new FormData();
      formData.append('wallpaper', file);

      const uploadRes = await fetch('https://lancherixstudio-backend.onrender.com/api/users/wallpaper', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Wallpaper upload failed');

      const uploadData = await uploadRes.json();
      setWallpaper(`url(${uploadData.url})`);
      document.body.style.backgroundImage = `url(${uploadData.url})`;
    } catch (err) {
      console.error('Error updating wallpaper:', err);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Image must be smaller than 2MB'); return; }
    setProfilePictureFile(file);
    setProfilePicturePreview(URL.createObjectURL(file));
    setProfilePictureChanged(true);
  };

  const handleRemovePicture = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await fetch('https://lancherixstudio-backend.onrender.com/api/users/profile-picture', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to remove profile picture');
      setProfilePictureFile(null);
      setProfilePicturePreview('https://studio.lancherix.com/Images/defaultProfilePicture.png');
      setProfilePictureChanged(false);
      window.location.reload();
    } catch (err) {
      console.error('Error removing profile picture:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      if (!email || !firstName || !birthMonth || !birthDate || !birthYear || !gender)
        throw new Error('All fields are required');

      const body = {
        firstName,
        email,
        month: birthMonth,
        date: birthDate,
        year: birthYear,
        gender,
        lastName: lastName.trim() === '' ? ' ' : lastName,
      };

      if (profilePictureChanged && profilePictureFile) {
        const formData = new FormData();
        formData.append('profilePicture', profilePictureFile);
        const uploadRes = await fetch('https://lancherixstudio-backend.onrender.com/api/users/profile-picture', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!uploadRes.ok) throw new Error('Profile picture upload failed');
        const uploadData = await uploadRes.json();
        body.profilePicture = { url: uploadData.url, public_id: uploadData.public_id };
        setProfilePictureChanged(false);
      }

      const response = await fetch('https://lancherixstudio-backend.onrender.com/api/users', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to update user data');
      window.location.reload();
    } catch (err) {
      console.error('Error updating user data:', err);
      setError(err.message);
    }
  };

  const handleColorChange = async (color) => {
    const colorMap = {
      'rgba(0, 147, 203, 1)':   { menu: 'rgba(0, 147, 203, 0.65)', btn: '#0074ff', hoverBtn: '#0056b3', hoverText: 'aliceblue', top: '#09191f', text: '#09191f' },
      'rgba(0, 128, 0, 1)':     { menu: 'rgba(0, 128, 0, 0.65)',   btn: 'rgba(0,128,0,1)', hoverBtn: 'rgba(0,86,0,1)', hoverText: 'aliceblue', top: 'rgba(0,21,0,1)', text: 'aliceblue' },
      'rgba(128, 0, 128, 1)':   { menu: 'rgba(128,0,128,0.65)',    btn: 'rgba(128,0,128,1)', hoverBtn: 'rgba(86,0,86,1)', hoverText: 'aliceblue', top: 'rgba(22,0,22,1)', text: 'aliceblue' },
      'rgba(255, 0, 0, 1)':     { menu: 'rgba(255,0,0,0.65)',      btn: 'rgba(255,0,0,1)', hoverBtn: 'rgba(179,0,0,1)', hoverText: 'aliceblue', top: 'rgba(43,0,0,1)', text: 'rgba(43,0,0,1)' },
      'rgba(255, 255, 0, 1)':   { menu: 'rgba(255,255,0,0.65)',    btn: 'rgba(255,255,0,1)', hoverBtn: 'rgba(179,179,0,1)', hoverText: '#000', top: 'rgba(43,43,0,1)', text: 'rgba(43,43,0,1)' },
      'rgba(255, 129, 0, 1)':   { menu: 'rgba(255,129,0,0.65)',    btn: 'rgba(255,129,0,1)', hoverBtn: 'rgba(179,81,0,1)', hoverText: '#000', top: 'rgba(43,22,0,1)', text: 'rgba(43,22,0,1)' },
      'rgba(255, 192, 203, 1)': { menu: 'rgba(255,192,203,0.65)',  btn: 'rgba(255,192,203,1)', hoverBtn: 'rgba(179,144,152,1)', hoverText: '#000', top: 'rgba(43,32,34,1)', text: 'rgba(43,32,34,1)' },
      'rgba(0, 255, 255, 1)':   { menu: 'rgba(0,255,255,0.65)',    btn: 'rgba(0,255,255,1)', hoverBtn: 'rgba(0,179,179,1)', hoverText: '#000', top: 'rgba(0,43,43,1)', text: 'rgba(0,43,43,1)' },
      'rgba(0, 0, 139, 1)':     { menu: 'rgba(0,0,139,0.65)',      btn: 'rgba(0,0,139,1)', hoverBtn: 'rgba(0,0,96,1)', hoverText: 'aliceblue', top: 'rgba(0,0,23,1)', text: 'aliceblue' },
      'rgba(0, 255, 0, 1)':     { menu: 'rgba(0,255,0,0.65)',      btn: 'rgba(0,255,0,1)', hoverBtn: 'rgba(0,179,0,1)', hoverText: '#000', top: 'rgba(0,43,0,1)', text: 'rgba(0,43,0,1)' },
      'rgba(255, 0, 255, 1)':   { menu: 'rgba(255,0,255,0.65)',    btn: 'rgba(255,0,255,1)', hoverBtn: 'rgba(179,0,179,1)', hoverText: '#000', top: 'rgba(43,0,43,1)', text: 'rgba(43,0,43,1)' },
      'rgba(255, 255, 254, 1)': { menu: 'rgba(255,255,255,0.65)',  btn: '#A4A5A6', hoverBtn: '#737373', hoverText: '#000', top: 'rgba(43,43,43,1)', text: 'rgba(43,43,43,1)' },
      'rgba(64, 64, 64, 1)':    { menu: 'rgba(64,64,64,0.65)',     btn: '#A4A5A6', hoverBtn: '#737373', hoverText: 'aliceblue', top: 'rgba(11,11,11,1)', text: 'aliceblue' },
    };
    const c = colorMap[color];
    if (!c) return;
    document.documentElement.style.setProperty('--menuColor', c.menu);
    document.documentElement.style.setProperty('--buttonColor', c.btn);
    document.documentElement.style.setProperty('--hoverButtonColor', c.hoverBtn);
    document.documentElement.style.setProperty('--hoverTextColor', c.hoverText);
    document.documentElement.style.setProperty('--topMenu', c.top);
    document.documentElement.style.setProperty('--textMenu', c.text);
    try {
      const token = localStorage.getItem('token');
      await fetch('https://lancherixstudio-backend.onrender.com/api/users', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sideMenuColor: color }),
      });
    } catch (err) {
      console.error('Error updating side menu color:', err);
    }
  };

  const handleThemeChange = async (theme) => {
    const themeMap = {
      glass: { val: 'rgba(64,64,64,0.3)', text: 'aliceblue', placeholder: 'rgba(200,200,200,0.8)', border: '1px solid rgba(255,255,255,0.2)', alt: 'rgba(255,255,255,0.06)' },
      light: { val: 'rgba(255,255,255,0.7)', text: 'black', placeholder: '#888', border: '1px solid transparent', alt: 'rgba(0,0,0,0.05)' },
      dark:  { val: 'rgba(64,64,64,0.7)', text: 'aliceblue', placeholder: 'rgba(200,200,200,0.8)', border: '1px solid transparent', alt: 'rgba(255,255,255,0.04)' },
    };
    const th = themeMap[theme];
    if (!th) return;
    document.documentElement.style.setProperty('--theme', th.val);
    document.documentElement.style.setProperty('--textTheme', th.text);
    document.documentElement.style.setProperty('--placeholderTheme', th.placeholder);
    document.documentElement.style.setProperty('--borderTheme', th.border);
    document.documentElement.style.setProperty('--altRow', th.alt);
    try {
      const token = localStorage.getItem('token');
      await fetch('https://lancherixstudio-backend.onrender.com/api/users', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeMode: theme }),
      });
    } catch (err) {
      console.error('Error updating theme:', err);
    }
  };

  // ─── Back button helper ───────────────────────────────────────────────────
  const BackButton = ({ onClick }) => (
    <button className="mob-back-btn" onClick={onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06L6.31 9.75h13.44a.75.75 0 0 1 0 1.5H6.31l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
      </svg>
      Back
    </button>
  );

  // ─── Colour + theme strip ─────────────────────────────────────────────────
  const renderColorOptions = () => {
    const colors = [
      { name: 'Blue',      value: 'rgba(0, 147, 203, 1)' },
      { name: 'Green',     value: 'rgba(0, 128, 0, 1)' },
      { name: 'Purple',    value: 'rgba(128, 0, 128, 1)' },
      { name: 'Red',       value: 'rgba(255, 0, 0, 1)' },
      { name: 'Yellow',    value: 'rgba(255, 255, 0, 1)' },
      { name: 'Orange',    value: 'rgba(255, 129, 0, 1)' },
      { name: 'Pink',      value: 'rgba(255, 192, 203, 1)' },
      { name: 'Cyan',      value: 'rgba(0, 255, 255, 1)' },
      { name: 'Dark Blue', value: 'rgba(0, 0, 139, 1)' },
      { name: 'Lime',      value: 'rgba(0, 255, 0, 1)' },
      { name: 'Magenta',   value: 'rgba(255, 0, 255, 1)' },
      { name: 'Bright',    value: 'rgba(255, 255, 254, 1)' },
      { name: 'Space',     value: 'rgba(64, 64, 64, 1)' },
    ];
    return (
      <div className="mob-color-row">
        {colors.map(c => (
          <div
            key={c.name}
            className="mob-color-dot"
            style={{ backgroundColor: c.value }}
            onClick={() => handleColorChange(c.value)}
            title={c.name}
          />
        ))}
      </div>
    );
  };

  const renderThemeOptions = () => (
    <div className="mob-theme-row">
      {[
        { key: 'glass', label: t('glass'),   bg: 'rgba(64,64,64,0.35)', color: 'aliceblue' },
        { key: 'light', label: t('light'),   bg: 'rgba(255,255,255,0.7)', color: '#000' },
        { key: 'dark',  label: t('dark'),    bg: 'rgba(0,0,0,0.9)',      color: 'aliceblue' },
      ].map(th => (
        <button
          key={th.key}
          className="mob-theme-btn"
          style={{ backgroundColor: th.bg, color: th.color }}
          onClick={() => handleThemeChange(th.key)}
        >
          {th.label}
        </button>
      ))}
    </div>
  );

  // ─── SCREENS ──────────────────────────────────────────────────────────────

  const renderMenu = () => (
    <div className="mob-menu">
      {/* Profile card */}
      <div className="mob-profile-card">
        <div
          className="mob-avatar"
          style={{ backgroundImage: `url(${profilePicturePreview || 'https://studio.lancherix.com/Images/defaultProfilePicture.png'})` }}
          onClick={() => document.getElementById('mob-fileInput').click()}
        >
          <span className="mob-avatar-overlay">Edit</span>
        </div>
        <input id="mob-fileInput" type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: 'none' }} />
        <div className="mob-profile-info">
          <p className="mob-profile-name">{firstName} {lastName}</p>
          <p className="mob-profile-username">@{username}</p>
        </div>
      </div>

      {/* Menu groups */}
      <div className="mob-section-group">
        <MenuRow icon={<IconUser />}       label={t('editProfile')}        onClick={() => setSelectedOption('My profile')} />
        <MenuRow icon={<IconPerson />}     label={t('personalInformation')} onClick={() => setSelectedOption('Personal information')} />
        <MenuRow icon={<IconLang />}       label={t('languageAndRegion')}  onClick={() => setSelectedOption('Language')} border />
        <MenuRow icon={<IconAppearance />} label={t('appearance')}         onClick={() => setSelectedOption('Aspect')} />
        <MenuRow icon={<IconTerms />}      label={t('termsOfUse')}         onClick={() => setSelectedOption('Terms of use')} />
      </div>

      <div className="mob-section-group">
        <MenuRow icon={<IconExtensions />} label={t('extensions')}   onClick={() => setSelectedOption('Extensions')} />
      </div>

      <div className="mob-section-group mob-section-danger">
        <MenuRow icon={<IconLogout />} label={t('logout')} onClick={() => setShowLogoutConfirmation(true)} danger />
      </div>
    </div>
  );

  const renderEditProfile = () => (
    <div className="mob-screen">
      <BackButton onClick={() => setSelectedOption(null)} />
      <h2 className="mob-screen-title">{t('editProfile')}</h2>

      <div className="mob-avatar-center">
        <div
          className="mob-avatar mob-avatar-lg"
          style={{ backgroundImage: `url(${profilePicturePreview || 'https://studio.lancherix.com/Images/defaultProfilePicture.png'})` }}
          onClick={() => document.getElementById('mob-fileInput2').click()}
        >
          <span className="mob-avatar-overlay">{t('editProfile')}</span>
        </div>
        <input id="mob-fileInput2" type="file" accept="image/*" onChange={handleProfilePictureChange} style={{ display: 'none' }} />
        <button className="mob-remove-pic" onClick={handleRemovePicture}>{t('removeProfilePicture')}</button>
      </div>

      <form onSubmit={handleSubmit} className="mob-form">
        <div className="mob-form-section">
          <label className="mob-label">{t('email')}</label>
          <input className="mob-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email')} spellCheck="false" />
        </div>
        <div className="mob-form-section">
          <label className="mob-label">{t('firstName')}</label>
          <input className="mob-input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={t('firstName')} spellCheck="false" />
        </div>
        <div className="mob-form-section">
          <label className="mob-label">{t('lastName')}</label>
          <input className="mob-input" type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder={t('lastName')} spellCheck="false" />
        </div>
        <div className="mob-form-row">
          <div className="mob-form-section mob-form-section-sm">
            <label className="mob-label">{t('month')}</label>
            <select className="mob-select" value={birthMonth} onChange={e => setBirthMonth(e.target.value)}>
              <option value="">{t('month')}</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i + 1, 0).toLocaleString('en-US', { month: 'short' })}
                </option>
              ))}
            </select>
          </div>
          <div className="mob-form-section mob-form-section-sm">
            <label className="mob-label">{t('date')}</label>
            <select className="mob-select" value={birthDate} onChange={e => setBirthDate(e.target.value)}>
              <option value="">{t('date')}</option>
              {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
          </div>
          <div className="mob-form-section mob-form-section-sm">
            <label className="mob-label">{t('year')}</label>
            <select className="mob-select" value={birthYear} onChange={e => setBirthYear(e.target.value)}>
              <option value="">{t('year')}</option>
              {Array.from({ length: 100 }, (_, i) => i + 1924).reverse().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="mob-form-section">
          <label className="mob-label">{t('gender')}</label>
          <select className="mob-select mob-select-full" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">{t('gender')}</option>
            <option value="male">{t('male')}</option>
            <option value="female">{t('female')}</option>
            <option value="preferNotToSay">{t('preferNotToSay')}</option>
          </select>
        </div>
        {error && <p className="mob-error">{error}</p>}
        <button type="submit" className="mob-save-btn">{t('saveChanges')}</button>
      </form>
    </div>
  );

  const renderPersonalInfo = () => (
    <div className="mob-screen">
      <BackButton onClick={() => setSelectedOption(null)} />
      <h2 className="mob-screen-title">{t('personalInformation')}</h2>
      <div className="mob-avatar-center">
        <div
          className="mob-avatar mob-avatar-lg"
          style={{ backgroundImage: `url(${profilePicturePreview || 'https://studio.lancherix.com/Images/defaultProfilePicture.png'})` }}
        />
      </div>
      <div className="mob-info-list">
        <InfoRow label="Username"     value={username} />
        <InfoRow label="First Name"   value={firstName} />
        <InfoRow label="Last Name"    value={lastName} />
        <InfoRow label="Date of Birth" value={`${birthDate}/${birthMonth}/${birthYear}`} />
        <InfoRow label="Gender"       value={gender} />
        <InfoRow label="Email"        value={email} last />
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="mob-screen">
      <BackButton onClick={() => setSelectedOption(null)} />
      <h2 className="mob-screen-title">{t('languageAndRegion')}</h2>
      <div className="mob-info-list">
        <InfoRow label="Language" value={currentLang} />
        <InfoRow label="Region"   value={region} last />
      </div>
    </div>
  );

  const renderAspect = () => (
    <div className="mob-screen">
      <BackButton onClick={() => setSelectedOption(null)} />
      <h2 className="mob-screen-title">{t('appearance')}</h2>

      {/* Wallpaper preview */}
      <div className="mob-wallpaper-preview" style={{ backgroundImage: wallpaper }} />

      {/* Theme selector */}
      <p className="mob-section-label">Theme</p>
      {renderThemeOptions()}

      {/* Color selector */}
      <p className="mob-section-label">Accent Color</p>
      {renderColorOptions()}

      {/* Upload */}
      <p className="mob-section-label">{t('uploadWallpaper')}</p>
      <label className="mob-upload-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
        </svg>
        Upload image
        <input type="file" accept="image/*" onChange={handleWallpaperChange} style={{ display: 'none' }} />
      </label>

      {/* Preset wallpapers */}
      <p className="mob-section-label">Presets</p>
      <div className="mob-wallpaper-grid">
        {[
          '/Images/backgroundImage.jpeg',
          '/Images/grandCanyon.jpg',
          '/Images/ireland.jpg',
          '/Images/earth.jpg',
          '/Images/dark101.jpg',
          '/Images/grandCanyon2.jpg',
          '/Images/NASA.jpg',
        ].map((src, i) => (
          <div
            key={i}
            className={`mob-wallpaper-thumb mob-wall${i + 1}`}
            style={{ backgroundImage: `url(${src})` }}
            onClick={() => handleWallpaperChange(src)}
          />
        ))}
      </div>
    </div>
  );

  const renderTermsOfUse = () => (
    <div className="mob-screen">
      <BackButton onClick={() => setSelectedOption(null)} />
      <div className="mob-terms">
        <h1>Terms of Use</h1>
        <p><strong>Effective Date:</strong> December 24th 2025</p>
        <p>These Terms of Use ("Terms") govern your access to and use of Lancherix Studio provided by Lancherix. By using the Service, you agree to be bound by these Terms.</p>
        <h3>1. Eligibility</h3>
        <p>You must be at least 10 years old to use the Service.</p>
        <h3>2. User Accounts</h3>
        <p>You may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials.</p>
        <h3>3. Personal Information</h3>
        <p>We may collect personal information, including your name and username. This information may be shared with other users only as necessary to provide the Service.</p>
        <h3>4. Use of the Service</h3>
        <p>You agree to use the Service responsibly and in compliance with applicable laws. You may not engage in unauthorized or harmful activities.</p>
        <h3>5. Content and License</h3>
        <p>You retain ownership of any content you submit. By submitting, you grant Lancherix a non-exclusive, worldwide, royalty-free license to use it to operate the Service.</p>
        <h3>6. Modifications</h3>
        <p>Lancherix may modify these Terms at any time. Continued use constitutes acceptance of updated Terms.</p>
        <h3>7. Termination</h3>
        <p>Lancherix may suspend or terminate your access at its discretion, including for violations of these Terms.</p>
        <h3>8. Disclaimers &amp; Limitation of Liability</h3>
        <p>The Service is provided "as is" without warranties of any kind. Lancherix is not liable for indirect, incidental, or consequential damages.</p>
        <h3>9. Governing Law</h3>
        <p>These Terms are governed by the laws of the Republic of Colombia.</p>
        <h3>10. Contact</h3>
        <p>Questions: <a href="mailto:lancherix.service@gmail.com">lancherix.service@gmail.com</a></p>
      </div>
    </div>
  );

  const renderExtensions = () => (
    <div className="mob-screen">
      <BackButton onClick={() => setSelectedOption(null)} />
      <h2 className="mob-screen-title">{t('extensions')}</h2>
      <div className="mob-info-list">
        <InfoRow label="Music"       value="—" />
        <InfoRow label="Matrix"      value="—" />
        <InfoRow label="Celebration" value="—" last />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedOption) {
      case 'My profile':          return renderEditProfile();
      case 'Personal information': return renderPersonalInfo();
      case 'Language':            return renderLanguage();
      case 'Aspect':              return renderAspect();
      case 'Terms of use':        return renderTermsOfUse();
      case 'Extensions':          return renderExtensions();
      default:                    return renderMenu();
    }
  };

  return (
    <div className="mob-root">
      <div className="mob-window">
        {renderContent()}
      </div>
      <LogoutPage
        isOpen={showLogoutConfirmation}
        onClose={() => setShowLogoutConfirmation(false)}
      />
    </div>
  );
};

// ─── Small helper components ────────────────────────────────────────────────

const MenuRow = ({ icon, label, onClick, border, danger }) => (
  <div className={`mob-menu-row${border ? ' mob-menu-row-border' : ''}${danger ? ' mob-menu-row-danger' : ''}`} onClick={onClick}>
    <span className="mob-menu-row-icon">{icon}</span>
    <span className="mob-menu-row-label">{label}</span>
    <svg className="mob-menu-row-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
    </svg>
  </div>
);

const InfoRow = ({ label, value, last }) => (
  <div className={`mob-info-row${last ? ' mob-info-row-last' : ''}`}>
    <span className="mob-info-label">{label}</span>
    <span className="mob-info-value">{value}</span>
  </div>
);

// ─── Icon components ─────────────────────────────────────────────────────────
const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
  </svg>
);
const IconPerson = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
  </svg>
);
const IconLang = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M9 2.25a.75.75 0 0 1 .75.75v1.506a49.384 49.384 0 0 1 5.343.371.75.75 0 1 1-.186 1.489c-.66-.083-1.323-.151-1.99-.206a18.67 18.67 0 0 1-2.97 6.323c.318.384.65.753 1 1.107a.75.75 0 0 1-1.07 1.052A18.902 18.902 0 0 1 9 13.687a18.823 18.823 0 0 1-5.656 4.482.75.75 0 0 1-.688-1.333 17.323 17.323 0 0 0 5.396-4.353A18.72 18.72 0 0 1 5.89 8.598a.75.75 0 0 1 1.388-.568A17.21 17.21 0 0 0 9 11.224a17.168 17.168 0 0 0 2.391-5.165 48.04 48.04 0 0 0-8.298.307.75.75 0 0 1-.186-1.489 49.159 49.159 0 0 1 5.343-.371V3A.75.75 0 0 1 9 2.25Z" clipRule="evenodd" />
  </svg>
);
const IconAppearance = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
    <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
  </svg>
);
const IconTerms = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);
const IconExtensions = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 0 1 .878.645 49.17 49.17 0 0 1 .376 5.452.657.657 0 0 1-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 0 0-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 0 1-.595 4.845.75.75 0 0 1-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 0 1-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 0 1-.658.643 49.118 49.118 0 0 1-4.708-.36.75.75 0 0 1-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 0 0 5.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 0 0 .659-.663 47.703 47.703 0 0 0-.31-4.82.75.75 0 0 1 .83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 0 0 .657-.642Z" />
  </svg>
);
const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 0 0 6 5.25v13.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5V15a.75.75 0 0 1 1.5 0v3.75a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3V5.25a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V9A.75.75 0 0 1 15 9V5.25a1.5 1.5 0 0 0-1.5-1.5h-6Zm10.72 4.72a.75.75 0 0 1 1.06 0l3 3a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 1 1-1.06-1.06l1.72-1.72H9a.75.75 0 0 1 0-1.5h10.94l-1.72-1.72a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
  </svg>
);

export default SettingsPageMobile;