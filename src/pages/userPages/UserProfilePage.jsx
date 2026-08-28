import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './UserProfilePage.css';
import ProjectIcon from '../../icons/ProjectIcon';

const UserProfilePage = () => {
  const { t } = useTranslation();
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
          throw new Error(t('userNotFound'));
        }

        const foundUser = await response.json();
        setUser(foundUser);
        document.title = `${foundUser.firstName}${" "}${foundUser.lastName}`;
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
          throw new Error(t('failedFetchProjects'));
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
    return <div>{t('errorPrefix')} {error}</div>;
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
          <h1>{user.firstName}{" "}{user.lastName}</h1>
          <p>{user.username}</p>
          {/*<div className='btns-memberPage'>
            <button className='btn1-memberPage'>Follow</button>
            <button className='btn2-memberPage'>Message</button>
          </div>*/}
        </div>
        <div className="content-memberPage">

          {loadingProjects ? (
            <p className="empty-state">{t('loadingProjects')}</p>
          ) : projects.length === 0 ? (
            <p className="empty-state">
              {t('noPublicProjects')}
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
                      <ProjectIcon name={project.icon} size={26} />
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