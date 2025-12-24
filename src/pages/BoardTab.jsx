import React, { useEffect, useState } from "react";
import "./Styles/BoardTab.css";

export default function BoardTab({ projectId }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem("token");

    /* ============================
       Fetch board on mount
    ============================ */
    useEffect(() => {
        if (!projectId) return;

        const fetchBoard = async () => {
            try {
                const res = await fetch(
                    `https://lancherixstudio-backend.onrender.com/api/boards/project/${projectId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) throw new Error("Failed to load board");

                const data = await res.json();
                setImages(data.images || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBoard();
    }, [projectId]);

    /* ============================
       Upload image(s)
    ============================ */
    const handleDrop = async (e) => {
        e.preventDefault();

        const files = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith("image/")
        );

        if (!files.length) return;

        for (const file of files) {
            const formData = new FormData();
            formData.append("image", file);

            try {
                const res = await fetch(
                    `https://lancherixstudio-backend.onrender.com/api/boards/project/${projectId}/image`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        body: formData,
                    }
                );

                if (!res.ok) throw new Error("Upload failed");

                const data = await res.json();
                setImages(data.images); // backend is source of truth
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    /* ============================
       Delete image
    ============================ */
    const handleDelete = async (imageId) => {
        try {
            const res = await fetch(
                `https://lancherixstudio-backend.onrender.com/api/boards/image/${imageId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) throw new Error("Failed to delete image");

            setImages(prev => prev.filter(img => img._id !== imageId));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="board-loading">Loading board…</div>;
    }

    return (
        <div
            className="board-total"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className="board-tab">
                {images.map(img => (
                    <div key={img._id} className="board-image-wrapper">
                        <img
                            src={img.url}
                            alt="board"
                            className="board-image"
                            draggable={false}
                        />

                        <button
                            className="delete-image-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(img._id);
                            }}
                            aria-label="Delete image"
                        >
                            ✕
                        </button>
                    </div>
                ))}

                {images.length === 0 && (
                    <div className="board-empty">
                        Drag images here
                    </div>
                )}
            </div>
        </div>
    );
}