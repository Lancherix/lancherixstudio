import React, { useState } from 'react';
import './BoardImageMobile.css';
import BoardImageMobile from './BoardImageMobile';

const BoardImageMobile = ({ images = [] }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="boardGrid-root">
        <div className="boardGrid-columns">
          {/* Left column — even indices */}
          <div className="boardGrid-col">
            {images
              .filter((_, i) => i % 2 === 0)
              .map((img, colIdx) => {
                const globalIdx = colIdx * 2;
                return (
                  <BoardGridCard
                    key={globalIdx}
                    image={img}
                    index={globalIdx}
                    onClick={() => openLightbox(globalIdx)}
                  />
                );
              })}
          </div>

          {/* Right column — odd indices, shifted down for staggered feel */}
          <div className="boardGrid-col boardGrid-col--offset">
            {images
              .filter((_, i) => i % 2 !== 0)
              .map((img, colIdx) => {
                const globalIdx = colIdx * 2 + 1;
                return (
                  <BoardGridCard
                    key={globalIdx}
                    image={img}
                    index={globalIdx}
                    onClick={() => openLightbox(globalIdx)}
                  />
                );
              })}
          </div>
        </div>
      </div>

      <BoardImageMobile
        isOpen={lightboxOpen}
        imageUrl={images[currentIndex]}
        onClose={() => setLightboxOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </>
  );
};

const BoardGridCard = ({ image, index, onClick }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`boardGrid-card ${loaded ? 'boardGrid-card--loaded' : ''}`}
      onClick={onClick}
      style={{ '--i': index }}
    >
      <div className="boardGrid-card-inner">
        <img
          src={image}
          alt={`Board ${index + 1}`}
          className="boardGrid-img"
          draggable={false}
          onLoad={() => setLoaded(true)}
        />
        <div className="boardGrid-overlay" />
      </div>
    </div>
  );
};

export default BoardImageMobile;