import React, { useEffect, useState } from "react";
import "./Styles/BoardTab.css";

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