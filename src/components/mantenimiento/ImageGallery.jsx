// FRONTEND/src/components/mantenimiento/ImageGallery.jsx
import { useState, useEffect } from 'react';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images, title = 'Galería' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

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
    setZoomLevel(1);
    setShowModal(true);
  };

  const handleModalPrev = () => {
    setModalIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setZoomLevel(1);
  };

  const handleModalNext = () => {
    setModalIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  const handleImageClick = (e) => {
    if (isZooming) {
      resetZoom();
      setIsZooming(false);
    } else {
      setIsZooming(true);
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

  // Extraer fecha del nombre del archivo si no viene en el objeto
  const getImageDate = (image) => {
    if (image.fecha) return formatDate(image.fecha);
    // Intentar extraer timestamp del nombre del archivo
    const match = image.filename?.match(/(\d{13})/);
    if (match) {
      const timestamp = parseInt(match[1]);
      if (!isNaN(timestamp)) {
        return formatDate(new Date(timestamp));
      }
    }
    return 'Fecha no disponible';
  };

  const handleImageError = (url, index) => {
    console.error(`❌ Error cargando imagen: ${url}`);
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (url, index) => {
    console.log(`✅ Imagen cargada correctamente: ${url}`);
    setImageErrors(prev => ({ ...prev, [index]: false }));
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
                onError={() => handleImageError(images[currentIndex].url, currentIndex)}
                onLoad={() => handleImageLoad(images[currentIndex].url, currentIndex)}
              />
            )}
            {imageErrors[currentIndex] && (
              <div className={styles.errorOverlay}>
                <span>⚠️ No se pudo cargar la imagen</span>
              </div>
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
                  onError={() => console.error(`Error en miniatura ${idx}`)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal ampliado CON ZOOM */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            
            {/* Botones de zoom */}
            <div className={styles.zoomControls}>
              <button className={styles.zoomButton} onClick={zoomOut} title="Alejar (-)">
                <span>−</span>
              </button>
              <button className={styles.zoomButton} onClick={resetZoom} title="Restablecer zoom">
                <span>{Math.round(zoomLevel * 100)}%</span>
              </button>
              <button className={styles.zoomButton} onClick={zoomIn} title="Acercar (+)">
                <span>+</span>
              </button>
            </div>

            <div className={styles.modalCarousel}>
              <button className={styles.modalNavPrev} onClick={handleModalPrev}>‹</button>
              
              <div className={styles.modalImageContainer}>
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
                  <div 
                    className={styles.zoomableImageContainer}
                    onClick={handleImageClick}
                    style={{ cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in' }}
                  >
                    <img 
                      src={images[modalIndex].url} 
                      alt={`Imagen ${modalIndex + 1}`} 
                      className={styles.modalImage}
                      style={{ 
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.2s ease'
                      }}
                      onError={(e) => console.error(`Error en modal: ${images[modalIndex].url}`)}
                    />
                  </div>
                )}
              </div>
              
              <button className={styles.modalNavNext} onClick={handleModalNext}>›</button>
            </div>

            {/* Fecha en el modal */}
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
                    setZoomLevel(1);
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
                      onError={() => console.error(`Error miniatura modal`)}
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