import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`https://lancherixstudio-backend.onrender.com/api/users?username=${username}`);
        if (!response.ok) {
          throw new Error('User not found');
        }
        const foundUser = await response.json();
        setUser(foundUser);

        document.title = `${foundUser.fullName}`;
      } catch (error) {
        setError(error.message);
      }
    };

    fetchUser();
  }, [username]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div></div>;
  }

  return (
    <div className='all-memberPage'>
      <div className='window-memberPage'>
        <div className='menu-memberPage'>
          <div className='profilePicture-memberPage'
            style={{
              backgroundImage: `url(${user.profilePicture?.url ||
                'https://tse1.mm.bing.net/th?q=profile%20pic%20blank&w=250&h=250&c=7'})`
            }}></div>
          <h1>{user.fullName}</h1>
          <p>{user.username}</p>
          <div className='btns-memberPage'>
            <button className='btn1-memberPage'>Follow</button>
            <button className='btn2-memberPage'>Message</button>
          </div>
        </div>
        <div className='content-memberPage'></div>
      </div>
    </div>
  );
};

export default UserProfilePage;