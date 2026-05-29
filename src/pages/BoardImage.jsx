import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

const SLIDESHOW_INTERVAL = 3000; // ms between slides

const getOriginalDownloadUrl = (url) => {
    return url.replace(
        '/upload/',
        '/upload/fl_attachment,q_100/'
    );
};

const BoardImage = ({
    isOpen,
    imageUrl,
    onClose,
    onNext,
    onPrev
}) => {
    const containerRef = useRef(null);
    const slideshowRef = useRef(null);

    const [zoomed, setZoomed] = useState(false);
    const [transformOrigin, setTransformOrigin] = useState('center center');
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressRef = useRef(null);
    const startTimeRef = useRef(null);

    // Advance slide and reset progress bar
    const advanceSlide = useCallback(() => {
        onNext?.();
        setProgress(0);
        startTimeRef.current = performance.now();
    }, [onNext]);

    // Animate the progress bar
    const animateProgress = useCallback(() => {
        if (!startTimeRef.current) startTimeRef.current = performance.now();

        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min((elapsed / SLIDESHOW_INTERVAL) * 100, 100);
        setProgress(pct);

        if (pct < 100) {
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    }, []);

    // Start slideshow
    const startSlideshow = useCallback(() => {
        setIsPlaying(true);
        setZoomed(false);
        setProgress(0);
        startTimeRef.current = performance.now();

        progressRef.current = requestAnimationFrame(animateProgress);

        slideshowRef.current = setInterval(() => {
            advanceSlide();
        }, SLIDESHOW_INTERVAL);
    }, [animateProgress, advanceSlide]);

    // Stop slideshow
    const stopSlideshow = useCallback(() => {
        setIsPlaying(false);
        setProgress(0);

        if (slideshowRef.current) {
            clearInterval(slideshowRef.current);
            slideshowRef.current = null;
        }
        if (progressRef.current) {
            cancelAnimationFrame(progressRef.current);
            progressRef.current = null;
        }
        startTimeRef.current = null;
    }, []);

    const toggleSlideshow = () => {
        if (isPlaying) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    };

    // Restart progress animation each time the image changes while playing
    useEffect(() => {
        if (isPlaying) {
            if (progressRef.current) cancelAnimationFrame(progressRef.current);
            setProgress(0);
            startTimeRef.current = performance.now();
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    // Stop slideshow when modal closes
    useEffect(() => {
        if (!isOpen) stopSlideshow();
    }, [isOpen, stopSlideshow]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (slideshowRef.current) clearInterval(slideshowRef.current);
            if (progressRef.current) cancelAnimationFrame(progressRef.current);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') { stopSlideshow(); onNext?.(); }
            if (e.key === 'ArrowLeft') { stopSlideshow(); onPrev?.(); }
            if (e.key === ' ') { e.preventDefault(); toggleSlideshow(); }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, onClose, onNext, onPrev, isPlaying]);

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

    const handleImageClick = (e) => {
        if (isPlaying) return; // Disable zoom during slideshow
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setTransformOrigin(`${x}% ${y}%`);
        setZoomed(!zoomed);

        if (!zoomed) {
            setTimeout(() => {
                containerRef.current?.scrollTo({
                    left:
                        (containerRef.current.scrollWidth -
                            containerRef.current.clientWidth) *
                        (x / 100),
                    top:
                        (containerRef.current.scrollHeight -
                            containerRef.current.clientHeight) *
                        (y / 100),
                    behavior: 'smooth'
                });
            }, 10);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="boardImage-overlay"
            onClick={onClose}
        >
            <div
                className="boardImage-window"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Slideshow progress bar */}
                {isPlaying && (
                    <div className="boardImage-progressBar">
                        <div
                            className="boardImage-progressFill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Top Right */}
                <div className="boardImage-actions">
                    {/* Play / Stop */}
                    <button
                        className={`boardImage-actionBtn boardImage-playBtn ${isPlaying ? 'playing' : ''}`}
                        onClick={toggleSlideshow}
                        title={isPlaying ? 'Stop slideshow (Space)' : 'Play slideshow (Space)'}
                    >
                        {isPlaying ? (
                            // Stop icon — two vertical bars
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                <rect x="2" y="1" width="4" height="12" rx="1"/>
                                <rect x="8" y="1" width="4" height="12" rx="1"/>
                            </svg>
                        ) : (
                            // Play icon — triangle
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                                <polygon points="2,1 13,7 2,13"/>
                            </svg>
                        )}
                    </button>

                    <button
                        className="boardImage-actionBtn"
                        onClick={handleDownload}
                        title="Download"
                    >
                        ↓
                    </button>

                    <button
                        className="boardImage-close"
                        onClick={onClose}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Previous */}
                <button
                    className="boardImage-nav boardImage-prev"
                    onClick={() => { stopSlideshow(); onPrev?.(); }}
                >
                    ‹
                </button>

                {/* Next */}
                <button
                    className="boardImage-nav boardImage-next"
                    onClick={() => { stopSlideshow(); onNext?.(); }}
                >
                    ›
                </button>

                {/* Scroll Container */}
                <div
                    ref={containerRef}
                    className={`boardImage-scrollContainer ${zoomed ? 'zoomed' : ''}`}
                >
                    <img
                        src={imageUrl}
                        alt="Board"
                        draggable={false}
                        onClick={handleImageClick}
                        className={`boardImage-image ${zoomed ? 'zoomed' : ''} ${isPlaying ? 'slideshow-active' : ''}`}
                    />
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default BoardImage;