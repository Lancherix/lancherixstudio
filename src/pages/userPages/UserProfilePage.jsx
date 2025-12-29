import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { username } = useParams();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // ─────────────────────────────
  // Fetch user (public)
  // ─────────────────────────────
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/users?username=${username}`
        );

        if (!response.ok) {
          throw new Error('User not found');
        }

        const foundUser = await response.json();
        setUser(foundUser);
        document.title = foundUser.fullName;
      } catch (error) {
        setError(error.message);
      }
    };

    fetchUser();
  }, [username]);

  // ─────────────────────────────
  // Fetch public projects (owner OR collaborator)
  // ─────────────────────────────
  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        setLoadingProjects(true);

        const response = await fetch(
          `https://lancherixstudio-backend.onrender.com/api/users/${username}/public-projects`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

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

  // ─────────────────────────────
  // States
  // ─────────────────────────────
  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!user) {
    return <div></div>;
  }

  // ─────────────────────────────
  // Render
  // ─────────────────────────────
  return (
    <div className='all-memberPage'>
      <div className='window-memberPage'>
        <div className='menu-memberPage'>
          <div className='profilePicture-memberPage'
            style={{
              backgroundImage: `url(${user.profilePicture?.url ||
                'https://studio.lancherix.com/Images/defaultProfilePicture.png'})`
            }}></div>
          <h1>{user.fullName}</h1>
          <p>{user.username}</p>
          {/*<div className='btns-memberPage'>
            <button className='btn1-memberPage'>Follow</button>
            <button className='btn2-memberPage'>Message</button>
          </div>*/}
        </div>
        <div className="content-memberPage">

          {loadingProjects ? (
            <p className="empty-state">Loading projects…</p>
          ) : projects.length === 0 ? (
            <p className="empty-state">
              This studio has no public projects yet.
            </p>
          ) : (
            <div className="projects-grid">
              {projects.map(project => {
                const isOwner =
                  project.owner?.username === user.username;

                return (
                  <Link
                    key={project._id}
                    to={`/projects/${project.slug}`}
                    target='blanck_'
                    className="project-card"
                  >
                    {/* Project icon */}
                    <span className="project-icon">
                      {project.icon || '📁'}
                    </span>

                    {/* Project info */}
                    <div className="project-meta">
                      <h3>{project.name}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;