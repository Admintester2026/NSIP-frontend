// FRONTEND/src/components/mantenimiento/ImageGallery.jsx
import { useState, useEffect } from 'react';
import styles from './ImageGallery.module.css';

export default function ImageGallery({ images, title = 'Galería' }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  // LOG: Mostrar qué imágenes está recibiendo el componente
  console.log('🎨 ImageGallery recibió imágenes:', images);
  console.log('🎨 URLs de imágenes:', images.map(img => img.url));

  if (!images || images.length === 0) {
    console.log('⚠️ No hay imágenes para mostrar');
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

  const handleImageError = (url, index) => {
    console.error(`❌ Error cargando imagen: ${url}`);
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (url, index) => {
    console.log(`✅ Imagen cargada correctamente: ${url}`);
    setImageErrors(prev => ({ ...prev, [index]: false }));
  };

  // Verificar si la URL es accesible
  const checkUrl = (url) => {
    console.log(`🔍 Verificando URL: ${url}`);
    // La URL debería ser algo como: /uploads/mantenimiento/evidencias/evidencia-32-xxxxx.jfif
    // O completa: http://192.168.3.65:3000/uploads/mantenimiento/evidencias/evidencia-32-xxxxx.jfif
    if (!url.startsWith('http') && !url.startsWith('/')) {
      console.warn(`⚠️ URL no es absoluta ni relativa: ${url}`);
    }
    return url;
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
              <video 
                src={checkUrl(images[currentIndex].url)} 
                className={styles.mainVideo} 
                controls 
                onError={() => handleImageError(images[currentIndex].url, currentIndex)}
                onLoadedData={() => handleImageLoad(images[currentIndex].url, currentIndex)}
              />
            ) : isPDF(images[currentIndex]?.url) ? (
              <div className={styles.pdfPreview}>
                <span>📄</span>
                <span>{images[currentIndex].filename || 'PDF'}</span>
                <button 
                  className={styles.viewPdfBtn} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    console.log('📄 Abriendo PDF:', images[currentIndex].url);
                    window.open(images[currentIndex].url, '_blank'); 
                  }}
                >
                  Ver PDF
                </button>
              </div>
            ) : (
              <img 
                src={checkUrl(images[currentIndex].url)} 
                alt={`Imagen ${currentIndex + 1}`} 
                className={styles.mainImage}
                onError={(e) => {
                  console.error(`❌ Error en img principal: ${images[currentIndex].url}`);
                  console.error('   Evento:', e);
                  handleImageError(images[currentIndex].url, currentIndex);
                }}
                onLoad={() => {
                  console.log(`✅ Imagen principal cargada: ${images[currentIndex].url}`);
                  handleImageLoad(images[currentIndex].url, currentIndex);
                }}
              />
            )}
            {imageErrors[currentIndex] && (
              <div className={styles.errorOverlay}>
                <span>⚠️ No se pudo cargar la imagen</span>
                <small>{images[currentIndex]?.url}</small>
              </div>
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
                <img 
                  src={img.url} 
                  alt={`Miniatura ${idx + 1}`} 
                  className={styles.thumbnailImage}
                  onError={(e) => {
                    console.error(`❌ Error en miniatura ${idx}: ${img.url}`);
                  }}
                  onLoad={() => {
                    console.log(`✅ Miniatura ${idx} cargada: ${img.url}`);
                  }}
                />
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
                  <video 
                    src={images[modalIndex].url} 
                    className={styles.modalVideo} 
                    controls 
                    autoPlay 
                  />
                ) : isPDF(images[modalIndex]?.url) ? (
                  <iframe src={images[modalIndex].url} className={styles.modalPdf} title="PDF" />
                ) : (
                  <img 
                    src={images[modalIndex].url} 
                    alt={`Imagen ${modalIndex + 1}`} 
                    className={styles.modalImage}
                    onError={(e) => console.error(`❌ Error en modal: ${images[modalIndex].url}`, e)}
                  />
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
                    <img 
                      src={img.url} 
                      alt="" 
                      className={styles.modalThumbnailImage}
                      onError={(e) => console.error(`❌ Error miniatura modal: ${img.url}`)}
                    />
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