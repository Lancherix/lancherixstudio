import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import './Styles/AllProjectsPage.css';

const AllProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Not authenticated");

                const res = await fetch(
                    "https://lancherixstudio-backend.onrender.com/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error(`Failed to fetch projects (${res.status})`);
                }

                const user = await res.json();

                // IMPORTANT: no filtering
                setProjects(user.projects || []);
                setError(null);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) return <div className="loading-projectsPage">Loading…</div>;
    if (error) return <div className="error-projectsPage">{error}</div>;

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
                    {projects.map((project, i) => {
                        const status = project.status ?? "active";

                        return (
                            <div
                                className={`header-projectsPage ${i % 2 === 1 ? "row-alt" : ""}`}
                                key={project._id}
                                onClick={() => navigate(`/projects/${project.slug}`)}
                            >
                                {/* Left */}
                                <div className="headerLeft-projectsPage">
                                    <button className="addProjectBtn-projectsPage">
                                        {project.icon || "📁"}
                                    </button>
                                </div>

                                {/* Columns */}
                                <div className="headerCols-projectsPage projectsGrid">
                                    <div className="col-name-projectsPage">
                                        <Link to={`/projects/${project.slug}`}>{project.name}</Link>
                                    </div>

                                    <div className="col-status-projectsPage">
                                        {status === "pinned" && "📌"}
                                        {status === "archived" && "Archived"}
                                        {status === "hidden" && "Hidden"}
                                        {status === "completed" && "Completed"}
                                        {status === "active" && "Active"}
                                    </div>

                                    <div className="col-priority-projectsPage">
                                        <span className={`priority-dot priority-${project.priority}`} />
                                    </div>

                                    <div className="col-members-projectsPage">
                                        {(project.collaborators?.length ?? 0) + 1}
                                    </div>

                                    <div className="col-visibility-projectsPage">
                                        {(project.visibility ?? "private").charAt(0).toUpperCase() + (project.visibility ?? "private").slice(1)}
                                    </div>

                                    <div className="col-deadline-projectsPage">
                                        {project.deadline
                                            ? new Date(project.deadline).toLocaleDateString()
                                            : "—"}
                                    </div>

                                    <div className="col-updated-projectsPage">
                                        {project.updatedAt
                                            ? new Date(project.updatedAt).toLocaleDateString()
                                            : "—"}
                                    </div>

                                    <div className="col-actions-projectsPage" />
                                </div>

                                {/* Right */}
                                <div className="headerRight-projectsPage" />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AllProjectsPage;