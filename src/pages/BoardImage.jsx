import React from 'react';
import { createPortal } from 'react-dom';
import './Styles/BoardImage.css';

const BoardImage = ({ isOpen, imageUrl, onClose }) => {
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

                <button
                    className="boardImage-close"
                    onClick={onClose}
                >
                    ✕
                </button>

                <img
                    src={imageUrl}
                    alt="Board"
                    className="boardImage-image"
                    draggable={false}
                />
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default BoardImage;