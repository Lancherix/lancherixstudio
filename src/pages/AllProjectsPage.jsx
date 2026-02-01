import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Styles/AllProjectsPage.css';

const AllProjectsPage = () => {
    return (
        <div className='all-projectsPage'>
            <div className='window-projectsPage'>
                <div className="header-projectsPage">
                    {/* Left */}
                    <div className="headerLeft-projectsPage">
                        <button className="addProjectBtn-projectsPage">＋</button>
                    </div>

                    {/* Columns */}
                    <div className="headerCols-projectsPage">
                        <div className="col-name-projectsPage">Name</div>
                        <div className="col-status-projectsPage">Status</div>
                        <div className="col-priority-projectsPage">Priority</div>
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
                <div className="content-projectsPage">
                    <div className="row-projectsPage">
                        <div className="col-name-projectsPage">
                            <span className="projectIcon-projectsPage">🤍</span>
                            <span className="projectName-projectsPage">Kiarita</span>
                        </div>

                        <div className="col-status-projectsPage pinned">pinned</div>

                        <div className="col-priority-projectsPage">
                            <span className="priorityDot-projectsPage low" />
                        </div>

                        <div className="col-updated-projectsPage">Today</div>

                        <div className="col-actions-projectsPage" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllProjectsPage;