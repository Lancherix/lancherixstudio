import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from "./Artwork/loginLogo.png";
import './LoginPage.css';

const LoginPage = ({ setToken }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!identifier || !password) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      const response = await fetch("https://lancherixstudio-backend.onrender.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier, // backend accepts username OR email
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid username or password");
        return;
      }

      // success
      localStorage.setItem("token", data.token);
      setToken(data.token);
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="all-loginPage">
      <div className="main-registerPage">
        <img className='logo-loginPage' src={Logo} alt="Lancherix" />

        <form onSubmit={handleSubmit}>

          <div className="content-registerPage">
            <div className="input-registerPage">
              <input
                type="text"
                placeholder="Username or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className='inputUsername-loginPage'
                spellCheck="false"
              />
            </div>

            <div className="input-registerPage">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='inputPassword-loginPage'
                spellCheck="false"
              />
              {password && (
                <span className="toggle-loginPage" onClick={togglePasswordVisibility}>
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              )}
            </div>
          </div>

          {error && <div className='error-registerPage'>{error}</div>}

          <div className="login-navigation">
            <button type="submit" className="login-navigationprimary-btn">Login</button>
            <p>
                You don't have an account?{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </p>
          </div>
          {/*<p>
                You don't have an account?{" "}
                <button
                  type="button"
                  className="link-registerPage"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </p>*/}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;