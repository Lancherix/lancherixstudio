cat > /mnt/user-data/outputs/BoardImage.jsx << 'ENDOFFILE'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

// Circumference of the SVG ring circle (r=21)
const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SPEED_OPTIONS = [
    { label: 'Slow',   ms: 5000 },
    { label: 'Medium', ms: 3000 },
    { label: 'Fast',   ms: 1500 },
];

const getOriginalDownloadUrl = (url) =>
    url.replace('/upload/', '/upload/fl_attachment,q_100/');

const BoardImage = ({
    isOpen,
    imageUrl,
    onClose,
    onNext,
    onPrev,
    // New props for counter + thumbnails
    images = [],        // array of image URL strings
    currentIndex = 0,  // index of the currently shown image
    onGoTo,            // (index) => void
}) => {
    const containerRef   = useRef(null);
    const thumbStripRef  = useRef(null);
    const slideshowRef   = useRef(null);
    const progressRef    = useRef(null);
    const startTimeRef   = useRef(null);
    const intervalRef    = useRef(SPEED_OPTIONS[1].ms); // live interval value

    const [zoomed,       setZoomed]      = useState(false);
    const [isPlaying,    setIsPlaying]   = useState(false);
    const [progress,     setProgress]    = useState(0);       // 0–1
    const [speedIdx,     setSpeedIdx]    = useState(1);       // index into SPEED_OPTIONS
    const [showHint,     setShowHint]    = useState(false);
    const [hintVisible,  setHintVisible] = useState(false);
    const hintTimerRef   = useRef(null);

    // ── Touch / swipe ──────────────────────────────────────
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);

    // ── Pinch-to-zoom ──────────────────────────────────────
    const lastPinchDist  = useRef(null);
    const [pinchScale,   setPinchScale]  = useState(1);
    const pinchScaleRef  = useRef(1);

    const currentInterval = () => SPEED_OPTIONS[speedIdx].ms;

    // ── Progress animation ─────────────────────────────────
    const animateProgress = useCallback(() => {
        if (!startTimeRef.current) startTimeRef.current = performance.now();
        const elapsed = performance.now() - startTimeRef.current;
        const pct = Math.min(elapsed / intervalRef.current, 1);
        setProgress(pct);
        if (pct < 1) {
            progressRef.current = requestAnimationFrame(animateProgress);
        }
    }, []);

    const resetProgress = useCallback(() => {
        if (progressRef.current) cancelAnimationFrame(progressRef.current);
        setProgress(0);
        startTimeRef.current = performance.now();
        progressRef.current  = requestAnimationFrame(animateProgress);
    }, [animateProgress]);

    const advanceSlide = useCallback(() => {
        onNext?.();
        resetProgress();
    }, [onNext, resetProgress]);

    const startSlideshow = useCallback((speedMs) => {
        const ms = speedMs ?? currentInterval();
        intervalRef.current = ms;
        setIsPlaying(true);
        setZoomed(false);
        setPinchScale(1);
        pinchScaleRef.current = 1;
        setProgress(0);
        startTimeRef.current = performance.now();
        progressRef.current  = requestAnimationFrame(animateProgress);
        if (slideshowRef.current) clearInterval(slideshowRef.current);
        slideshowRef.current = setInterval(advanceSlide, ms);
    }, [animateProgress, advanceSlide, speedIdx]);

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

    const handleSpeedChange = (idx) => {
        setSpeedIdx(idx);
        if (isPlaying) {
            // Restart with new speed immediately
            if (slideshowRef.current) clearInterval(slideshowRef.current);
            const ms = SPEED_OPTIONS[idx].ms;
            intervalRef.current = ms;
            slideshowRef.current = setInterval(advanceSlide, ms);
            resetProgress();
        }
    };

    // ── Hint on first open ─────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setShowHint(true);
            setHintVisible(true);
            clearTimeout(hintTimerRef.current);
            hintTimerRef.current = setTimeout(() => {
                setHintVisible(false);
                setTimeout(() => setShowHint(false), 400);
            }, 3000);
        }
        return () => clearTimeout(hintTimerRef.current);
    }, [isOpen]);

    // ── Reset progress when image changes while playing ────
    useEffect(() => {
        if (isPlaying) resetProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageUrl]);

    // ── Scroll active thumbnail into view ──────────────────
    useEffect(() => {
        if (!thumbStripRef.current || images.length === 0) return;
        const active = thumbStripRef.current.querySelector('.boardImage-thumb.active');
        if (active) {
            active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [currentIndex, images]);

    useEffect(() => { if (!isOpen) stopSlideshow(); }, [isOpen, stopSlideshow]);

    useEffect(() => {
        return () => {
            if (slideshowRef.current) clearInterval(slideshowRef.current);
            if (progressRef.current)  cancelAnimationFrame(progressRef.current);
        };
    }, []);

    // ── Keyboard ───────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape')      onClose();
            if (e.key === 'ArrowRight')  { stopSlideshow(); onNext?.(); }
            if (e.key === 'ArrowLeft')   { stopSlideshow(); onPrev?.(); }
            if (e.key === ' ')           { e.preventDefault(); toggleSlideshow(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, onClose, onNext, onPrev, isPlaying]);

    // ── Download ───────────────────────────────────────────
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

    // ── Click-to-zoom ──────────────────────────────────────
    const handleImageClick = (e) => {
        if (isPlaying || pinchScale !== 1) return;
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top)  / rect.height) * 100;
        setZoomed(!zoomed);
        if (!zoomed) {
            setTimeout(() => {
                containerRef.current?.scrollTo({
                    left: (containerRef.current.scrollWidth  - containerRef.current.clientWidth)  * (x / 100),
                    top:  (containerRef.current.scrollHeight - containerRef.current.clientHeight) * (y / 100),
                    behavior: 'smooth'
                });
            }, 10);
        }
    };

    // ── Touch: swipe navigation + pinch zoom ───────────────
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            touchStartX.current = e.touches[0].clientX;
            touchStartY.current = e.touches[0].clientY;
            lastPinchDist.current = null;
        } else if (e.touches.length === 2) {
            touchStartX.current = null;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchDist.current = Math.hypot(dx, dy);
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && lastPinchDist.current !== null) {
            e.preventDefault();
            const dx   = e.touches[0].clientX - e.touches[1].clientX;
            const dy   = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const delta = dist / lastPinchDist.current;
            const next  = Math.min(Math.max(pinchScaleRef.current * delta, 1), 4);
            pinchScaleRef.current = next;
            setPinchScale(next);
            lastPinchDist.current = dist;
            if (next > 1) setZoomed(false);
        }
    };

    const handleTouchEnd = (e) => {
        if (e.changedTouches.length === 1 && touchStartX.current !== null) {
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                if (dx < 0) { stopSlideshow(); onNext?.(); }
                else        { stopSlideshow(); onPrev?.(); }
            }
        }
        // Double-tap to reset pinch
        if (e.touches.length === 0 && pinchScaleRef.current !== 1) {
            // allow single-finger end without resetting
        }
        lastPinchDist.current = null;
    };

    const handleDoubleTap = (() => {
        let last = 0;
        return () => {
            const now = Date.now();
            if (now - last < 300) {
                setPinchScale(1);
                pinchScaleRef.current = 1;
                setZoomed(false);
            }
            last = now;
        };
    })();

    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    const hasMultiple = images.length > 1;
    const total = images.length || 1;

    if (!isOpen) return null;

    return createPortal(
        <div className="boardImage-overlay" onClick={onClose}>
            <div
                className="boardImage-window"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Keyboard hint ── */}
                {showHint && (
                    <div className={`boardImage-hint ${hintVisible ? 'visible' : ''}`}>
                        <span>← → navigate</span>
                        <span className="boardImage-hint-divider">·</span>
                        <span>Space play/pause</span>
                        <span className="boardImage-hint-divider">·</span>
                        <span>Esc close</span>
                    </div>
                )}

                {/* ── Top-left: counter ── */}
                {hasMultiple && (
                    <div className="boardImage-counter">
                        {currentIndex + 1} / {total}
                    </div>
                )}

                {/* ── Top-right: actions ── */}
                <div className="boardImage-actions">

                    {/* Speed selector — only visible when playing */}
                    {isPlaying && (
                        <div className="boardImage-speedGroup">
                            {SPEED_OPTIONS.map((opt, i) => (
                                <button
                                    key={opt.label}
                                    className={`boardImage-speedBtn ${i === speedIdx ? 'active' : ''}`}
                                    onClick={() => handleSpeedChange(i)}
                                    title={`${opt.label} (${opt.ms / 1000}s)`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Play / Stop with ring */}
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
                            <svg className="boardImage-progressRing" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
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

                {/* ── Prev / Next ── */}
                {hasMultiple && (
                    <button className="boardImage-nav boardImage-prev" onClick={() => { stopSlideshow(); onPrev?.(); }}>‹</button>
                )}
                {hasMultiple && (
                    <button className="boardImage-nav boardImage-next" onClick={() => { stopSlideshow(); onNext?.(); }}>›</button>
                )}

                {/* ── Image ── */}
                <div
                    ref={containerRef}
                    className={`boardImage-scrollContainer ${zoomed ? 'zoomed' : ''}`}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <img
                        src={imageUrl}
                        alt="Board"
                        draggable={false}
                        onClick={(e) => { handleDoubleTap(); handleImageClick(e); }}
                        className={`boardImage-image ${zoomed ? 'zoomed' : ''} ${isPlaying ? 'slideshow-active' : ''}`}
                        style={pinchScale !== 1 ? { transform: `scale(${pinchScale})`, transformOrigin: 'center center', maxWidth: 'none', maxHeight: 'none' } : undefined}
                    />
                </div>

                {/* ── Thumbnail strip ── */}
                {hasMultiple && (
                    <div className="boardImage-thumbStrip" ref={thumbStripRef} onClick={(e) => e.stopPropagation()}>
                        {images.map((url, i) => (
                            <button
                                key={i}
                                className={`boardImage-thumb ${i === currentIndex ? 'active' : ''}`}
                                onClick={() => { stopSlideshow(); onGoTo?.(i); }}
                                title={`Image ${i + 1}`}
                            >
                                <img src={url} alt={`Thumbnail ${i + 1}`} draggable={false}/>
                                {i === currentIndex && isPlaying && (
                                    <div className="boardImage-thumb-ring">
                                        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                            <circle className="boardImage-thumb-ring-track" cx="20" cy="20" r="17"/>
                                            <circle
                                                className="boardImage-thumb-ring-fill"
                                                cx="20" cy="20" r="17"
                                                strokeDasharray={2 * Math.PI * 17}
                                                strokeDashoffset={2 * Math.PI * 17 * (1 - progress)}
                                            />
                                        </svg>
                                    </div>
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

export default BoardImage;