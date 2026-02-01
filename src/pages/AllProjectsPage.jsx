import React from 'react';
import { Link } from 'react-router-dom';
import './Styles/AllProjectsPage.css';

const AllProjectsPage = () => {
  return (
    <div className="all-projectsPage">
      <div className="window-projectsPage">

        {/* ===== Header ===== */}
        <div className="header-projectsPage">
          {/* Left */}
          <div className="headerLeft-projectsPage">
            <button className="addProjectBtn-projectsPage">＋</button>
          </div>

          {/* Columns */}
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

          {/* Right */}
          <div className="headerRight-projectsPage">
            <input
              type="text"
              className="search-projectsPage"
              placeholder="Search"
            />
          </div>
        </div>

        {/* ===== Content ===== */}
        <div className="content-projectsPage">

          {/* Row */}
          <div className="row-projectsPage projectsGrid">
            <div className="col-name-projectsPage">
              <span className="projectIcon-projectsPage">🤍</span>
              <span className="projectName-projectsPage">Kiarita</span>
            </div>

            <div className="col-status-projectsPage pinned">Pinned</div>

            <div className="col-priority-projectsPage">
              <span className="priorityDot-projectsPage low" />
            </div>

            <div className="col-members-projectsPage">—</div>
            <div className="col-visibility-projectsPage">Private</div>
            <div className="col-deadline-projectsPage">—</div>
            <div className="col-updated-projectsPage">Today</div>

            <div className="col-actions-projectsPage">⋯</div>
          </div>

          {/* Row */}
          <div className="row-projectsPage projectsGrid">
            <div className="col-name-projectsPage">
              <span className="projectIcon-projectsPage">🚀</span>
              <span className="projectName-projectsPage">Launcher</span>
            </div>

            <div className="col-status-projectsPage completed">Completed</div>

            <div className="col-priority-projectsPage">
              <span className="priorityDot-projectsPage medium" />
            </div>

            <div className="col-members-projectsPage">3</div>
            <div className="col-visibility-projectsPage">Public</div>
            <div className="col-deadline-projectsPage">—</div>
            <div className="col-updated-projectsPage">Yesterday</div>

            <div className="col-actions-projectsPage">⋯</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AllProjectsPage;