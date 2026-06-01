import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

// Speed presets
const SPEED_PRESETS = {
    slow: 5000,
    medium: 3000,
    fast: 1500,
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
    currentIndex = 0,
    totalCount = 0,
    images = [],
    onGoTo,
}) => {
    const containerRef = useRef(null);
    const progressRef = useRef(null);
    const startTimeRef = useRef(null);
    const thumbStripRef = useRef(null);
    const hintTimerRef = useRef(null);

    const [zoomed, setZoomed] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0–1
    const [speed, setSpeed] = useState('medium');
    const [showHint, setShowHint] = useState(true);

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

    const startSlideshow = useCallback(() => {
        setIsPlaying(true);
        setZoomed(false);
        setProgress(0);
        startTimeRef.current = performance.now();
        if (progressRef.current) cancelAnimationFrame(progressRef.current);
        progressRef.current = requestAnimationFrame(animateProgress);
    }, [animateProgress]);

    const stopSlideshow = useCallback(() => {
        setIsPlaying(false);
        setProgress(0);
        if (progressRef.current) { cancelAnimationFrame(progressRef.current); progressRef.current = null; }
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

    // Restart slideshow when speed changes
    useEffect(() => {
        if (isPlaying) {
            stopSlideshow();
            setTimeout(() => startSlideshow(), 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speed]);

    useEffect(() => {
        if (!isPlaying) return;
        const timeout = setTimeout(() => { onNext?.(); }, interval);
        return () => clearTimeout(timeout);
    }, [isPlaying, currentIndex, interval, onNext]);

    useEffect(() => { if (!isOpen) stopSlideshow(); }, [isOpen, stopSlideshow]);

    useEffect(() => {
        return () => { if (progressRef.current) cancelAnimationFrame(progressRef.current); };
    }, []);

    // Keyboard shortcuts
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
                    top: (containerRef.current.scrollHeight - containerRef.current.clientHeight) * (y / 100),
                    behavior: 'smooth'
                });
            }, 10);
        }
    };

    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    if (!isOpen) return null;

    const hasImages = images.length > 0;
    const hasCounter = totalCount > 0;

    return createPortal(
        <div className="boardImage-overlay" onClick={onClose}>
            <div className="boardImage-window" onClick={(e) => e.stopPropagation()}>

                {/* ── Top bar ── */}
                <div className="boardImage-topBar">

                    {/* LEFT: counter */}
                    <div className="boardImage-counter">
                        {hasCounter && (
                            <div className="boardImage-counter-pill">
                                <span className="boardImage-counter-current">{currentIndex + 1}</span>
                                <span className="boardImage-counter-sep">/</span>
                                <span className="boardImage-counter-total">{totalCount}</span>
                            </div>
                        )}
                    </div>

                    {/* CENTER: speed + play pill */}
                    <div className="boardImage-centerPill">
                        <div className="boardImage-centerPill-inner">

                            {/* Speed buttons */}
                            <div className="boardImage-speedGroup">
                                {(['slow', 'medium', 'fast']).map((s) => (
                                    <button
                                        key={s}
                                        className={`boardImage-speedBtn ${speed === s ? 'active' : ''}`}
                                        onClick={() => setSpeed(s)}
                                        title={`Speed: ${s}`}
                                    >
                                        {s === 'slow' ? '1×' : s === 'medium' ? '2×' : '3×'}
                                    </button>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="boardImage-pillDivider" />

                            {/* Play button with progress ring */}
                            <button
                                className="boardImage-playBtn"
                                onClick={toggleSlideshow}
                                title={isPlaying ? 'Stop slideshow (Space)' : 'Play slideshow (Space)'}
                            >
                                <div className="boardImage-playBtn-inner">
                                    {isPlaying ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                            <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                            <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>

                                {isPlaying && (
                                    <svg
                                        className="boardImage-progressRing"
                                        viewBox="0 0 50 50"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle className="boardImage-progressRing-track" cx="25" cy="25" r={RADIUS} />
                                        <circle
                                            className="boardImage-progressRing-fill"
                                            cx="25" cy="25" r={RADIUS}
                                            strokeDasharray={CIRCUMFERENCE}
                                            strokeDashoffset={strokeDashoffset}
                                        />
                                    </svg>
                                )}
                            </button>

                        </div>
                    </div>

                    {/* RIGHT: download + close */}
                    <div className="boardImage-rightActions">
                        <button className="boardImage-actionBtn" onClick={handleDownload} title="Download">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
                                <path fillRule="evenodd" d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Zm-6.75-10.5a.75.75 0 0 0-1.5 0v4.19l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V10.5Z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <button className="boardImage-close" onClick={onClose} title="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="17" height="17">
                                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                </div>

                {/* ── Navigation arrows ── */}
                <button
                    className="boardImage-nav boardImage-prev"
                    onClick={() => { stopSlideshow(); onPrev?.(); }}
                >
                    ‹
                </button>
                <button
                    className="boardImage-nav boardImage-next"
                    onClick={() => { stopSlideshow(); onNext?.(); }}
                >
                    ›
                </button>

                {/* ── Keyboard hint ── */}
                <div className={`boardImage-hint ${showHint ? 'visible' : ''}`}>
                    <span>⬅ ➡ navigate</span>
                    <span className="boardImage-hint-dot">·</span>
                    <span>Space play</span>
                    <span className="boardImage-hint-dot">·</span>
                    <span>Esc close</span>
                </div>

                {/* ── Scroll / zoom container ── */}
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
                                <img src={url} alt={`Thumbnail ${i + 1}`} draggable={false} />
                                {i === currentIndex && <div className="boardImage-thumb-activeBar" />}
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