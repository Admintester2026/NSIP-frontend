// FRONTEND/src/components/mantenimiento/ImageGallery.jsx
import { useState, useEffect } from 'react';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images, title = 'Galería' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  if (!images || images.length === 0) {
    return <p className={styles.emptyMessage}>No hay imágenes disponibles</p>;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openModal = (index) => {
    setModalIndex(index);
    setShowModal(true);
  };

  const handleModalPrev = () => {
    setModalIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleModalNext = () => {
    setModalIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const isVideo = (url) => {
    return url?.match(/\.(mp4|webm|mov)$/i);
  };

  const isPDF = (url) => {
    return url?.match(/\.pdf$/i);
  };

  return (
    <>
      <div className={styles.galleryContainer}>
        <div className={styles.galleryHeader}>
          <span className={styles.galleryTitle}>{title}</span>
          <span className={styles.galleryCount}>{images.length} archivo(s)</span>
        </div>

        <div className={styles.carouselContainer}>
          <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev}>
            ‹
          </button>

          <div className={styles.mainImageContainer} onClick={() => openModal(currentIndex)}>
            {isVideo(images[currentIndex]?.url) ? (
              <video src={images[currentIndex].url} className={styles.mainVideo} controls />
            ) : isPDF(images[currentIndex]?.url) ? (
              <div className={styles.pdfPreview}>
                <span>📄</span>
                <span>{images[currentIndex].filename || 'PDF'}</span>
                <button className={styles.viewPdfBtn} onClick={(e) => { e.stopPropagation(); window.open(images[currentIndex].url, '_blank'); }}>
                  Ver PDF
                </button>
              </div>
            ) : (
              <img src={images[currentIndex].url} alt={`Imagen ${currentIndex + 1}`} className={styles.mainImage} />
            )}
          </div>

          <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext}>
            ›
          </button>
        </div>

        <div className={styles.thumbnailContainer}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`${styles.thumbnail} ${idx === currentIndex ? styles.activeThumbnail : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              {isVideo(img.url) ? (
                <div className={styles.videoThumbnail}>
                  <span>🎬</span>
                </div>
              ) : isPDF(img.url) ? (
                <div className={styles.pdfThumbnail}>
                  <span>📄</span>
                </div>
              ) : (
                <img src={img.url} alt={`Miniatura ${idx + 1}`} className={styles.thumbnailImage} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal ampliado */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>

            <div className={styles.modalCarousel}>
              <button className={styles.modalNavPrev} onClick={handleModalPrev}>‹</button>
              
              <div className={styles.modalImageContainer}>
                {isVideo(images[modalIndex]?.url) ? (
                  <video src={images[modalIndex].url} className={styles.modalVideo} controls autoPlay />
                ) : isPDF(images[modalIndex]?.url) ? (
                  <iframe src={images[modalIndex].url} className={styles.modalPdf} title="PDF" />
                ) : (
                  <img src={images[modalIndex].url} alt={`Imagen ${modalIndex + 1}`} className={styles.modalImage} />
                )}
              </div>
              
              <button className={styles.modalNavNext} onClick={handleModalNext}>›</button>
            </div>

            <div className={styles.modalThumbnails}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`${styles.modalThumbnail} ${idx === modalIndex ? styles.activeModalThumbnail : ''}`}
                  onClick={() => setModalIndex(idx)}
                >
                  {isVideo(img.url) ? (
                    <div className={styles.videoThumbnail}>🎬</div>
                  ) : isPDF(img.url) ? (
                    <div className={styles.pdfThumbnail}>📄</div>
                  ) : (
                    <img src={img.url} alt="" className={styles.modalThumbnailImage} />
                  )}
                </div>
              ))}
            </div>

            <div className={styles.modalInfo}>
              <span>{modalIndex + 1} de {images.length}</span>
              {images[modalIndex]?.filename && (
                <span className={styles.modalFilename}>{images[modalIndex].filename}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}