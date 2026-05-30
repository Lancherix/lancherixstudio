import React, { useEffect, useRef, useState } from "react";
import "./BoardTabMobile.css";
import BoardImageMobile from "./BoardImageMobile";

const getOriginalDownloadUrl = (url) => {
  return url.replace("/upload/", "/upload/fl_attachment,q_100/");
};

export default function BoardTabsMobile({ projectId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  /* ============================
     Fetch board
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
     Upload — shared logic
  ============================ */
  const uploadFiles = async (files) => {
    if (!token || !files.length) return;
    setUploading(true);

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

    setUploading(false);
  };

  /* ============================
     Upload — drag & drop
  ============================ */
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    uploadFiles(files);
  };

  const handleDragOver = (e) => e.preventDefault();

  /* ============================
     Upload — tap (file picker)
  ============================ */
  const handleFilePickerChange = async (e) => {
    const files = Array.from(e.target.files).filter((f) =>
      f.type.startsWith("image/")
    );
    e.target.value = ""; // reset so same file can be re-picked
    uploadFiles(files);
  };

  /* ============================
     Download image
  ============================ */
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
     Delete image
  ============================ */
  const handleDelete = async (imageId) => {
    if (!token) return;
    try {
      const res = await fetch(
        `https://lancherixstudio-backend.onrender.com/api/boards/image/${imageId}`,
        { method: "DELETE", headers }
      );
      if (!res.ok) throw new Error("Failed to delete image");
      setImages((prev) => prev.filter((img) => img._id !== imageId));
    } catch (err) {
      console.error(err);
    }
  };

  /* ============================
     Modal navigation
  ============================ */
  const openImage = (index) => {
    setSelectedIndex(index);
    setShowImageModal(true);
  };

  const goTo = (index) => setSelectedIndex(index);

  const goNext = () =>
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  const goPrev = () =>
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  /* ============================
     Render
  ============================ */
  if (loading) return <div className="mobile-board-loading"></div>;

  return (
    <div
      className="mobile-board-total"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Hidden file input for tap-to-upload */}
      {token && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="mobile-board-file-input"
          onChange={handleFilePickerChange}
        />
      )}

      <div className="mobile-board-grid">
        {images.map((img, i) => (
          <div key={img._id} className="mobile-board-image-wrapper">
            <img
              src={img.url}
              alt="board"
              className="mobile-board-image"
              draggable={false}
              onClick={() => openImage(i)}
            />

            {/* Download */}
            <button
              className="mobile-board-download-btn"
              onClick={(e) => { e.stopPropagation(); handleDownload(img.url); }}
              aria-label="Download image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Delete */}
            {token && (
              <button
                className="mobile-board-delete-btn"
                onClick={(e) => { e.stopPropagation(); handleDelete(img._id); }}
                aria-label="Delete image"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {images.length === 0 && !uploading && (
          <div className="mobile-board-empty">
            <span className="mobile-board-empty-icon">🖼️</span>
            <h3>Welcome to the Board</h3>
            <p>Drag and drop images here to create a shared gallery.</p>
          </div>
        )}
      </div>

      {/* Tap-to-upload FAB — only for logged-in users */}
      {token && (
        <button
          className={`mobile-board-upload-fab ${uploading ? "loading" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload images"
          disabled={uploading}
        >
          {uploading ? (
            <span className="mobile-board-upload-spinner" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      )}

      <BoardImageMobile
        isOpen={showImageModal}
        imageUrl={images[selectedIndex]?.url}
        onClose={() => setShowImageModal(false)}
        onNext={goNext}
        onPrev={goPrev}
        currentIndex={selectedIndex}
        totalCount={images.length}
        images={images.map((img) => img.url)}
        onGoTo={goTo}
      />
    </div>
  );
}