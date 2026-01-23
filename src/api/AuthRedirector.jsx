import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthRedirector = ({ setToken }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');

    // 1️⃣ Si viene token desde Auth → guardarlo
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      if (setToken) setToken(tokenFromUrl);

      // limpiar la URL
      navigate('/', { replace: true });
      return;
    }

    // 2️⃣ Si no hay token ni en URL ni en localStorage → ir a Auth
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      const type =
        location.pathname === '/register' ? 'register' : 'login';

      window.location.href = `https://auth.lancherix.com/${type}`;
    }
  }, [location, navigate, setToken]);

  return <div>Redirecting...</div>;
};

export default AuthRedirector;