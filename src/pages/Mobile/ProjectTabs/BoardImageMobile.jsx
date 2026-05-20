import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './BoardImageMobile.css';

const getOriginalDownloadUrl = (url) => {
  return url.replace(
    '/upload/',
    '/upload/fl_attachment,q_100/'
  );
};

const BoardImageMobile = ({
  isOpen,
  imageUrl,
  onClose,
  onNext,
  onPrev
}) => {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') onNext?.();
      if (e.key === 'ArrowLeft') onPrev?.();
    };

    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onNext, onPrev]);

  useEffect(() => {
    if (!isOpen) {
      setZoomed(false);
    }
  }, [isOpen]);

  const handleDownload = async () => {
    try {
      const downloadUrl = getOriginalDownloadUrl(imageUrl);

      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = blobUrl;
      link.download = downloadUrl.split('/').pop();

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="mobileBoardImage-overlay"
      onClick={onClose}
    >
      <div
        className="mobileBoardImage-window"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Top Bar */}
        <div className="mobileBoardImage-topbar">

          <button
            className="mobileBoardImage-topBtn"
            onClick={handleDownload}
            aria-label="Download"
          >
            ↓
          </button>

          <button
            className="mobileBoardImage-topBtn"
            onClick={() => setZoomed(prev => !prev)}
            aria-label="Zoom"
          >
            {zoomed ? '－' : '＋'}
          </button>

          <button
            className="mobileBoardImage-topBtn close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

        </div>

        {/* Navigation */}
        <button
          className="mobileBoardImage-nav mobileBoardImage-prev"
          onClick={onPrev}
          aria-label="Previous"
        >
          ‹
        </button>

        <button
          className="mobileBoardImage-nav mobileBoardImage-next"
          onClick={onNext}
          aria-label="Next"
        >
          ›
        </button>

        {/* Image */}
        <div className={`mobileBoardImage-scroll ${zoomed ? 'zoomed' : ''}`}>
          <img
            src={imageUrl}
            alt="Board"
            draggable={false}
            onClick={() => setZoomed(prev => !prev)}
            className={`mobileBoardImage-image ${zoomed ? 'zoomed' : ''}`}
          />
        </div>

      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default BoardImageMobile;