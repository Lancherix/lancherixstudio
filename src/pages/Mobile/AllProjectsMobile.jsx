import React, { useEffect, useState } from "react";
import './AllProjectsMobile.css';

const AllProjectsMobile = () => {
    const [profilePicture, setProfilePicture] = useState(
        "/Images/defaultProfilePicture.png"
    );

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
            } catch (error) {
                console.error("HeaderBar user fetch error:", error);
            }
        };

        fetchUserData();
    }, []);

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
                Hello K
            </div>
        </div>
    );
};

export default AllProjectsMobile;