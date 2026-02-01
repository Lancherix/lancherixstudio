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
      </div>
    </div>
  );
};

export default AllProjectsPage;