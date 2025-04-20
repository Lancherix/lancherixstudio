import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Artwork/loginLogo.png';
import './LoginPage.css';

const LoginPage = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username || !password) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      const response = await fetch('https://lancherixstudioapi.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setError(null);
        navigate('/');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid username or password.');
        console.error('Login error:', errorData.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderPasswordToggle = () => {
    if (password) {
      return (
        <span className="toggle-loginPage" onClick={togglePasswordVisibility}>
          {showPassword ? 'Hide' : 'Show'}
        </span>
      );
    }
    return null;
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className="all-loginPage">
      <div className='main-loginPage'>
        <img src={Logo} alt="Lancherix" />
        <form onSubmit={handleSubmit}>
          <div className='input-loginPage'>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='inputUsername-loginPage'
              spellcheck="false"
            />
          </div>
          <div className='input-loginPage'>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='inputPassword-loginPage'
              spellcheck="false"
            />
            {renderPasswordToggle()}
          </div>
          {error && <div className='error-registerPage'>{error}</div>}
          <button type="submit">Login</button>
          <a href="#">Forgot password?</a>
          <button type="button" onClick={handleRegisterClick}>Register</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;