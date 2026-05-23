// FRONTEND/src/components/mantenimiento/ImageGallery.jsx
import { useState, useRef } from 'react';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images, title = 'Galería' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);

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
    resetZoomAndPosition();
    setShowModal(true);
  };

  const handleModalPrev = () => {
    setModalIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetZoomAndPosition();
  };

  const handleModalNext = () => {
    setModalIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    resetZoomAndPosition();
  };

  const resetZoomAndPosition = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.3, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.3, 1);
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Limitar movimiento
      const maxX = (zoomLevel - 1) * 250;
      const maxY = (zoomLevel - 1) * 250;
      
      setPosition({
        x: Math.min(Math.max(newX, -maxX), maxX),
        y: Math.min(Math.max(newY, -maxY), maxY)
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (showModal) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  };

  const isVideo = (url) => {
    return url?.match(/\.(mp4|webm|mov)$/i);
  };

  const isPDF = (url) => {
    return url?.match(/\.pdf$/i);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageDate = (image) => {
    if (image.fecha) return formatDate(image.fecha);
    const match = image.filename?.match(/(\d{13})/);
    if (match) {
      const timestamp = parseInt(match[1]);
      if (!isNaN(timestamp)) {
        return formatDate(new Date(timestamp));
      }
    }
    return 'Fecha no disponible';
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
              <img 
                src={images[currentIndex].url} 
                alt={`Imagen ${currentIndex + 1}`} 
                className={styles.mainImage}
              />
            )}
            <div className={styles.imageDateBadge}>
              📅 {getImageDate(images[currentIndex])}
            </div>
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
                <img 
                  src={img.url} 
                  alt={`Miniatura ${idx + 1}`} 
                  className={styles.thumbnailImage}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal ampliado MEJORADO */}
      {showModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowModal(false)}
          onWheel={handleWheel}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            
            {/* Controles de zoom */}
            <div className={styles.zoomControls}>
              <button className={styles.zoomButton} onClick={zoomOut} title="Alejar (-) / Rueda mouse">
                <span>−</span>
              </button>
              <button className={styles.zoomButton} onClick={resetZoomAndPosition} title="Restablecer zoom">
                <span>{Math.round(zoomLevel * 100)}%</span>
              </button>
              <button className={styles.zoomButton} onClick={zoomIn} title="Acercar (+) / Rueda mouse">
                <span>+</span>
              </button>
            </div>

            <div className={styles.modalCarousel}>
              <button className={styles.modalNavPrev} onClick={handleModalPrev}>‹</button>
              
              <div 
                className={styles.modalImageContainer}
                ref={imageContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              >
                {isVideo(images[modalIndex]?.url) ? (
                  <video 
                    src={images[modalIndex].url} 
                    className={styles.modalVideo} 
                    controls 
                    autoPlay 
                  />
                ) : isPDF(images[modalIndex]?.url) ? (
                  <iframe src={images[modalIndex].url} className={styles.modalPdf} title="PDF" />
                ) : (
                  <div className={styles.zoomableWrapper}>
                    <img 
                      src={images[modalIndex].url} 
                      alt={`Imagen ${modalIndex + 1}`} 
                      className={styles.modalImage}
                      style={{ 
                        transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                        cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                      }}
                      draggable={false}
                    />
                  </div>
                )}
              </div>
              
              <button className={styles.modalNavNext} onClick={handleModalNext}>›</button>
            </div>

            {/* Información del modal */}
            <div className={styles.modalInfo}>
              <div className={styles.modalInfoLeft}>
                <span className={styles.modalDate}>
                  📅 {getImageDate(images[modalIndex])}
                </span>
              </div>
              <div className={styles.modalInfoCenter}>
                <span>{modalIndex + 1} de {images.length}</span>
              </div>
              <div className={styles.modalInfoRight}>
                {zoomLevel > 1 && (
                  <span className={styles.zoomHint}>🔍 Arrastra para mover | Rueda para zoom</span>
                )}
                {images[modalIndex]?.filename && (
                  <span className={styles.modalFilename} title={images[modalIndex].filename}>
                    📄 {images[modalIndex].filename.length > 30 
                      ? images[modalIndex].filename.substring(0, 27) + '...' 
                      : images[modalIndex].filename}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.modalThumbnails}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`${styles.modalThumbnail} ${idx === modalIndex ? styles.activeModalThumbnail : ''}`}
                  onClick={() => {
                    setModalIndex(idx);
                    resetZoomAndPosition();
                  }}
                >
                  {isVideo(img.url) ? (
                    <div className={styles.videoThumbnail}>🎬</div>
                  ) : isPDF(img.url) ? (
                    <div className={styles.pdfThumbnail}>📄</div>
                  ) : (
                    <img 
                      src={img.url} 
                      alt="" 
                      className={styles.modalThumbnailImage}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}