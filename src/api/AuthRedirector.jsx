import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthRedirector = ({ setToken }) => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            // Determinar tipo para Kiara popup
            // Si estás en /register → 'register', en /login → 'login', en / → 'login'
            const type = location.pathname === '/register' ? 'register' : 'login';

            window.location.href = `https://auth.lancherix.com/${type}`;


            const handleMessage = (event) => {
                if (event.data.type === 'LANCHERIX_AUTH_SUCCESS') {
                    const { token } = event.data;
                    localStorage.setItem('token', token);
                    if (setToken) setToken(token); // actualizar estado
                    navigate('/'); // redirige al home
                }
            };

            window.addEventListener('message', handleMessage);

            return () => window.removeEventListener('message', handleMessage);
        }
    }, [location.pathname, navigate, setToken]);

    return <div>Redirecting...</div>;
};

export default AuthRedirector;