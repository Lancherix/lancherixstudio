import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

// Speed presets
const SPEED_PRESETS = {
    slow:   5000,
    medium: 3000,
    fast:   1500,
};

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
    onPrev,
    currentIndex = 0,   // NEW: zero-based index of the current image
    totalCount = 0,     // NEW: total number of images
    images = [],        // NEW: array of image URLs for the thumbnail strip
    onGoTo,             // NEW: (index) => void — jump to a specific image
}) => {
    const containerRef  = useRef(null);
    const slideshowRef  = useRef(null);
    const progressRef   = useRef(null);
    const startTimeRef  = useRef(null);
    const thumbStripRef = useRef(null);
    const hintTimerRef  = useRef(null);

    const [zoomed,      setZoomed]      = useState(false);
    const [isPlaying,   setIsPlaying]   = useState(false);
    const [progress,    setProgress]    = useState(0); // 0–1
    const [speed,       setSpeed]       = useState('medium'); // 'slow' | 'medium' | 'fast'
    const [showHint,    setShowHint]    = useState(true);  // keyboard hint

    const interval = SPEED_PRESETS[speed];

    // ── Dismiss keyboard hint after 3 s ──────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        setShowHint(true);
        hintTimerRef.current = setTimeout(() => setShowHint(false), 3000);
        return () => clearTimeout(hintTimerRef.current);
    }, [isOpen]);

    // ── Progress ring animation ───────────────────────────────────────
    const animateProgress = useCallback(() => {
        if (!startTimeRef.current) startTimeRef.current = performance.now();
        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min(elapsed / interval, 1);
        setProgress(pct);
        if (pct < 1) {
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interval]);

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
        slideshowRef.current = setInterval(advanceSlide, interval);
    }, [animateProgress, advanceSlide, interval]);

    const stopSlideshow = useCallback(() => {
        setIsPlaying(false);
        setProgress(0);
        if (slideshowRef.current) { clearInterval(slideshowRef.current); slideshowRef.current = null; }
        if (progressRef.current)  { cancelAnimationFrame(progressRef.current); progressRef.current = null; }
        startTimeRef.current = null;
    }, []);

    const toggleSlideshow = () => {
        if (isPlaying) stopSlideshow();
        else startSlideshow();
    };

    // Restart animation when image changes while playing
    useEffect(() => {
        if (isPlaying) {
            if (progressRef.current) cancelAnimationFrame(progressRef.current);
            setProgress(0);
            startTimeRef.current = performance.now();
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    // Restart slideshow when speed changes (so new interval takes effect)
    useEffect(() => {
        if (isPlaying) {
            stopSlideshow();
            // tiny delay to let state flush, then restart
            setTimeout(() => startSlideshow(), 0);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speed]);

    useEffect(() => { if (!isOpen) stopSlideshow(); }, [isOpen, stopSlideshow]);

    useEffect(() => {
        return () => {
            if (slideshowRef.current) clearInterval(slideshowRef.current);
            if (progressRef.current)  cancelAnimationFrame(progressRef.current);
        };
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape')      onClose();
            if (e.key === 'ArrowRight') { stopSlideshow(); onNext?.(); }
            if (e.key === 'ArrowLeft')  { stopSlideshow(); onPrev?.(); }
            if (e.key === ' ')          { e.preventDefault(); toggleSlideshow(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, onClose, onNext, onPrev, isPlaying]);

    // Scroll active thumbnail into view
    useEffect(() => {
        if (!thumbStripRef.current) return;
        const active = thumbStripRef.current.querySelector('.boardImage-thumb.active');
        if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }, [currentIndex]);

    // ── Download ──────────────────────────────────────────────────────
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

    // ── Zoom on click ─────────────────────────────────────────────────
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

    // Ring stroke offset
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    if (!isOpen) return null;

    const hasImages    = images.length > 0;
    const hasCounter   = totalCount > 0;

    return createPortal(
        <div className="boardImage-overlay" onClick={onClose}>
            <div className="boardImage-window" onClick={(e) => e.stopPropagation()}>

                {/* ── Top-right action bar ── */}
                <div className="boardImage-actions">

                    {/* Speed toggle */}
                    <div className="boardImage-speedToggle" title="Slideshow speed">
                        {(['slow', 'medium', 'fast']).map((s) => (
                            <button
                                key={s}
                                className={`boardImage-speedBtn ${speed === s ? 'active' : ''}`}
                                onClick={() => setSpeed(s)}
                            >
                                {s === 'slow' ? '1×' : s === 'medium' ? '2×' : '3×'}
                            </button>
                        ))}
                    </div>

                    {/* Play / Stop with progress ring */}
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

                        {isPlaying && (
                            <svg
                                className="boardImage-progressRing"
                                viewBox="0 0 50 50"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle className="boardImage-progressRing-track" cx="25" cy="25" r={RADIUS}/>
                                <circle
                                    className="boardImage-progressRing-fill"
                                    cx="25" cy="25" r={RADIUS}
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                        )}
                    </button>

                    <button className="boardImage-actionBtn" onClick={handleDownload} title="Download">↓</button>
                    <button className="boardImage-close" onClick={onClose} title="Close">✕</button>
                </div>

                {/* ── Image counter (top-left) ── */}
                {hasCounter && (
                    <div className="boardImage-counter">
                        {currentIndex + 1} <span className="boardImage-counter-sep">/</span> {totalCount}
                    </div>
                )}

                {/* ── Keyboard hint (fades after 3 s) ── */}
                <div className={`boardImage-hint ${showHint ? 'visible' : ''}`}>
                    <span>⬅ ➡ navigate</span>
                    <span className="boardImage-hint-dot">·</span>
                    <span>Space play</span>
                    <span className="boardImage-hint-dot">·</span>
                    <span>Esc close</span>
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

                {/* ── Scroll / zoom container ── */}
                <div
                    ref={containerRef}
                    className={`boardImage-scrollContainer ${zoomed ? 'zoomed' : ''} ${hasImages ? 'has-thumbs' : ''}`}
                >
                    <img
                        src={imageUrl}
                        alt="Board"
                        draggable={false}
                        onClick={handleImageClick}
                        className={`boardImage-image ${zoomed ? 'zoomed' : ''} ${isPlaying ? 'slideshow-active' : ''}`}
                    />
                </div>

                {/* ── Thumbnail strip ── */}
                {hasImages && (
                    <div className="boardImage-thumbStrip" ref={thumbStripRef}>
                        {images.map((url, i) => (
                            <button
                                key={i}
                                className={`boardImage-thumb ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => { stopSlideshow(); onGoTo?.(i); }}
                                title={`Image ${i + 1}`}
                            >
                                <img src={url} alt={`Thumbnail ${i + 1}`} draggable={false}/>
                                {i === currentIndex && <div className="boardImage-thumb-activeBar"/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default BoardImage;