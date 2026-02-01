import React from 'react';
import { Link } from 'react-router-dom';
import './Styles/AllProjectsPage.css';

const projects = [
    {
        id: 1,
        icon: "🤍",
        name: "Kiarita",
        status: "pinned",
        priority: "Low",
        members: 2,
        visibility: "Private",
        deadline: null,
        updated: "Today",
        archived: false,
        hidden: false
    },
    {
        id: 2,
        icon: "🌊",
        name: "Physics",
        status: "Active",
        priority: "High",
        members: 1,
        visibility: "Public",
        deadline: null,
        updated: "Yesterday",
        archived: false,
        hidden: false
    },
    {
        id: 3,
        icon: "📦",
        name: "Old Project",
        status: "Archived",
        priority: "Low",
        members: 0,
        visibility: "Hidden",
        deadline: null,
        updated: "2024",
        archived: true,
        hidden: true
    }
];

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
                    {projects.map(project => (
                        <div className="header-projectsPage" key={project.id}>
                            {/* Left */}
                            <div className="headerLeft-projectsPage">
                                <button className="addProjectBtn-projectsPage">
                                    {project.icon}
                                </button>
                            </div>

                            {/* Columns */}
                            <div className="headerCols-projectsPage projectsGrid">
                                <div className="col-name-projectsPage">{project.name}</div>

                                <div className="col-status-projectsPage">
                                    {project.status === "pinned" ? "📌" : project.status}
                                </div>

                                <div className="col-priority-projectsPage">
                                    {project.priority}
                                </div>

                                <div className="col-members-projectsPage">
                                    {project.members ?? "—"}
                                </div>

                                <div className="col-visibility-projectsPage">
                                    {project.visibility}
                                </div>

                                <div className="col-deadline-projectsPage">
                                    {project.deadline ?? "—"}
                                </div>

                                <div className="col-updated-projectsPage">
                                    {project.updated}
                                </div>

                                <div className="col-actions-projectsPage" />
                            </div>

                            {/* Right (kept for layout consistency) */}
                            <div className="headerRight-projectsPage" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllProjectsPage;