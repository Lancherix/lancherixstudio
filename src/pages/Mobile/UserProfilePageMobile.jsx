import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './UserProfilePageMobile.css';

const UserProfilePageMobile = () => {
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/users?username=${username}`
        );
        if (!response.ok) throw new Error('User not found');
        const foundUser = await response.json();
        setUser(foundUser);
        document.title = `${foundUser.firstName} ${foundUser.lastName}`;
      } catch (error) {
        setError(error.message);
      }
    };
    fetchUser();
  }, [username]);

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/users/${username}/public-projects`
        );
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchPublicProjects();
  }, [username]);

  if (error) return <div className="upm__error">Error: {error}</div>;
  if (!user) return <div />;

  return (
    <div className="upm__page">

      {/* ── Profile strip ── */}
      <div className="upm__header">
        <div
          className="upm__avatar"
          style={{
            backgroundImage: `url(${
              user.profilePicture?.url ||
              'https://studio.lancherix.com/Images/defaultProfilePicture.png'
            })`,
          }}
        />
        <div className="upm__headerInfo">
          <h1>{user.firstName} {user.lastName}</h1>
          <p>@{user.username}</p>
        </div>
      </div>

      {/* ── Scrollable projects ── */}
      <div className="upm__content">
        {loadingProjects ? (
          <p className="upm__empty">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="upm__empty">This studio has no public projects yet.</p>
        ) : (
          <div className="upm__grid">
            {projects.map(project => (
              <Link
                key={project._id}
                to={`/projects/${project.slug}`}
                target="_blank"
                className="upm__card"
              >
                <span className="upm__cardIcon">{project.icon || '📁'}</span>
                <h3 className="upm__cardName">{project.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default UserProfilePageMobile;