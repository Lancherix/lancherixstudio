import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

const BoardImage = ({ isOpen, imageUrl, onClose }) => {
    const [scale, setScale] = useState(1);

    if (!isOpen) return null;

    const zoomIn = () => {
        setScale((prev) => Math.min(prev + 0.25, 5));
    };

    const zoomOut = () => {
        setScale((prev) => Math.max(prev - 0.25, 1));
    };

    const resetZoom = () => {
        setScale(1);
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

                <div className="boardImage-toolbar">
                    <button onClick={zoomOut}>−</button>

                    <span>
                        {Math.round(scale * 100)}%
                    </span>

                    <button onClick={zoomIn}>+</button>

                    <button onClick={resetZoom}>
                        Reset
                    </button>
                </div>

                <div
                    className="boardImage-container"
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
                        onDoubleClick={resetZoom}
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