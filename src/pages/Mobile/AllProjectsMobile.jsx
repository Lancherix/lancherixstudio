import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import './AllProjectsMobile.css';

const AllProjectsMobile = () => {
    const [profilePicture, setProfilePicture] = useState(
        "/Images/defaultProfilePicture.png"
    );

    const [projects, setProjects] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await fetch(
                    "https://lancherixstudio-backend.onrender.com/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) return;

                const user = await response.json();

                if (user.profilePicture?.url) {
                    setProfilePicture(user.profilePicture.url);
                }

                setProjects(user.projects || []);
            } catch (error) {
                console.error("HeaderBar user fetch error:", error);
            }
        };

        fetchUserData();
    }, []);

    const StatusIcon = ({ status }) => {

        if (status === "pinned") {
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className="statusIcon">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
            );
        }

        if (status === "archived") {
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className="statusIcon">
                    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375Z" />
                    <path fillRule="evenodd" d="m3.087 9 .54 9.176A3 3 0 0 0 6.62 21h10.757a3 3 0 0 0 2.995-2.824L20.913 9H3.087Z" clipRule="evenodd" />
                </svg>
            );
        }

        if (status === "hidden") {
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className="statusIcon">
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18Z" />
                    <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1A11.25 11.25 0 0 0 1.323 11.447c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69" />
                </svg>
            );
        }

        if (status === "completed") {
            return (
                <svg viewBox="0 0 24 24" fill="currentColor" className="statusIcon">
                    <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375Z" />
                </svg>
            );
        }

        return (
            <svg viewBox="0 0 24 24" fill="currentColor" className="statusIcon">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
        );
    };

    return (
        <div className="all-projectsMobile">
            <div className="headerBar">
                <div
                    className="headerAvatar"
                    style={{
                        backgroundImage: `url(${profilePicture})`,
                    }}
                />
            </div>
            <div className="content-projectsMobile">

                {projects
                    .slice()
                    .sort((a, b) => {
                        const order = { pinned: 0, active: 1, archived: 2, hidden: 3, completed: 4 };
                        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
                    })
                    .map((project) => (
                        <div
                            key={project._id}
                            className="project-card-mobile"
                            onClick={() => navigate(`/projects/${project.slug}`)}
                        >

                            <div className="project-left-mobile">
                                <span className="project-emoji-mobile">
                                    {project.icon || "📁"}
                                </span>

                                <span className="project-name-mobile">
                                    {project.name}
                                </span>
                            </div>

                            <StatusIcon status={project.status} />

                        </div>
                    ))}

            </div>
        </div>
    );
};

export default AllProjectsMobile;