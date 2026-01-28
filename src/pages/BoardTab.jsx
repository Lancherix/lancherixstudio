import React, { useEffect, useState } from "react";
import "./Styles/BoardTab.css";
const getOriginalDownloadUrl = (url) => {
  return url.replace(
    "/upload/",
    "/upload/fl_attachment,q_100/"
  );
};

export default function BoardTab({ projectId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ✅ IMPORTANT: conditional headers
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  /* ============================
     Fetch board on mount
  ============================ */
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

  /* ============================
     Upload image(s) — MEMBERS ONLY
  ============================ */
  const handleDrop = async (e) => {
    e.preventDefault();
    if (!token) return; // 🔒 block anonymous uploads

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
            headers,
            body: formData,
          }
        );

        if (!res.ok) throw new Error("Upload failed");

        const data = await res.json();
        setImages(data.images);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

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

  /* ============================
     Delete image — MEMBERS ONLY
  ============================ */
  const handleDelete = async (imageId) => {
    if (!token) return;

    try {
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/boards/image/${imageId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!res.ok) throw new Error("Failed to delete image");

      setImages(prev => prev.filter(img => img._id !== imageId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="board-loading"></div>;
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

            {/* ⬇️ Download button (everyone) */}
            <button
              className="download-image-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(img.url);
              }}
              aria-label="Download image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
  <path d="M12 1.5a.75.75 0 0 1 .75.75V7.5h-1.5V2.25A.75.75 0 0 1 12 1.5ZM11.25 7.5v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h3.75Z" />
</svg>
            </button>

            {token && (
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
    </div>
  );
}