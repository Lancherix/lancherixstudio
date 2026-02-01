import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Styles/AllProjectsPage.css';

const AllProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const res = await fetch(
          'https://lancherixstudio-backend.onrender.com/auth/me',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch user');

        const user = await res.json();
        setProjects(user.projects || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchProjects();
  }, []);

  const visibleProjects = projects
    .filter(p => !['hidden', 'archived'].includes(p.status))
    .filter(p =>
      p.name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === 'pinned' && b.status !== 'pinned') return -1;
      if (a.status !== 'pinned' && b.status === 'pinned') return 1;
      return 0;
    });

  return (
    <div className="all-projectsPage">
      <div className="window-projectsPage">

        {/* ===== Header ===== */}
        <div className="header-projectsPage">
          <div className="headerLeft-projectsPage">
            <button className="addProjectBtn-projectsPage">＋</button>
          </div>

          <div className="headerCols-projectsPage projectsGrid">
            <div className="col-name-projectsPage">Name</div>
            <div className="col-status-projectsPage">Status</div>
            <div className="col-priority-projectsPage">Priority</div>
            <div className="col-members-projectsPage">Members</div>
            <div className="col-visibility-projectsPage">Visibility</div>
            <div className="col-deadline-projectsPage">Deadline</div>
            <div className="col-updated-projectsPage">Updated</div>
            <div className="col-actions-projectsPage" />
          </div>

          <div className="headerRight-projectsPage">
            <input
              type="text"
              className="search-projectsPage"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ===== Content ===== */}
        <div className="content-projectsPage">
          {error && <div className="error">{error}</div>}

          {visibleProjects.length === 0 && !error && (
            <div className="empty-projects">No projects found</div>
          )}

          {visibleProjects.map((project) => (
            <Link
              to={`/projects/${project.slug}`}
              key={project._id}
              className="header-projectsPage project-row"
            >
              <div className="headerLeft-projectsPage">
                <button className="addProjectBtn-projectsPage">
                  {project.icon || '📁'}
                </button>
              </div>

              <div className="headerCols-projectsPage projectsGrid">
                <div className="col-name-projectsPage">
                  {project.name}
                  {project.status === 'pinned' && ' 📌'}
                </div>

                <div className="col-status-projectsPage">
                  {project.status || 'active'}
                </div>

                <div className="col-priority-projectsPage">
                  {project.priority || '-'}
                </div>

                <div className="col-members-projectsPage">
                  {(project.collaborators?.length || 0) + 1}
                </div>

                <div className="col-visibility-projectsPage">
                  {project.visibility || 'private'}
                </div>

                <div className="col-deadline-projectsPage">
                  {project.deadline
                    ? new Date(project.deadline).toLocaleDateString()
                    : '-'}
                </div>

                <div className="col-updated-projectsPage">
                  {project.updatedAt
                    ? new Date(project.updatedAt).toLocaleDateString()
                    : '-'}
                </div>

                <div className="col-actions-projectsPage" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AllProjectsPage;