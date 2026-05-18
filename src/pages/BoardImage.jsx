import React, { useEffect, useState } from 'react';
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
    const [zoomed, setZoomed] = useState(false);

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

                {/* Top Right Actions */}
                <div className="boardImage-actions">

                    <button
                        className="boardImage-actionBtn"
                        onClick={handleDownload}
                        aria-label="Download image"
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

                <img
                    src={imageUrl}
                    alt="Board"
                    className={`boardImage-image ${zoomed ? 'zoomed' : ''}`}
                    draggable={false}
                    onClick={() => setZoomed(!zoomed)}
                />
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default BoardImage;