import React, { useEffect, useState } from "react";
import "./Styles/BoardTab.css";
import BoardImage from './BoardImage';
import { useNavigate, useParams } from "react-router-dom";

const getOriginalDownloadUrl = (url) => {
    return url.replace("/upload/", "/upload/fl_attachment,q_100/");
};

// Extract just the filename from a Cloudinary URL
// e.g. "https://res.cloudinary.com/.../upload/v123/boards/abc123.jpg"  →  "abc123.jpg"
const getFilename = (url) => url.split("/").pop();

export default function BoardTab({ projectId }) {
    const [images,    setImages]    = useState([]);
    const [loading,   setLoading]   = useState(true);

    const token   = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const [selectedIndex,   setSelectedIndex]   = useState(0);
    const [showImageModal,  setShowImageModal]   = useState(false);

    const navigate  = useNavigate();
    const { slug, filename } = useParams(); // filename present when landed via /board/:filename

    /* ============================================================
       Fetch board on mount
    ============================================================ */
    useEffect(() => {
        if (!projectId) return;

        const fetchBoard = async () => {
            try {
                const res = await fetch(
                    `https://lancherixstudio-backend.onrender.com/api/boards/project/${projectId}`,
                    { headers }
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

    /* ============================================================
       If the page was loaded directly via /projects/:slug/board/:filename,
       auto-open the modal once images are available.
    ============================================================ */
    useEffect(() => {
        if (!filename || images.length === 0) return;

        const idx = images.findIndex(img => getFilename(img.url) === filename);
        if (idx !== -1) {
            setSelectedIndex(idx);
            setShowImageModal(true);
        }
    }, [filename, images]);

    /* ============================================================
       URL helpers
    ============================================================ */
    const openImage = (index) => {
        const img = images[index];
        if (!img) return;
        setSelectedIndex(index);
        setShowImageModal(true);
        navigate(`/projects/${slug}/board/${getFilename(img.url)}`, { replace: false });
    };

    const closeModal = () => {
        setShowImageModal(false);
        navigate(`/projects/${slug}`, { replace: true });
    };

    const goTo = (index) => {
        const img = images[index];
        if (!img) return;
        setSelectedIndex(index);
        navigate(`/projects/${slug}/board/${getFilename(img.url)}`, { replace: true });
    };

    const goNext = () => {
        const next = selectedIndex === images.length - 1 ? 0 : selectedIndex + 1;
        goTo(next);
    };

    const goPrev = () => {
        const prev = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;
        goTo(prev);
    };

    /* ============================================================
       Upload
    ============================================================ */
    const handleDrop = async (e) => {
        e.preventDefault();
        if (!token) return;

        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
        if (!files.length) return;

        for (const file of files) {
            const formData = new FormData();
            formData.append("image", file);

            try {
                const res = await fetch(
                    `https://lancherixstudio-backend.onrender.com/api/boards/project/${projectId}/image`,
                    { method: "POST", headers, body: formData }
                );
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();
                setImages(data.images);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleDragOver = (e) => e.preventDefault();

    /* ============================================================
       Download
    ============================================================ */
    const handleDownload = async (url) => {
        try {
            const downloadUrl = getOriginalDownloadUrl(url);
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = downloadUrl.split("/").pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    /* ============================================================
       Delete
    ============================================================ */
    const handleDelete = async (imageId) => {
        if (!token) return;
        try {
            const res = await fetch(
                `https://lancherixstudio-backend.onrender.com/api/boards/image/${imageId}`,
                { method: "DELETE", headers }
            );
            if (!res.ok) throw new Error("Failed to delete image");
            setImages(prev => prev.filter(img => img._id !== imageId));
        } catch (err) {
            console.error(err);
        }
    };

    /* ============================================================
       Render
    ============================================================ */
    if (loading) return <div className="board-loading"></div>;

    return (
        <div className="board-total" onDrop={handleDrop} onDragOver={handleDragOver}>
            <div className="board-tab">
                {images.map((img, i) => (
                    <div key={img._id} className="board-image-wrapper">
                        <img
                            src={img.url}
                            alt="board"
                            className="board-image"
                            draggable={false}
                            onClick={() => openImage(i)}
                        />

                        {/* Download button (everyone) */}
                        <button
                            className="download-image-btn"
                            onClick={(e) => { e.stopPropagation(); handleDownload(img.url); }}
                            aria-label="Download image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {token && (
                            <button
                                className="delete-image-btn"
                                onClick={(e) => { e.stopPropagation(); handleDelete(img._id); }}
                                aria-label="Delete image"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}

                {images.length === 0 && (
                    <div className="board-empty">
                        <span className="board-empty-icon">🖼️</span>
                        <h3>Welcome to the Board</h3>
                        <p>Public projects can be viewed by anyone.</p>
                    </div>
                )}
            </div>

            <BoardImage
                isOpen={showImageModal}
                imageUrl={images[selectedIndex]?.url}
                onClose={closeModal}
                onDownload={handleDownload}
                onNext={goNext}
                onPrev={goPrev}
                currentIndex={selectedIndex}
                totalCount={images.length}
                images={images.map(img => img.url)}
                onGoTo={goTo}
            />
        </div>
    );
}