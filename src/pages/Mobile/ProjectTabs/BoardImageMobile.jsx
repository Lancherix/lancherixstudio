import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './BoardImageMobile.css';

const SPEED_PRESETS = { slow: 5000, medium: 3000, fast: 1500 };
const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

const getOriginalDownloadUrl = (url) =>
    url.replace('/upload/', '/upload/fl_attachment,q_100/');

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

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

    // ── Zoom / pan state (all in refs to avoid re-render lag during gesture) ──
    const scaleRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });        // current translate offset px
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [zoomed, setZoomed] = useState(false);

    // Pinch refs
    const isPinching = useRef(false);
    const pinchStartDist = useRef(null);
    const pinchStartScale = useRef(1);
    const pinchMidStart = useRef({ x: 0, y: 0 }); // midpoint at pinch start (container px)
    const panAtPinchStart = useRef({ x: 0, y: 0 });

    // Single-finger pan refs
    const isPanning = useRef(false);
    const panTouchStart = useRef({ x: 0, y: 0 });
    const panAtTouchStart = useRef({ x: 0, y: 0 });

    // Swipe refs (only when scale === 1)
    const swipeStartX = useRef(null);
    const swipeStartY = useRef(null);
    const swipeLocked = useRef(null);

    // Slideshow
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [speed, setSpeed] = useState('medium');
    const [showHint, setShowHint] = useState(true);
    const interval = SPEED_PRESETS[speed];

    // ── Apply transform to image ──────────────────────────────────────
    const applyTransform = useCallback((scale, x, y, animated = false) => {
        scaleRef.current = scale;
        panRef.current = { x, y };
        setTransform({ scale, x, y });
        setZoomed(scale > 1.05);
        if (imageRef.current) {
            imageRef.current.style.transition = animated ? 'transform 0.22s ease' : 'none';
            imageRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
    }, []);

    // ── Clamp pan so image never leaves viewport ──────────────────────
    const clampPan = useCallback((scale, x, y) => {
        const container = containerRef.current;
        const image = imageRef.current;
        if (!container || !image) return { x, y };
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const iw = image.naturalWidth || image.clientWidth;
        const ih = image.naturalHeight || image.clientHeight;
        // Rendered size of image at scale=1 (object-fit: contain inside container)
        const ratio = Math.min(cw / iw, ch / ih);
        const rw = iw * ratio * scale;
        const rh = ih * ratio * scale;
        const maxX = Math.max(0, (rw - cw) / 2);
        const maxY = Math.max(0, (rh - ch) / 2);
        return {
            x: clamp(x, -maxX, maxX),
            y: clamp(y, -maxY, maxY),
        };
    }, []);

    // ── Reset zoom & pan ──────────────────────────────────────────────
    const resetZoom = useCallback(() => {
        applyTransform(1, 0, 0, true);
        isPinching.current = false;
        isPanning.current = false;
        pinchStartDist.current = null;
        swipeStartX.current = null;
        swipeLocked.current = null;
    }, [applyTransform]);

    // ── Hint ──────────────────────────────────────────────────────────
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

    useEffect(() => {
        if (!isOpen) { resetZoom(); stopSlideshow(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => { resetZoom(); }, [currentIndex, resetZoom]);

    // ── Slideshow ─────────────────────────────────────────────────────
    const animateProgress = useCallback(() => {
        if (!startTimeRef.current) startTimeRef.current = performance.now();
        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min(elapsed / interval, 1);
        setProgress(pct);
        if (pct < 1) progressRef.current = requestAnimationFrame(animateProgress);
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

    const toggleSlideshow = () => { if (isPlaying) stopSlideshow(); else startSlideshow(); };

    useEffect(() => {
        if (isPlaying) {
            if (progressRef.current) cancelAnimationFrame(progressRef.current);
            setProgress(0);
            startTimeRef.current = performance.now();
            progressRef.current = requestAnimationFrame(animateProgress);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    useEffect(() => {
        if (isPlaying) { stopSlideshow(); setTimeout(() => startSlideshow(), 0); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [speed]);

    useEffect(() => {
        if (!isPlaying) return;
        const t = setTimeout(() => { onNext?.(); }, interval);
        return () => clearTimeout(t);
    }, [isPlaying, currentIndex, interval, onNext]);

    useEffect(() => { if (!isOpen) stopSlideshow(); }, [isOpen, stopSlideshow]);
    useEffect(() => () => { if (progressRef.current) cancelAnimationFrame(progressRef.current); }, []);

    // ── Keyboard ──────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') { if (zoomed) { resetZoom(); return; } onClose?.(); }
            if (e.key === 'ArrowRight') { stopSlideshow(); onNext?.(); }
            if (e.key === 'ArrowLeft') { stopSlideshow(); onPrev?.(); }
            if (e.key === ' ') { e.preventDefault(); toggleSlideshow(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, onClose, onNext, onPrev, isPlaying, zoomed]);

    // ── Thumb strip scroll ────────────────────────────────────────────
    useEffect(() => {
        if (!thumbStripRef.current) return;
        const a = thumbStripRef.current.querySelector('.mobileBoardImage-thumb.active');
        if (a) a.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }, [currentIndex]);

    // ── Download ──────────────────────────────────────────────────────
    const handleDownload = async () => {
        try {
            const url = getOriginalDownloadUrl(imageUrl);
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = url.split('/').pop();
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) { console.error('Download failed:', err); }
    };

    // ── Touch helpers ─────────────────────────────────────────────────
    const getTouchDist = (t1, t2) => {
        const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchMid = (t1, t2) => ({
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
    });

    // ── Touch start ───────────────────────────────────────────────────
    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            isPinching.current = true;
            isPanning.current = false;
            swipeStartX.current = null;

            pinchStartDist.current = getTouchDist(e.touches[0], e.touches[1]);
            pinchStartScale.current = scaleRef.current;
            pinchMidStart.current = getTouchMid(e.touches[0], e.touches[1]);
            panAtPinchStart.current = { ...panRef.current };
        } else if (e.touches.length === 1) {
            if (isPinching.current) return; // finger lifted during pinch

            const t = e.touches[0];
            if (scaleRef.current > 1.05) {
                // Panning mode
                isPanning.current = true;
                panTouchStart.current = { x: t.clientX, y: t.clientY };
                panAtTouchStart.current = { ...panRef.current };
            } else {
                // Swipe navigation mode
                swipeStartX.current = t.clientX;
                swipeStartY.current = t.clientY;
                swipeLocked.current = null;
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Touch move ────────────────────────────────────────────────────
    const handleTouchMove = useCallback((e) => {
        if (e.touches.length === 2 && pinchStartDist.current !== null) {
            e.preventDefault();

            const newDist = getTouchDist(e.touches[0], e.touches[1]);
            const newScale = clamp(
                pinchStartScale.current * (newDist / pinchStartDist.current),
                MIN_SCALE, MAX_SCALE
            );

            // Pan to keep pinch midpoint fixed
            const newMid = getTouchMid(e.touches[0], e.touches[1]);
            const dx = newMid.x - pinchMidStart.current.x;
            const dy = newMid.y - pinchMidStart.current.y;

            // Offset due to scale change around the pinch midpoint
            const container = containerRef.current;
            const cx = container ? container.clientWidth / 2 : 0;
            const cy = container ? container.clientHeight / 2 : 0;
            const originX = pinchMidStart.current.x - cx;
            const originY = pinchMidStart.current.y - cy;
            const scaleDelta = newScale / pinchStartScale.current;
            const rawX = panAtPinchStart.current.x + dx + originX * (1 - scaleDelta);
            const rawY = panAtPinchStart.current.y + dy + originY * (1 - scaleDelta);

            const { x, y } = clampPan(newScale, rawX, rawY);
            applyTransform(newScale, x, y, false);
            return;
        }

        if (e.touches.length === 1) {
            if (isPanning.current) {
                e.preventDefault();
                const t = e.touches[0];
                const dx = t.clientX - panTouchStart.current.x;
                const dy = t.clientY - panTouchStart.current.y;
                const rawX = panAtTouchStart.current.x + dx;
                const rawY = panAtTouchStart.current.y + dy;
                const { x, y } = clampPan(scaleRef.current, rawX, rawY);
                applyTransform(scaleRef.current, x, y, false);
                return;
            }

            // Swipe axis lock
            if (swipeStartX.current !== null && scaleRef.current <= 1.05) {
                const dx = e.touches[0].clientX - swipeStartX.current;
                const dy = e.touches[0].clientY - swipeStartY.current;
                if (!swipeLocked.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                    swipeLocked.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
                }
                if (swipeLocked.current === 'h') e.preventDefault();
            }
        }
    }, [applyTransform, clampPan]);

    // ── Touch end ─────────────────────────────────────────────────────
    const handleTouchEnd = useCallback((e) => {
        if (e.touches.length < 2 && isPinching.current) {
            isPinching.current = false;
            pinchStartDist.current = null;

            // Snap back to 1 if barely zoomed
            if (scaleRef.current < 1.15) {
                applyTransform(1, 0, 0, true);
            } else {
                // Re-clamp pan with final scale
                const { x, y } = clampPan(scaleRef.current, panRef.current.x, panRef.current.y);
                applyTransform(scaleRef.current, x, y, true);
            }
            return;
        }

        if (isPanning.current) {
            isPanning.current = false;
            return;
        }

        // Swipe navigation
        if (swipeStartX.current !== null && swipeLocked.current === 'h' && scaleRef.current <= 1.05) {
            const dx = e.changedTouches[0].clientX - swipeStartX.current;
            if (Math.abs(dx) > 50) {
                stopSlideshow();
                if (dx < 0) onNext?.(); else onPrev?.();
            }
        }
        swipeStartX.current = null;
        swipeLocked.current = null;
    }, [applyTransform, clampPan, stopSlideshow, onNext, onPrev]);

    // ── Register touch listeners ──────────────────────────────────────
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
        if (isPinching.current || isPlaying) return;
        if (scaleRef.current > 1.05) {
            applyTransform(1, 0, 0, true);
        } else {
            applyTransform(2.5, 0, 0, true);
        }
    }, [applyTransform, isPlaying]);

    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    if (!isOpen) return null;

    const hasImages = images.length > 0;
    const hasCounter = totalCount > 0;

    return createPortal(
        <div className="mobileBoardImage-overlay" onClick={onClose}>
            <div className="mobileBoardImage-window" onClick={(e) => e.stopPropagation()}>

                {/* ── Top-right action bar ── */}
                <div className="mobileBoardImage-actions">
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

                    <button className="mobileBoardImage-playBtn" onClick={toggleSlideshow}
                        title={isPlaying ? 'Stop slideshow' : 'Play slideshow'}>
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
                            <svg className="mobileBoardImage-progressRing" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                                <circle className="mobileBoardImage-progressRing-track" cx="25" cy="25" r={RADIUS} />
                                <circle className="mobileBoardImage-progressRing-fill" cx="25" cy="25" r={RADIUS}
                                    strokeDasharray={CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} />
                            </svg>
                        )}
                    </button>

                    <button className="mobileBoardImage-topBtn" onClick={handleDownload} aria-label="Download">↓</button>
                    <button className="mobileBoardImage-topBtn close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* ── Counter ── */}
                {hasCounter && (
                    <div className="mobileBoardImage-counter">
                        {currentIndex + 1} <span className="mobileBoardImage-counter-sep">/</span> {totalCount}
                    </div>
                )}

                {/* ── Hint ── */}
                <div className={`mobileBoardImage-hint ${showHint ? 'visible' : ''}`}>
                    <span>← → swipe</span>
                    <span className="mobileBoardImage-hint-dot">·</span>
                    <span>pinch zoom</span>
                    <span className="mobileBoardImage-hint-dot">·</span>
                    <span>drag to pan</span>
                </div>

                {/* ── Prev / Next (hidden when zoomed) ── */}
                {!zoomed && (
                    <>
                        <button className="mobileBoardImage-nav mobileBoardImage-prev"
                            onClick={() => { stopSlideshow(); onPrev?.(); }} aria-label="Previous">‹</button>
                        <button className="mobileBoardImage-nav mobileBoardImage-next"
                            onClick={() => { stopSlideshow(); onNext?.(); }} aria-label="Next">›</button>
                    </>
                )}

                {/* ── Image container ── */}
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
                    />
                </div>

                {/* ── Thumbnail strip ── */}
                {hasImages && (
                    <div className="mobileBoardImage-thumbStrip" ref={thumbStripRef}>
                        {images.map((url, i) => (
                            <button key={i}
                                className={`mobileBoardImage-thumb ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => { stopSlideshow(); onGoTo?.(i); }}
                                title={`Image ${i + 1}`}>
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