// FRONTEND/src/components/mantenimiento/EquipmentPhotoGallery.jsx
import { useState, useRef } from 'react';
import styles from './EquipmentPhotoGallery.module.css';

const API_BASE = import.meta.env.VITE_API_URL;
const BACKEND_BASE = API_BASE ? API_BASE.replace('/api', '') : '';

function normalizeUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) return `${BACKEND_BASE}${url}`;
  return url;
}

export default function EquipmentPhotoGallery({ 
  photos = [], 
  selectedPhotoUrl = null,
  onSelectProfilePhoto,
  onAddPhotos,
  onDeletePhoto,
  equipoId,
  readOnly = false 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageContainerRef = useRef(null);

  // Normalizar URLs de las fotos
  const normalizedPhotos = photos.map(photo => ({
    ...photo,
    url: normalizeUrl(photo.foto_url || photo.url)
  }));

  const selectedPhotoNormalized = normalizeUrl(selectedPhotoUrl);

  if (!normalizedPhotos || normalizedPhotos.length === 0) {
    return (
      <div className={styles.emptyGallery}>
        <div className={styles.emptyIcon}>📷</div>
        <p>No hay fotos de este equipo</p>
        {!readOnly && (
          <button className={styles.addFirstPhotoBtn} onClick={() => fileInputRef.current?.click()}>
            + Agregar primera foto
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className={styles.hiddenInput}
        />
      </div>
    );
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? normalizedPhotos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === normalizedPhotos.length - 1 ? 0 : prev + 1));
  };

  const openModal = (index) => {
    setModalIndex(index);
    resetZoomAndPosition();
    setShowModal(true);
  };

  const handleModalPrev = () => {
    setModalIndex((prev) => (prev === 0 ? normalizedPhotos.length - 1 : prev - 1));
    resetZoomAndPosition();
  };

  const handleModalNext = () => {
    setModalIndex((prev) => (prev === normalizedPhotos.length - 1 ? 0 : prev + 1));
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

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedPhotos = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        console.error('Archivo no es imagen:', file.name);
        continue;
      }

      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('tipo', 'foto_equipo');
      formData.append('entidad_id', equipoId);

      try {
        const response = await fetch(`${API_BASE}/mantenimiento/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (data.url) {
          uploadedPhotos.push({
            url: data.url,
            filename: file.name,
            fecha: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error subiendo foto:', err);
      }
    }

    if (uploadedPhotos.length > 0 && onAddPhotos) {
      await onAddPhotos(uploadedPhotos);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectProfile = (photo) => {
    if (onSelectProfilePhoto) {
      onSelectProfilePhoto(photo.url);
    }
  };

  const handleDeletePhoto = async (photo, index) => {
    if (window.confirm(`¿Eliminar esta foto permanentemente?`)) {
      if (onDeletePhoto) {
        await onDeletePhoto(photo.url, index);
      }
      if (photo.url === selectedPhotoNormalized && onSelectProfilePhoto) {
        onSelectProfilePhoto(null);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className={styles.galleryContainer}>
        <div className={styles.galleryHeader}>
          <div className={styles.galleryTitle}>
            <span>📸 Galería de Fotos ({normalizedPhotos.length})</span>
            {!readOnly && (
              <button 
                className={styles.addPhotosBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? '📤 Subiendo...' : '+ Agregar fotos'}
              </button>
            )}
          </div>
          <div className={styles.galleryInfo}>
            {selectedPhotoNormalized && (
              <span className={styles.profileBadge}>⭐ Foto de perfil seleccionada</span>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className={styles.hiddenInput}
        />

        <div className={styles.carouselContainer}>
          <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev}>
            ‹
          </button>

          <div className={styles.mainImageContainer} onClick={() => openModal(currentIndex)}>
            <img 
              src={normalizedPhotos[currentIndex]?.url} 
              alt={`Foto ${currentIndex + 1}`} 
              className={styles.mainImage}
            />
            <div className={styles.imageOverlay}>
              {normalizedPhotos[currentIndex]?.url === selectedPhotoNormalized && (
                <span className={styles.profileIndicator}>⭐ Foto de perfil</span>
              )}
              <div className={styles.imageDateBadge}>
                📅 {formatDate(normalizedPhotos[currentIndex]?.fecha_subida || normalizedPhotos[currentIndex]?.fecha) || 'Fecha no disponible'}
              </div>
            </div>
          </div>

          <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext}>
            ›
          </button>
        </div>

        <div className={styles.thumbnailContainer}>
          {normalizedPhotos.map((photo, idx) => (
            <div
              key={idx}
              className={`${styles.thumbnail} ${idx === currentIndex ? styles.activeThumbnail : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <img 
                src={photo.url} 
                alt={`Miniatura ${idx + 1}`} 
                className={styles.thumbnailImage}
              />
              <div className={styles.thumbnailOverlay}>
                {photo.url === selectedPhotoNormalized && (
                  <span className={styles.thumbnailProfileIcon}>⭐</span>
                )}
              </div>
              {!readOnly && (
                <button 
                  className={styles.deleteThumbnailBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(photo, idx);
                  }}
                  title="Eliminar foto"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className={styles.actionButtons}>
          {!readOnly && normalizedPhotos.length > 0 && (
            <button 
              className={styles.setProfileBtn}
              onClick={() => handleSelectProfile(normalizedPhotos[currentIndex])}
            >
              ⭐ Establecer como foto de perfil
            </button>
          )}
          {!readOnly && (
            <button 
              className={styles.deleteCurrentBtn}
              onClick={() => handleDeletePhoto(normalizedPhotos[currentIndex], currentIndex)}
            >
              🗑️ Eliminar foto actual
            </button>
          )}
        </div>
      </div>

      {/* Modal ampliado */}
      {showModal && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowModal(false)}
          onWheel={handleWheel}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            
            <div className={styles.zoomControls}>
              <button className={styles.zoomButton} onClick={zoomOut}>−</button>
              <button className={styles.zoomButton} onClick={resetZoomAndPosition}>
                {Math.round(zoomLevel * 100)}%
              </button>
              <button className={styles.zoomButton} onClick={zoomIn}>+</button>
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
              >
                <div className={styles.zoomableWrapper}>
                  <img 
                    src={normalizedPhotos[modalIndex]?.url} 
                    alt={`Foto ${modalIndex + 1}`} 
                    className={styles.modalImage}
                    style={{ 
                      transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                      cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                    }}
                    draggable={false}
                  />
                </div>
              </div>
              
              <button className={styles.modalNavNext} onClick={handleModalNext}>›</button>
            </div>

            <div className={styles.modalInfo}>
              <div className={styles.modalInfoLeft}>
                {normalizedPhotos[modalIndex]?.url === selectedPhotoNormalized && (
                  <span className={styles.modalProfileBadge}>⭐ Foto de perfil actual</span>
                )}
              </div>
              <div className={styles.modalInfoCenter}>
                <span>{modalIndex + 1} de {normalizedPhotos.length}</span>
              </div>
              <div className={styles.modalInfoRight}>
                {zoomLevel > 1 && <span className={styles.zoomHint}>🔍 Arrastra para mover</span>}
              </div>
            </div>

            <div className={styles.modalActions}>
              {!readOnly && (
                <>
                  <button 
                    className={styles.modalSetProfileBtn}
                    onClick={() => {
                      handleSelectProfile(normalizedPhotos[modalIndex]);
                      setShowModal(false);
                    }}
                  >
                    ⭐ Establecer como foto de perfil
                  </button>
                  <button 
                    className={styles.modalDeleteBtn}
                    onClick={() => {
                      handleDeletePhoto(normalizedPhotos[modalIndex], modalIndex);
                      setShowModal(false);
                    }}
                  >
                    🗑️ Eliminar foto
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}