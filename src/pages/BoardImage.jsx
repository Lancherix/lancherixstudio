import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

const SLIDESHOW_INTERVAL = 3000; // ms between slides

// Circumference of the SVG ring circle (r=21 → 2πr ≈ 131.9)
const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const getOriginalDownloadUrl = (url) => {
    return url.replace('/upload/', '/upload/fl_attachment,q_100/');
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
    const progressRef = useRef(null);
    const startTimeRef = useRef(null);

    const [zoomed, setZoomed] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0–1

    // Animate the ring progress
    const animateProgress = useCallback(() => {
        if (!startTimeRef.current) startTimeRef.current = performance.now();
        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min(elapsed / SLIDESHOW_INTERVAL, 1);
        setProgress(pct);
        if (pct < 1) {
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    }, []);

    const advanceSlide = useCallback(() => {
        onNext?.();
        setProgress(0);
        startTimeRef.current = performance.now();
    }, [onNext]);

    const startSlideshow = useCallback(() => {
        setIsPlaying(true);
        setZoomed(false);
        setProgress(0);
        startTimeRef.current = performance.now();
        progressRef.current = requestAnimationFrame(animateProgress);
        slideshowRef.current = setInterval(advanceSlide, SLIDESHOW_INTERVAL);
    }, [animateProgress, advanceSlide]);

    const stopSlideshow = useCallback(() => {
        setIsPlaying(false);
        setProgress(0);
        if (slideshowRef.current) { clearInterval(slideshowRef.current); slideshowRef.current = null; }
        if (progressRef.current) { cancelAnimationFrame(progressRef.current); progressRef.current = null; }
        startTimeRef.current = null;
    }, []);

    const toggleSlideshow = () => {
        if (isPlaying) stopSlideshow();
        else startSlideshow();
    };

    // Restart progress animation when image changes while playing
    useEffect(() => {
        if (isPlaying) {
            if (progressRef.current) cancelAnimationFrame(progressRef.current);
            setProgress(0);
            startTimeRef.current = performance.now();
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    useEffect(() => { if (!isOpen) stopSlideshow(); }, [isOpen, stopSlideshow]);

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
        if (isPlaying) return;
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomed(!zoomed);
        if (!zoomed) {
            setTimeout(() => {
                containerRef.current?.scrollTo({
                    left: (containerRef.current.scrollWidth - containerRef.current.clientWidth) * (x / 100),
                    top:  (containerRef.current.scrollHeight - containerRef.current.clientHeight) * (y / 100),
                    behavior: 'smooth'
                });
            }, 10);
        }
    };

    // Ring stroke offset: full = CIRCUMFERENCE (empty), 0 = full circle
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    if (!isOpen) return null;

    return createPortal(
        <div className="boardImage-overlay" onClick={onClose}>
            <div className="boardImage-window" onClick={(e) => e.stopPropagation()}>

                {/* Top Right */}
                <div className="boardImage-actions">

                    {/* Play / Stop with circular progress ring */}
                    <button
                        className="boardImage-playBtn"
                        onClick={toggleSlideshow}
                        title={isPlaying ? 'Stop slideshow (Space)' : 'Play slideshow (Space)'}
                    >
                        <div className="boardImage-playBtn-inner">
                            {isPlaying ? (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                                    <rect x="2" y="1" width="4" height="12" rx="1"/>
                                    <rect x="8" y="1" width="4" height="12" rx="1"/>
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
                                    <polygon points="2,1 13,7 2,13"/>
                                </svg>
                            )}
                        </div>

                        {/* Progress ring — only rendered while playing */}
                        {isPlaying && (
                            <svg
                                className="boardImage-progressRing"
                                viewBox="0 0 50 50"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    className="boardImage-progressRing-track"
                                    cx="25" cy="25" r={RADIUS}
                                />
                                <circle
                                    className="boardImage-progressRing-fill"
                                    cx="25" cy="25" r={RADIUS}
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                        )}
                    </button>

                    <button className="boardImage-actionBtn" onClick={handleDownload} title="Download">
                        ↓
                    </button>

                    <button className="boardImage-close" onClick={onClose} title="Close">
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