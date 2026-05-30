import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './BoardImageMobile.css';

// Speed presets
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
    const containerRef = useRef(null);
    const progressRef = useRef(null);
    const startTimeRef = useRef(null);
    const thumbStripRef = useRef(null);
    const hintTimerRef = useRef(null);
    const imageRef = useRef(null);

    // Touch / swipe state
    const swipeStartX = useRef(null);
    const swipeStartY = useRef(null);
    const swipeLocked = useRef(null); // 'h' | 'v' | null

    // Pinch-to-zoom state
    const pinchStartDist = useRef(null);
    const pinchStartScale = useRef(1);
    const pinchOrigin = useRef({ x: 0.5, y: 0.5 }); // relative 0–1
    const activeTouches = useRef([]);

    const [zoomed, setZoomed] = useState(false);
    const [scale, setScale] = useState(1);
    const [isPinching, setIsPinching] = useState(false);
    // Persist origin across renders without causing re-renders
    const [transformOrigin, setTransformOrigin] = useState({ x: 50, y: 50 });

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
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

    // ── Body scroll lock ──────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // ── Reset zoom on image change or close ───────────────────────────
    const resetZoom = useCallback(() => {
        setZoomed(false);
        setScale(1);
        setTransformOrigin({ x: 50, y: 50 });
        pinchStartDist.current = null;
        setIsPinching(false);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            resetZoom();
            stopSlideshow();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Reset zoom when navigating to a new image
    useEffect(() => {
        resetZoom();
    }, [currentIndex, resetZoom]);

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
        resetZoom();
        setProgress(0);
        startTimeRef.current = performance.now();
        if (progressRef.current) cancelAnimationFrame(progressRef.current);
        progressRef.current = requestAnimationFrame(animateProgress);
    }, [animateProgress, resetZoom]);

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

    // Auto-advance while playing
    useEffect(() => {
        if (!isPlaying) return;
        const timeout = setTimeout(() => { onNext?.(); }, interval);
        return () => clearTimeout(timeout);
    }, [isPlaying, currentIndex, interval, onNext]);

    useEffect(() => {
        if (!isOpen) stopSlideshow();
    }, [isOpen, stopSlideshow]);

    useEffect(() => {
        return () => { if (progressRef.current) cancelAnimationFrame(progressRef.current); };
    }, []);

    // ── Keyboard shortcuts ────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                if (zoomed) { resetZoom(); return; }
                onClose?.();
            }
            if (e.key === 'ArrowRight') { stopSlideshow(); onNext?.(); }
            if (e.key === 'ArrowLeft') { stopSlideshow(); onPrev?.(); }
            if (e.key === ' ') { e.preventDefault(); toggleSlideshow(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, onClose, onNext, onPrev, isPlaying, zoomed]);

    // ── Scroll active thumbnail into view ─────────────────────────────
    useEffect(() => {
        if (!thumbStripRef.current) return;
        const active = thumbStripRef.current.querySelector('.mobileBoardImage-thumb.active');
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

    // ── Touch helpers ─────────────────────────────────────────────────
    const getTouchDist = (t1, t2) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchMidpoint = (t1, t2, rect) => ({
        x: ((t1.clientX + t2.clientX) / 2 - rect.left) / rect.width * 100,
        y: ((t1.clientY + t2.clientY) / 2 - rect.top) / rect.height * 100,
    });

    // ── Touch event handlers ──────────────────────────────────────────
    const handleTouchStart = useCallback((e) => {
        activeTouches.current = Array.from(e.touches);

        if (e.touches.length === 2) {
            // Begin pinch — prevent any default browser zoom
            e.preventDefault();
            setIsPinching(true);
            swipeStartX.current = null;
            swipeLocked.current = null;
            const t = activeTouches.current;
            pinchStartDist.current = getTouchDist(t[0], t[1]);
            pinchStartScale.current = scale;
            const rect = imageRef.current?.getBoundingClientRect()
                ?? containerRef.current?.getBoundingClientRect()
                ?? { left: 0, top: 0, width: 1, height: 1 };
            const origin = getTouchMidpoint(t[0], t[1], rect);
            pinchOrigin.current = origin;
            setTransformOrigin(origin);
        } else if (e.touches.length === 1) {
            swipeStartX.current = e.touches[0].clientX;
            swipeStartY.current = e.touches[0].clientY;
            swipeLocked.current = null;
        }
    }, [scale]);

    const handleTouchMove = useCallback((e) => {
        activeTouches.current = Array.from(e.touches);

        if (e.touches.length === 2 && pinchStartDist.current !== null) {
            e.preventDefault();
            const dist = getTouchDist(e.touches[0], e.touches[1]);
            const rawScale = pinchStartScale.current * (dist / pinchStartDist.current);
            const clamped = Math.min(Math.max(rawScale, 0.8), 5);
            setScale(clamped);
            if (clamped > 1.05) setZoomed(true);
            return;
        }

        // Single-finger swipe axis lock
        if (e.touches.length === 1 && swipeStartX.current !== null && !zoomed && !isPinching) {
            const dx = e.touches[0].clientX - swipeStartX.current;
            const dy = e.touches[0].clientY - swipeStartY.current;
            if (!swipeLocked.current) {
                if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                    swipeLocked.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
                }
            }
            if (swipeLocked.current === 'h') e.preventDefault();
        }
    }, [zoomed, isPinching]);

    const handleTouchEnd = useCallback((e) => {
        const remaining = Array.from(e.touches);

        if (remaining.length < 2 && isPinching) {
            setIsPinching(false);
            pinchStartDist.current = null;

            // Snap: if barely zoomed, reset; otherwise keep current scale
            setScale(prev => {
                const snapped = prev < 1.15 ? 1 : prev;
                if (snapped <= 1.05) {
                    setZoomed(false);
                    setTransformOrigin({ x: 50, y: 50 });
                    return 1;
                }
                setZoomed(true);
                return snapped;
            });

            swipeStartX.current = null;
            swipeLocked.current = null;
            return;
        }

        // Swipe detection (single touch ended, not zoomed)
        if (swipeStartX.current !== null && swipeLocked.current === 'h' && !zoomed) {
            const dx = e.changedTouches[0].clientX - swipeStartX.current;
            const THRESHOLD = 50;
            if (Math.abs(dx) > THRESHOLD) {
                stopSlideshow();
                if (dx < 0) onNext?.();
                else onPrev?.();
            }
        }
        swipeStartX.current = null;
        swipeLocked.current = null;
    }, [isPinching, zoomed, stopSlideshow, onNext, onPrev]);

    // Attach touch events — passive:false so we can preventDefault on pinch & horizontal swipe
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener('touchstart', handleTouchStart, { passive: false });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });
        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    // ── Tap to toggle zoom ────────────────────────────────────────────
    const handleImageClick = useCallback(() => {
        if (isPinching || isPlaying) return;
        if (zoomed) {
            resetZoom();
        } else {
            setZoomed(true);
            setScale(2.5);
            setTransformOrigin({ x: 50, y: 50 });
        }
    }, [isPinching, isPlaying, zoomed, resetZoom]);

    // ── Ring stroke offset ────────────────────────────────────────────
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    if (!isOpen) return null;

    const hasImages = images.length > 0;
    const hasCounter = totalCount > 0;

    // Always apply scale transform — persist after pinch ends
    const imageStyle = {
        transform: `scale(${scale})`,
        transformOrigin: `${transformOrigin.x}% ${transformOrigin.y}%`,
        transition: isPinching ? 'none' : 'transform 0.22s ease',
    };

    return createPortal(
        <div className="mobileBoardImage-overlay" onClick={onClose}>
            <div className="mobileBoardImage-window" onClick={(e) => e.stopPropagation()}>

                {/* ── Top-right action bar ── */}
                <div className="mobileBoardImage-actions">

                    {/* Speed toggle */}
                    <div className="mobileBoardImage-speedToggle" title="Slideshow speed">
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

                    {/* Play / Stop with progress ring */}
                    <button
                        className="mobileBoardImage-playBtn"
                        onClick={toggleSlideshow}
                        title={isPlaying ? 'Stop slideshow' : 'Play slideshow'}
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
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle className="mobileBoardImage-progressRing-track" cx="25" cy="25" r={RADIUS} />
                                <circle
                                    className="mobileBoardImage-progressRing-fill"
                                    cx="25" cy="25" r={RADIUS}
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={strokeDashoffset}
                                />
                            </svg>
                        )}
                    </button>

                    <button className="mobileBoardImage-topBtn" onClick={handleDownload} aria-label="Download">↓</button>
                    <button className="mobileBoardImage-topBtn close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* ── Counter (top-left) ── */}
                {hasCounter && (
                    <div className="mobileBoardImage-counter">
                        {currentIndex + 1} <span className="mobileBoardImage-counter-sep">/</span> {totalCount}
                    </div>
                )}

                {/* ── Keyboard / swipe hint ── */}
                <div className={`mobileBoardImage-hint ${showHint ? 'visible' : ''}`}>
                    <span>← → swipe</span>
                    <span className="mobileBoardImage-hint-dot">·</span>
                    <span>pinch zoom</span>
                    <span className="mobileBoardImage-hint-dot">·</span>
                    <span>Space play</span>
                </div>

                {/* ── Prev / Next arrows (hidden when zoomed) ── */}
                {!zoomed && (
                    <>
                        <button
                            className="mobileBoardImage-nav mobileBoardImage-prev"
                            onClick={() => { stopSlideshow(); onPrev?.(); }}
                            aria-label="Previous"
                        >
                            ‹
                        </button>
                        <button
                            className="mobileBoardImage-nav mobileBoardImage-next"
                            onClick={() => { stopSlideshow(); onNext?.(); }}
                            aria-label="Next"
                        >
                            ›
                        </button>
                    </>
                )}

                {/* ── Scroll / zoom container ── */}
                <div
                    ref={containerRef}
                    className={`mobileBoardImage-scroll ${zoomed ? 'zoomed' : ''} ${hasImages ? 'has-thumbs' : ''}`}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt="Board"
                        draggable={false}
                        onClick={handleImageClick}
                        className={`mobileBoardImage-image ${zoomed ? 'zoomed' : ''} ${isPlaying ? 'slideshow-active' : ''}`}
                        style={imageStyle}
                    />
                </div>

                {/* ── Thumbnail strip ── */}
                {hasImages && (
                    <div className="mobileBoardImage-thumbStrip" ref={thumbStripRef}>
                        {images.map((url, i) => (
                            <button
                                key={i}
                                className={`mobileBoardImage-thumb ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => { stopSlideshow(); onGoTo?.(i); }}
                                title={`Image ${i + 1}`}
                            >
                                <img src={url} alt={`Thumbnail ${i + 1}`} draggable={false} />
                                {i === currentIndex && <div className="mobileBoardImage-thumb-activeBar" />}
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