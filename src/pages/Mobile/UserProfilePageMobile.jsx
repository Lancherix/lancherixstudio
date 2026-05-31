import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './UserProfilePageMobile.css';

const UserProfilePageMobile = () => {
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
        document.title = `${foundUser.firstName} ${foundUser.lastName}`;
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
    return <div className="error-mobile">Error: {error}</div>;
  }

  if (!user) {
    return <div></div>;
  }

  // ─────────────────────────────
  // Render
  // ─────────────────────────────
  return (
    <div className="all-memberPage-mobile">
      <div className="window-memberPage-mobile">

        {/* ── Header / profile strip ── */}
        <div className="header-memberPage-mobile">
          <div
            className="profilePicture-memberPage-mobile"
            style={{
              backgroundImage: `url(${
                user.profilePicture?.url ||
                'https://studio.lancherix.com/Images/defaultProfilePicture.png'
              })`,
            }}
          />
          <div className="headerInfo-memberPage-mobile">
            <h1>{user.firstName} {user.lastName}</h1>
            <p>@{user.username}</p>
          </div>
        </div>

        {/* ── Projects section ── */}
        <div className="content-memberPage-mobile">
          {loadingProjects ? (
            <p className="empty-state-mobile">Loading projects…</p>
          ) : projects.length === 0 ? (
            <p className="empty-state-mobile">
              This studio has no public projects yet.
            </p>
          ) : (
            <div className="projects-grid-mobile">
              {projects.map(project => (
                <Link
                  key={project._id}
                  to={`/projects/${project.slug}`}
                  target="_blank"
                  className="project-card-mobile"
                >
                  <span className="project-icon-mobile">
                    {project.icon || '📁'}
                  </span>
                  <div className="project-meta-mobile">
                    <h3>{project.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserProfilePageMobile;