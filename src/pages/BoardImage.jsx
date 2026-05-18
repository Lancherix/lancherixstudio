import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

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

    const [zoomed, setZoomed] = useState(false);

    const [transformOrigin, setTransformOrigin] = useState('center center');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext?.();
            if (e.key === 'ArrowLeft') onPrev?.();
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, onNext, onPrev]);

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

                {/* Top Right */}
                <div className="boardImage-actions">

                    <button
                        className="boardImage-actionBtn"
                        onClick={handleDownload}
                    >
                        ↓
                    </button>

                    <button
                        className="boardImage-close"
                        onClick={onClose}
                    >
                        ✕
                    </button>

                </div>

                {/* Previous */}
                <button
                    className="boardImage-nav boardImage-prev"
                    onClick={onPrev}
                >
                    ‹
                </button>

                {/* Next */}
                <button
                    className="boardImage-nav boardImage-next"
                    onClick={onNext}
                >
                    ›
                </button>

                {/* Scroll Container */}
                <div className="boardImage-scrollContainer">
                    <img
                        src={imageUrl}
                        alt="Board"
                        draggable={false}
                        onClick={() => setZoomed(!zoomed)}
                        className={`boardImage-image ${zoomed ? 'zoomed' : ''}`}
                    />
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default BoardImage;