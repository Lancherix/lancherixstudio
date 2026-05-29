import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './BoardImageMobile.css';

const SPEED_PRESETS = {
  slow: 5000,
  medium: 3000,
  fast: 1500,
};

const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const getOriginalDownloadUrl = (url) => {
  return url.replace('/upload/', '/upload/fl_attachment,q_100/');
};

const BoardImageMobile = ({
  isOpen,
  imageUrl,
  onClose,
  onNext,
  onPrev,
  currentIndex = 0,
  totalCount = 0,
  images = [],
  onGoTo,
}) => {

  const progressRef = useRef(null);
  const startTimeRef = useRef(null);
  const thumbStripRef = useRef(null);
  const hintTimerRef = useRef(null);

  const [zoomed, setZoomed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState('medium');
  const [showHint, setShowHint] = useState(true);

  const interval = SPEED_PRESETS[speed];

  /* ───────────────────────────────────────────── */

  useEffect(() => {
    if (!isOpen) return;

    setShowHint(true);

    hintTimerRef.current = setTimeout(() => {
      setShowHint(false);
    }, 3000);

    return () => clearTimeout(hintTimerRef.current);

  }, [isOpen]);

  /* ───────────────────────────────────────────── */

  const animateProgress = useCallback(() => {

    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const elapsed = performance.now() - startTimeRef.current;

    const pct = Math.min(elapsed / interval, 1);

    setProgress(pct);

    if (pct < 1) {
      progressRef.current = requestAnimationFrame(animateProgress);
    }

  }, [interval]);

  /* ───────────────────────────────────────────── */

  const startSlideshow = useCallback(() => {

    setIsPlaying(true);
    setZoomed(false);
    setProgress(0);

    startTimeRef.current = performance.now();

    if (progressRef.current) {
      cancelAnimationFrame(progressRef.current);
    }

    progressRef.current = requestAnimationFrame(animateProgress);

  }, [animateProgress]);

  const stopSlideshow = useCallback(() => {

    setIsPlaying(false);
    setProgress(0);

    if (progressRef.current) {
      cancelAnimationFrame(progressRef.current);
      progressRef.current = null;
    }

    startTimeRef.current = null;

  }, []);

  const toggleSlideshow = () => {
    if (isPlaying) stopSlideshow();
    else startSlideshow();
  };

  /* ───────────────────────────────────────────── */

  useEffect(() => {

    if (!isPlaying) return;

    const timeout = setTimeout(() => {
      onNext?.();
    }, interval);

    return () => clearTimeout(timeout);

  }, [isPlaying, currentIndex, interval, onNext]);

  /* ───────────────────────────────────────────── */

  useEffect(() => {

    if (isPlaying) {

      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }

      setProgress(0);

      startTimeRef.current = performance.now();

      progressRef.current = requestAnimationFrame(animateProgress);
    }

  }, [imageUrl, isPlaying, animateProgress]);

  /* ───────────────────────────────────────────── */

  useEffect(() => {

    if (isPlaying) {
      stopSlideshow();

      setTimeout(() => {
        startSlideshow();
      }, 0);
    }

  }, [speed]);

  /* ───────────────────────────────────────────── */

  useEffect(() => {

    if (!isOpen) return;

    const handleKeyDown = (e) => {

      if (e.key === 'Escape') onClose?.();

      if (e.key === 'ArrowRight') {
        stopSlideshow();
        onNext?.();
      }

      if (e.key === 'ArrowLeft') {
        stopSlideshow();
        onPrev?.();
      }

      if (e.key === ' ') {
        e.preventDefault();
        toggleSlideshow();
      }
    };

    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };

  }, [isOpen, isPlaying]);

  /* ───────────────────────────────────────────── */

  useEffect(() => {

    if (!thumbStripRef.current) return;

    const active = thumbStripRef.current.querySelector(
      '.mobileBoardImage-thumb.active'
    );

    if (active) {
      active.scrollIntoView({
        inline: 'center',
        behavior: 'smooth',
        block: 'nearest'
      });
    }

  }, [currentIndex]);

  /* ───────────────────────────────────────────── */

  useEffect(() => {

    return () => {
      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }
    };

  }, []);

  /* ───────────────────────────────────────────── */

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

  /* ───────────────────────────────────────────── */

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const hasImages = images.length > 0;

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

        {/* TOP BAR */}

        <div className="mobileBoardImage-topbar">

          <div className="mobileBoardImage-speedToggle">

            {(['slow', 'medium', 'fast']).map((s) => (

              <button
                key={s}
                className={`mobileBoardImage-speedBtn ${speed === s ? 'active' : ''}`}
                onClick={() => setSpeed(s)}
              >
                {s === 'slow' ? '1×' : s === 'medium' ? '2×' : '3×'}
              </button>

            ))}

          </div>

          {/* PLAY */}

          <button
            className="mobileBoardImage-playBtn"
            onClick={toggleSlideshow}
          >

            <div className="mobileBoardImage-playBtn-inner">

              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                  <rect x="2" y="1" width="4" height="12" rx="1" />
                  <rect x="8" y="1" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                  <polygon points="2,1 13,7 2,13" />
                </svg>
              )}

            </div>

            {isPlaying && (

              <svg
                className="mobileBoardImage-progressRing"
                viewBox="0 0 50 50"
              >

                <circle
                  className="mobileBoardImage-progressTrack"
                  cx="25"
                  cy="25"
                  r={RADIUS}
                />

                <circle
                  className="mobileBoardImage-progressFill"
                  cx="25"
                  cy="25"
                  r={RADIUS}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                />

              </svg>

            )}

          </button>

          <button
            className="mobileBoardImage-topBtn"
            onClick={handleDownload}
          >
            ↓
          </button>

          <button
            className="mobileBoardImage-topBtn close"
            onClick={onClose}
          >
            ✕
          </button>

        </div>

        {/* COUNTER */}

        {totalCount > 0 && (

          <div className="mobileBoardImage-counter">
            {currentIndex + 1}
            <span>/</span>
            {totalCount}
          </div>

        )}

        {/* HINT */}

        <div className={`mobileBoardImage-hint ${showHint ? 'visible' : ''}`}>

          <span>Swipe or use arrows</span>

          <span className="mobileBoardImage-hintDot">·</span>

          <span>Space play</span>

        </div>

        {/* NAV */}

        <button
          className="mobileBoardImage-nav mobileBoardImage-prev"
          onClick={() => {
            stopSlideshow();
            onPrev?.();
          }}
        >
          ‹
        </button>

        <button
          className="mobileBoardImage-nav mobileBoardImage-next"
          onClick={() => {
            stopSlideshow();
            onNext?.();
          }}
        >
          ›
        </button>

        {/* IMAGE */}

        <div className={`mobileBoardImage-scroll ${zoomed ? 'zoomed' : ''}`}>

          <img
            src={imageUrl}
            alt="Board"
            draggable={false}
            onClick={() => {
              if (isPlaying) return;
              setZoomed(prev => !prev);
            }}
            className={`mobileBoardImage-image ${zoomed ? 'zoomed' : ''} ${isPlaying ? 'slideshow-active' : ''}`}
          />

        </div>

        {/* THUMB STRIP */}

        {hasImages && (

          <div
            className="mobileBoardImage-thumbStrip"
            ref={thumbStripRef}
          >

            {images.map((url, i) => (

              <button
                key={i}
                className={`mobileBoardImage-thumb ${i === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  stopSlideshow();
                  onGoTo?.(i);
                }}
              >

                <img
                  src={url}
                  alt={`Thumbnail ${i + 1}`}
                  draggable={false}
                />

                {i === currentIndex && (
                  <div className="mobileBoardImage-thumbBar" />
                )}

              </button>

            ))}

          </div>

        )}

      </div>

    </div>,

    document.getElementById('modal-root')
  );
};

export default BoardImageMobile;