import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Artwork/registerLogo.png';
import './RegisterPage.css';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username || !email || !fullName || !birthMonth || !birthDate || !birthYear || !gender || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }

    const usernameRegex = /^[a-z0-9._]{1,20}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 1-20 characters long and contain only lowercase letters, numbers, periods, or underscores.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }

    const passwordRegex = /^(?=.*[0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 6 characters long and contain at least one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('https://lancherixstudio-backend.onrender.com/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          fullName,
          month: birthMonth,
          date: birthDate,
          year: birthYear,
          gender,
          password,
          confirmPassword
        }),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem('token', data.token);

        navigate('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Registration failed');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderPasswordToggle = () => {
    if (password) {
      return (
        <span className="toggle-registerPage" onClick={togglePasswordVisibility}>
          {showPassword ? 'Hide' : 'Show'}
        </span>
      );
    }
    return null;
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const renderConfirmPasswordToggle = () => {
    if (confirmPassword) {
      return (
        <span className="toggle-registerPage" onClick={toggleConfirmPasswordVisibility}>
          {showConfirmPassword ? 'Hide' : 'Show'}
        </span>
      );
    }
    return null;
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="all-registerPage">
      <div className='main-registerPage'>
        <img src={Logo} alt="Lancherix" />
        <form onSubmit={handleSubmit}>
          <div className='input-registerPage'>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='inputUsername-registerPage'
              pattern="^[a-z0-9._]{1,20}$"
              title="Username must be 1-20 characters long and contain only lowercase letters, numbers, periods, and underscores"
              spellcheck="false"
            />
          </div>
          <div className='input-registerPage'>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='inputEmail-registerPage'
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              title="Please enter a valid email address"
              spellcheck="false"
            />
          </div>
          <div className='input-registerPage'>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className='inputName-registerPage'
              spellcheck="false"
            />
          </div>
          <div className='fullDate-registerPage'>
            <div className='inputDate-registerPage'>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className='inputD-registerPage'
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i + 1, 0).toLocaleString('en-US', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className='inputDate-registerPage'>
              <select
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className='inputD-registerPage'
              >
                <option value="">Date</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div className='inputDate-registerPage'>
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className='inputD-registerPage'
              >
                <option value="">Year</option>
                {Array.from({ length: 100 }, (_, i) => (
                  <option key={i + 1924} value={i + 1924}>
                    {i + 1924}
                  </option>
                )).reverse()}
              </select>
            </div>
          </div>
          <div className='input-registerPage'>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className='inputD-registerPage'
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="preferNotToSay">Prefer not to say</option>
            </select>
          </div>
          <div className='input-registerPage'>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='inputPassword-registerPage'
              spellcheck="false"
            />
            {renderPasswordToggle()}
          </div>
          <div className='input-registerPage'>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className='inputPassword-registerPage'
              spellcheck="false"
            />
            {renderConfirmPasswordToggle()}
          </div>
          {error && <div className='error-registerPage'>{error}</div>}
          <button type="submit">Register</button>
          <a onClick={handleLoginClick}>I already have an account</a>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;