import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './BoardImageMobile.css';

const SPEED_PRESETS = { slow: 5000, medium: 3000, fast: 1500 };
const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

const getOriginalDownloadUrl = (url) =>
    url.replace('/upload/', '/upload/fl_attachment,q_100/');

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IconPlay = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
);

const IconStop = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
    </svg>
);

const IconDownload = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path fillRule="evenodd" d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Zm-6.75-10.5a.75.75 0 0 0-1.5 0v4.19l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V10.5Z" clipRule="evenodd" />
    </svg>
);

const IconClose = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

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
    const { t } = useTranslation();
    const containerRef = useRef(null);
    const progressRef = useRef(null);
    const startTimeRef = useRef(null);
    const thumbStripRef = useRef(null);
    const hintTimerRef = useRef(null);
    const imageRef = useRef(null);

    // ── Zoom / pan state ──────────────────────────────────────────────
    const scaleRef = useRef(1);
    const panRef = useRef({ x: 0, y: 0 });
    const [zoomed, setZoomed] = useState(false);

    // Pinch refs
    const isPinching = useRef(false);
    const pinchStartDist = useRef(null);
    const pinchStartScale = useRef(1);
    const pinchMidStart = useRef({ x: 0, y: 0 });
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

    // ── Apply transform ───────────────────────────────────────────────
    const applyTransform = useCallback((scale, x, y, animated = false) => {
        scaleRef.current = scale;
        panRef.current = { x, y };
        setZoomed(scale > 1.05);
        if (imageRef.current) {
            imageRef.current.style.transition = animated ? 'transform 0.22s ease' : 'none';
            imageRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        }
    }, []);

    // ── Clamp pan ─────────────────────────────────────────────────────
    const clampPan = useCallback((scale, x, y) => {
        const container = containerRef.current;
        const image = imageRef.current;
        if (!container || !image) return { x, y };
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const rw = image.clientWidth * scale;
        const rh = image.clientHeight * scale;
        const maxX = Math.max(0, (rw - cw) / 2);
        const maxY = Math.max(0, (rh - ch) / 2);
        return {
            x: clamp(x, -maxX, maxX),
            y: clamp(y, -maxY, maxY),
        };
    }, []);

    // ── Reset zoom ────────────────────────────────────────────────────
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
        const timer = setTimeout(() => { onNext?.(); }, interval);
        return () => clearTimeout(timer);
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
        const a = thumbStripRef.current.querySelector('.mbi-thumb.active');
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
            swipeLocked.current = null;
            pinchStartDist.current = getTouchDist(e.touches[0], e.touches[1]);
            pinchStartScale.current = scaleRef.current;
            pinchMidStart.current = getTouchMid(e.touches[0], e.touches[1]);
            panAtPinchStart.current = { ...panRef.current };
        } else if (e.touches.length === 1) {
            if (isPinching.current) return;
            const touch = e.touches[0];
            if (scaleRef.current > 1.05) {
                isPanning.current = true;
                panTouchStart.current = { x: touch.clientX, y: touch.clientY };
                panAtTouchStart.current = { ...panRef.current };
            } else {
                swipeStartX.current = touch.clientX;
                swipeStartY.current = touch.clientY;
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
            const newMid = getTouchMid(e.touches[0], e.touches[1]);
            const dx = newMid.x - pinchMidStart.current.x;
            const dy = newMid.y - pinchMidStart.current.y;
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
                const touch = e.touches[0];
                const dx = touch.clientX - panTouchStart.current.x;
                const dy = touch.clientY - panTouchStart.current.y;
                const { x, y } = clampPan(scaleRef.current, panAtTouchStart.current.x + dx, panAtTouchStart.current.y + dy);
                applyTransform(scaleRef.current, x, y, false);
                return;
            }
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
        if (isPinching.current) {
            if (e.touches.length < 2) {
                isPinching.current = false;
                pinchStartDist.current = null;
                swipeStartX.current = null;
                swipeLocked.current = null;
                if (scaleRef.current < 1.15) {
                    applyTransform(1, 0, 0, true);
                } else {
                    const { x, y } = clampPan(scaleRef.current, panRef.current.x, panRef.current.y);
                    applyTransform(scaleRef.current, x, y, true);
                }
            }
            return;
        }
        if (isPanning.current) { isPanning.current = false; return; }
        if (swipeStartX.current !== null && swipeLocked.current === 'h' && scaleRef.current <= 1.05) {
            const dx = e.changedTouches[0].clientX - swipeStartX.current;
            if (Math.abs(dx) > 50) { stopSlideshow(); if (dx < 0) onNext?.(); else onPrev?.(); }
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
        if (scaleRef.current > 1.05) applyTransform(1, 0, 0, true);
        else applyTransform(2.5, 0, 0, true);
    }, [applyTransform, isPlaying]);

    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    if (!isOpen) return null;

    const hasImages = images.length > 0;
    const hasCounter = totalCount > 0;

    return createPortal(
        <div className="mbi-overlay" onClick={onClose}>
            <div className="mbi-window" onClick={(e) => e.stopPropagation()}>

                {/* ══════════════════════════════════════════
                    TOP BAR — three-zone grid
                    [counter]  [speed · | · play]  [↓ · ✕]
                    ══════════════════════════════════════════ */}
                <div className="mbi-topbar">

                    {/* LEFT — counter */}
                    <div className="mbi-topbar-left">
                        {hasCounter && (
                            <div className="mbi-counter">
                                <span className="mbi-counter-current">{currentIndex + 1}</span>
                                <span className="mbi-counter-sep">/</span>
                                <span className="mbi-counter-total">{totalCount}</span>
                            </div>
                        )}
                    </div>

                    {/* CENTER — speed + play pill */}
                    <div className="mbi-topbar-center">
                        <div className="mbi-controls-pill">

                            {/* Speed */}
                            <div className="mbi-speed-group">
                                {(['slow', 'medium', 'fast']).map((s) => (
                                    <button
                                        key={s}
                                        className={`mbi-speed-btn ${speed === s ? 'active' : ''}`}
                                        onClick={() => setSpeed(s)}
                                    >
                                        {s === 'slow' ? '1×' : s === 'medium' ? '2×' : '3×'}
                                    </button>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="mbi-pill-divider" />

                            {/* Play / Stop with progress ring */}
                            <button
                                className="mbi-play-btn"
                                onClick={toggleSlideshow}
                                aria-label={isPlaying ? t('stopSlideshowAria') : t('playSlideshowAria')}
                            >
                                <span className="mbi-play-icon">
                                    {isPlaying ? <IconStop /> : <IconPlay />}
                                </span>
                                {isPlaying && (
                                    <svg className="mbi-progress-ring" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                                        <circle className="mbi-ring-track" cx="25" cy="25" r={RADIUS} />
                                        <circle
                                            className="mbi-ring-fill"
                                            cx="25" cy="25" r={RADIUS}
                                            strokeDasharray={CIRCUMFERENCE}
                                            strokeDashoffset={strokeDashoffset}
                                        />
                                    </svg>
                                )}
                            </button>

                        </div>
                    </div>

                    {/* RIGHT — download + close */}
                    <div className="mbi-topbar-right">
                        <button className="mbi-icon-btn" onClick={handleDownload} aria-label={t('downloadImage')}>
                            <IconDownload />
                        </button>
                        <button className="mbi-icon-btn mbi-icon-btn--close" onClick={onClose} aria-label={t('close')}>
                            <IconClose />
                        </button>
                    </div>

                </div>

                {/* ── Hint ── */}
                <div className={`mbi-hint ${showHint ? 'visible' : ''}`}>
                    <span>{t('hintSwipe')}</span>
                    <span className="mbi-hint-dot">·</span>
                    <span>{t('hintPinchZoom')}</span>
                    <span className="mbi-hint-dot">·</span>
                    <span>{t('hintDragPan')}</span>
                </div>

                {/* ── Prev / Next (hidden when zoomed) ── */}
                {!zoomed && (
                    <>
                        <button
                            className="mbi-nav mbi-nav--prev"
                            onClick={() => { stopSlideshow(); onPrev?.(); }}
                            aria-label={t('previousAria')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        </button>
                        <button
                            className="mbi-nav mbi-nav--next"
                            onClick={() => { stopSlideshow(); onNext?.(); }}
                            aria-label={t('nextAria')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* ── Image container ── */}
                <div
                    ref={containerRef}
                    className={`mbi-image-container ${zoomed ? 'zoomed' : ''} ${hasImages ? 'has-thumbs' : ''}`}
                >
                    <img
                        ref={imageRef}
                        src={imageUrl}
                        alt={t('boardImageAlt')}
                        draggable={false}
                        onClick={handleImageClick}
                        className={`mbi-image ${zoomed ? 'zoomed' : ''} ${isPlaying ? 'playing' : ''}`}
                    />
                </div>

                {/* ── Thumbnail strip ── */}
                {hasImages && (
                    <div className="mbi-thumb-strip" ref={thumbStripRef}>
                        {images.map((url, i) => (
                            <button
                                key={i}
                                className={`mbi-thumb ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => { stopSlideshow(); onGoTo?.(i); }}
                                aria-label={t('imageNumber', { number: i + 1 })}
                            >
                                <img src={url} alt={t('thumbnailNumber', { number: i + 1 })} draggable={false} />
                                {i === currentIndex && <div className="mbi-thumb-bar" />}
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