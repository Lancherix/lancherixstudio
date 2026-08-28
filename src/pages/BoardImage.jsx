import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import './Styles/BoardImage.css';

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

// ── SVG Icons ────────────────────────────────────────────────────────────────

const IconPlay = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
    </svg>
);

const IconStop = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
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
    const { t } = useTranslation();
    const containerRef = useRef(null);
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

    // ── Keyboard hint ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        setShowHint(true);
        hintTimerRef.current = setTimeout(() => setShowHint(false), 3000);
        return () => clearTimeout(hintTimerRef.current);
    }, [isOpen]);

    // ── Progress ring ─────────────────────────────────────────────────
    const animateProgress = useCallback(() => {
        if (!startTimeRef.current) startTimeRef.current = performance.now();
        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min(elapsed / interval, 1);
        setProgress(pct);
        if (pct < 1) {
            progressRef.current = requestAnimationFrame(animateProgress);
        }
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

    useEffect(() => {
        if (isPlaying) {
            if (progressRef.current) cancelAnimationFrame(progressRef.current);
            setProgress(0);
            startTimeRef.current = performance.now();
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    }, [imageUrl]);

    useEffect(() => {
        if (isPlaying) {
            stopSlideshow();
            setTimeout(() => startSlideshow(), 0);
        }
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

    // ── Keyboard shortcuts ────────────────────────────────────────────
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
    }, [isOpen, onClose, onNext, onPrev, isPlaying]);

    // ── Scroll active thumb into view ─────────────────────────────────
    useEffect(() => {
        if (!thumbStripRef.current) return;
        const active = thumbStripRef.current.querySelector('.bi-thumb.active');
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
        <div className="bi-overlay" onClick={onClose}>
            <div className="bi-window" onClick={(e) => e.stopPropagation()}>

                {/* ── Top chrome bar ── */}
                <div className="bi-topbar">

                    {/* LEFT — Counter */}
                    <div className="bi-topbar-left">
                        {hasCounter && (
                            <div className="bi-counter">
                                <span className="bi-counter-current">{currentIndex + 1}</span>
                                <span className="bi-counter-sep">/</span>
                                <span className="bi-counter-total">{totalCount}</span>
                            </div>
                        )}
                    </div>

                    {/* CENTER — Speed + Play (primary controls) */}
                    <div className="bi-topbar-center">
                        <div className="bi-controls-pill">
                            {/* Speed buttons */}
                            <div className="bi-speed-group">
                                {(['slow', 'medium', 'fast']).map((s) => (
                                    <button
                                        key={s}
                                        className={`bi-speed-btn ${speed === s ? 'active' : ''}`}
                                        onClick={() => setSpeed(s)}
                                        title={`${s === 'slow' ? '5s' : s === 'medium' ? '3s' : '1.5s'} ${t('perSlide')}`}
                                    >
                                        {s === 'slow' ? '1×' : s === 'medium' ? '2×' : '3×'}
                                    </button>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="bi-pill-divider" />

                            {/* Play / Stop with progress ring */}
                            <button
                                className="bi-play-btn"
                                onClick={toggleSlideshow}
                                title={isPlaying ? t('stopSlideshow') : t('playSlideshow')}
                            >
                                <span className="bi-play-icon">
                                    {isPlaying ? <IconStop /> : <IconPlay />}
                                </span>
                                {isPlaying && (
                                    <svg
                                        className="bi-progress-ring"
                                        viewBox="0 0 50 50"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle className="bi-ring-track" cx="25" cy="25" r={RADIUS} />
                                        <circle
                                            className="bi-ring-fill"
                                            cx="25" cy="25" r={RADIUS}
                                            strokeDasharray={CIRCUMFERENCE}
                                            strokeDashoffset={strokeDashoffset}
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT — Download + Close */}
                    <div className="bi-topbar-right">
                        <button
                            className="bi-icon-btn"
                            onClick={handleDownload}
                            title={t('downloadImage')}
                        >
                            <IconDownload />
                        </button>
                        <button
                            className="bi-icon-btn bi-icon-btn--close"
                            onClick={onClose}
                            title={t('closeEsc')}
                        >
                            <IconClose />
                        </button>
                    </div>

                </div>

                {/* ── Keyboard hint ── */}
                <div className={`bi-hint ${showHint ? 'visible' : ''}`}>
                    <span>{t('hintNavigate')}</span>
                    <span className="bi-hint-dot">·</span>
                    <span>{t('hintPlay')}</span>
                    <span className="bi-hint-dot">·</span>
                    <span>{t('hintClose')}</span>
                </div>

                {/* ── Navigation arrows ── */}
                <button
                    className="bi-nav bi-nav--prev"
                    onClick={() => { stopSlideshow(); onPrev?.(); }}
                    title={t('previousArrow')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <button
                    className="bi-nav bi-nav--next"
                    onClick={() => { stopSlideshow(); onNext?.(); }}
                    title={t('nextArrow')}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>

                {/* ── Image scroll / zoom container ── */}
                <div
                    ref={containerRef}
                    className={`bi-image-container ${zoomed ? 'zoomed' : ''} ${hasImages ? 'has-thumbs' : ''}`}
                >
                    <img
                        src={imageUrl}
                        alt={t('boardImageAlt')}
                        draggable={false}
                        onClick={handleImageClick}
                        className={`bi-image ${zoomed ? 'zoomed' : ''} ${isPlaying ? 'playing' : ''}`}
                    />
                </div>

                {/* ── Thumbnail strip ── */}
                {hasImages && (
                    <div className="bi-thumb-strip" ref={thumbStripRef}>
                        {images.map((url, i) => (
                            <button
                                key={i}
                                className={`bi-thumb ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => { stopSlideshow(); onGoTo?.(i); }}
                                title={t('imageNumber', { number: i + 1 })}
                            >
                                <img src={url} alt={t('imageNumber', { number: i + 1 })} draggable={false} />
                                {i === currentIndex && <div className="bi-thumb-bar" />}
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