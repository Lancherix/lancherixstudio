import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Styles/AllProjectsPage.css';

const AllProjectsPage = () => {
    return (
        <div className='all-projectsPage'>
            <div className='window-projectsPage'>
                <div className='header-projectsPage'>
                    <div className="header-left">
                        <button className="new-project-btn">
                            ＋ New Project
                        </button>
                    </div>

                    <div className="header-columns">
                        <span className="col name">Name</span>
                        <span className="col status">Status</span>
                        <span className="col priority">Priority</span>
                        <span className="col deadline">Deadline</span>
                        <span className="col updated">Updated</span>
                    </div>

                    <div className="header-right">
                        <input
                            type="text"
                            placeholder="Search projects"
                            className="search-projects"
                        />
                        <button className="sort-btn">
                            Sort ⌄
                        </button>
                    </div>
                </div>
                <div className="content-projectsPage">
                    <div className="project-row">
                        <div className="col name">
                            <span className="project-icon">🤍</span>
                            <span className="project-name">Kiarita</span>
                        </div>

                        <div className="col status pinned">pinned</div>
                        <div className="col priority low">low</div>
                        <div className="col deadline">—</div>
                        <div className="col updated">Today</div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AllProjectsPage;