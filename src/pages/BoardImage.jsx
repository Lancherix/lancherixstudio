import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

const BoardImage = ({
    isOpen,
    imageUrl,
    onClose,
    onNext,
    onPrev,
    onDownload,
}) => {

    const [scale, setScale] = useState(1);

    useEffect(() => {
        setScale(1);
    }, [imageUrl]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'ArrowRight') {
                onNext?.();
            }

            if (e.key === 'ArrowLeft') {
                onPrev?.();
            }

            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onNext, onPrev, onClose]);

    if (!isOpen) return null;

    const zoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 5));
    };

    const zoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 1));
    };

    const handleWheel = (e) => {
        e.preventDefault();

        if (e.deltaY < 0) {
            zoomIn();
        } else {
            zoomOut();
        }
    };

    const handleImageClick = () => {
        if (scale === 1) {
            setScale(2);
        } else {
            setScale(1);
        }
    };

    return createPortal(
        <div
            className="boardImage-overlay"
            onClick={onClose}
        >

            <div
                className="boardImage-window"
                onClick={(e) => e.stopPropagation()}
            >

                <button
                    className="boardImage-close"
                    onClick={onClose}
                >
                    ✕
                </button>

                {/* LEFT */}
                <button
                    className="boardImage-nav boardImage-prev"
                    onClick={onPrev}
                >
                    ←
                </button>

                {/* RIGHT */}
                <button
                    className="boardImage-nav boardImage-next"
                    onClick={onNext}
                >
                    →
                </button>

                {/* DOWNLOAD */}
                <button
                    className="boardImage-download"
                    onClick={() => onDownload?.(imageUrl)}
                >
                    Download
                </button>

                <div
                    className="boardImage-imageContainer"
                    onWheel={handleWheel}
                    style={{
                        cursor: scale > 1 ? 'zoom-out' : 'zoom-in',
                    }}
                >
                    <img
                        src={imageUrl}
                        alt="Board"
                        className="boardImage-image"
                        draggable={false}
                        onClick={handleImageClick}
                        style={{
                            transform: `scale(${scale})`,
                        }}
                    />
                </div>

            </div>

        </div>,
        document.getElementById('modal-root')
    );
};

export default BoardImage;