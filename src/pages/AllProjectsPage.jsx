import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import './Styles/AllProjectsPage.css';

import NewProjectPage from './NewProjectPage';

const AllProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [showNewProject, setShowNewProject] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const projectsToDisplay = searchTerm ? filteredProjects : projects;


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
                        <button className="addProjectBtn-projectsPage" onClick={() => setShowNewProject(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clip-rule="evenodd" />
                            </svg>
                        </button>
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
                            placeholder="Search in your projects"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* ===== Content ===== */}
                {/* ===== Content ===== */}
                <div className="content-projectsPage">
                    {projectsToDisplay
                        .slice() // make a copy to avoid mutating state
                        .sort((a, b) => {
                            const order = { pinned: 0, active: 1, completed: 2, archived: 3, hidden: 4 };
                            const aStatus = a.status ?? "active";
                            const bStatus = b.status ?? "active";
                            return (order[aStatus] ?? 4) - (order[bStatus] ?? 4);
                        })
                        .map((project, i) => {
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
                                            {status === "pinned" && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-7">
                                                    <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clip-rule="evenodd" />
                                                </svg>
                                            )}

                                            {status === "archived" && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                                    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                                                    <path fill-rule="evenodd" d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Zm6.163 3.75A.75.75 0 0 1 10 12h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" />
                                                </svg>
                                            )}

                                            {status === "hidden" && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113Z" />
                                                    <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0 1 15.75 12ZM12.53 15.713l-4.243-4.244a3.75 3.75 0 0 0 4.244 4.243Z" />
                                                    <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 0 0-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 0 1 6.75 12Z" />
                                                </svg>
                                            )}
                                            {status === "completed" && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                                    <path fill-rule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z" clip-rule="evenodd" />
                                                    <path fill-rule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Zm9.586 4.594a.75.75 0 0 0-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.116-.062l3-3.75Z" clip-rule="evenodd" />
                                                </svg>
                                            )}
                                            {status === "active" && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                                    <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        <div className="col-priority-projectsPage">
                                            <span className={`priority-dot priority-${project.priority}`} />
                                        </div>

                                        <div className="col-members-projectsPage">
                                            {(project.collaborators?.length ?? 0) + 1}
                                        </div>

                                        <div className="col-visibility-projectsPage">
                                            {project.visibility === "public" ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                                                    <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM6.262 6.072a8.25 8.25 0 1 0 10.562-.766 4.5 4.5 0 0 1-1.318 1.357L14.25 7.5l.165.33a.809.809 0 0 1-1.086 1.085l-.604-.302a1.125 1.125 0 0 0-1.298.21l-.132.131c-.439.44-.439 1.152 0 1.591l.296.296c.256.257.622.374.98.314l1.17-.195c.323-.054.654.036.905.245l1.33 1.108c.32.267.46.694.358 1.1a8.7 8.7 0 0 1-2.288 4.04l-.723.724a1.125 1.125 0 0 1-1.298.21l-.153-.076a1.125 1.125 0 0 1-.622-1.006v-1.089c0-.298-.119-.585-.33-.796l-1.347-1.347a1.125 1.125 0 0 1-.21-1.298L9.75 12l-1.64-1.64a6 6 0 0 1-1.676-3.257l-.172-1.03Z" clip-rule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                    <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>


                                        <div className="col-deadline-projectsPage">
                                            {project.deadline
                                                ? new Date(project.deadline).toLocaleDateString()
                                                : " "}
                                        </div>

                                        <div className="col-updated-projectsPage">
                                            {project.updatedAt
                                                ? new Date(project.updatedAt).toLocaleDateString()
                                                : " "}
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
            <NewProjectPage
                isOpen={showNewProject}
                onClose={() => setShowNewProject(false)}
            />
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default AllProjectsPage;