import React from 'react';
import { Link } from 'react-router-dom';
import './IntroPage.css';

const IntroPage = () => {
  return (
    <div className="body-introPage">
      <Link to='/login'><button>Login</button></Link>
      <Link to='/register'><button>Register</button></Link>
    </div>
  );
};

export default IntroPage;