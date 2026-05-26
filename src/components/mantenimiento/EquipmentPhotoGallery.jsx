// FRONTEND/src/components/mantenimiento/EquipmentPhotoGallery.jsx
import { useState, useRef } from 'react';
import styles from './EquipmentPhotoGallery.module.css';

const API_BASE = import.meta.env.VITE_API_URL;
const BACKEND_BASE = API_BASE ? API_BASE.replace('/api', '') : '';

function normalizeUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    const backendBase = API_BASE ? API_BASE.replace('/api', '') : '';
    return `${backendBase}${url}`;
  }
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

  // Normalizar URLs de las fotos - Usar un enfoque más seguro
  const normalizedPhotos = [];
  if (photos && photos.length > 0) {
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoUrl = photo.foto_url || photo.url;
      normalizedPhotos.push({
        id: photo.id,
        url: normalizeUrl(photoUrl),
        fecha: photo.fecha_subida || photo.fecha,
        es_principal: photo.es_principal
      });
    }
  }

  const selectedPhotoNormalized = normalizeUrl(selectedPhotoUrl);

  // Función para manejar la subida de archivos
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedPhotos = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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

  // Función para establecer foto de perfil
  const handleSelectProfile = (photo) => {
    if (onSelectProfilePhoto && photo) {
      onSelectProfilePhoto(photo.url);
    }
  };

  // Función para eliminar foto
  const handleDeletePhoto = async (photo, index) => {
    if (!photo) return;
    const confirmDelete = window.confirm('¿Eliminar esta foto permanentemente?');
    if (confirmDelete && onDeletePhoto) {
      await onDeletePhoto(photo.url, index);
      if (photo.url === selectedPhotoNormalized && onSelectProfilePhoto) {
        onSelectProfilePhoto(null);
      }
    }
  };

  // Función para cambiar de imagen
  const handlePrev = () => {
    if (normalizedPhotos.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? normalizedPhotos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (normalizedPhotos.length === 0) return;
    setCurrentIndex((prev) => (prev === normalizedPhotos.length - 1 ? 0 : prev + 1));
  };

  // Funciones del modal
  const openModal = (index) => {
    setModalIndex(index);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setShowModal(true);
  };

  const handleModalPrev = () => {
    if (normalizedPhotos.length === 0) return;
    setModalIndex((prev) => (prev === 0 ? normalizedPhotos.length - 1 : prev - 1));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleModalNext = () => {
    if (normalizedPhotos.length === 0) return;
    setModalIndex((prev) => (prev === normalizedPhotos.length - 1 ? 0 : prev + 1));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
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

  // Manejo de arrastre para zoom
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

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  };

  // Si no hay fotos
  if (normalizedPhotos.length === 0) {
    return (
      <div className={styles.emptyGallery}>
        <div className={styles.emptyIcon}>📷</div>
        <p>No hay fotos de este equipo</p>
        {!readOnly && (
          <button 
            className={styles.addFirstPhotoBtn} 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '📤 Subiendo...' : '+ Agregar primera foto'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  // Obtener la foto actual
  const currentPhoto = normalizedPhotos[currentIndex];

  return (
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
        style={{ display: 'none' }}
      />

      <div className={styles.carouselContainer}>
        <button className={`${styles.navButton} ${styles.prevButton}`} onClick={handlePrev} aria-label="Anterior">
          ‹
        </button>

        <div className={styles.mainImageContainer} onClick={() => openModal(currentIndex)}>
          <img 
            src={currentPhoto.url} 
            alt={`Foto ${currentIndex + 1}`} 
            className={styles.mainImage}
            onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 8h-4v4h-4v-4H6V9h4V5h4v4h4v2z"/></svg>'; }}
          />
          <div className={styles.imageOverlay}>
            {currentPhoto.url === selectedPhotoNormalized && (
              <span className={styles.profileIndicator}>⭐ Foto de perfil</span>
            )}
            <div className={styles.imageDateBadge}>
              📅 {formatDate(currentPhoto.fecha) || 'Fecha no disponible'}
            </div>
          </div>
        </div>

        <button className={`${styles.navButton} ${styles.nextButton}`} onClick={handleNext} aria-label="Siguiente">
          ›
        </button>
      </div>

      <div className={styles.thumbnailContainer}>
        {normalizedPhotos.map((photo, idx) => (
          <div
            key={photo.id || idx}
            className={`${styles.thumbnail} ${idx === currentIndex ? styles.activeThumbnail : ''}`}
            onClick={() => setCurrentIndex(idx)}
          >
            <img 
              src={photo.url} 
              alt={`Miniatura ${idx + 1}`} 
              className={styles.thumbnailImage}
              onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 8h-4v4h-4v-4H6V9h4V5h4v4h4v2z"/></svg>'; }}
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
                aria-label="Eliminar"
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
            onClick={() => handleSelectProfile(currentPhoto)}
          >
            ⭐ Establecer como foto de perfil
          </button>
        )}
        {!readOnly && (
          <button 
            className={styles.deleteCurrentBtn}
            onClick={() => handleDeletePhoto(currentPhoto, currentIndex)}
          >
            🗑️ Eliminar foto actual
          </button>
        )}
      </div>

      {/* Modal ampliado */}
      {showModal && normalizedPhotos[modalIndex] && (
        <div 
          className={styles.modalOverlay} 
          onClick={() => setShowModal(false)}
          onWheel={handleWheel}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)} aria-label="Cerrar">
              ✕
            </button>
            
            <div className={styles.zoomControls}>
              <button className={styles.zoomButton} onClick={zoomOut} aria-label="Alejar">−</button>
              <button className={styles.zoomButton} onClick={resetZoomAndPosition}>
                {Math.round(zoomLevel * 100)}%
              </button>
              <button className={styles.zoomButton} onClick={zoomIn} aria-label="Acercar">+</button>
            </div>

            <div className={styles.modalCarousel}>
              <button className={styles.modalNavPrev} onClick={handleModalPrev} aria-label="Anterior">‹</button>
              
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
                    src={normalizedPhotos[modalIndex].url} 
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
              
              <button className={styles.modalNavNext} onClick={handleModalNext} aria-label="Siguiente">›</button>
            </div>

            <div className={styles.modalInfo}>
              <div className={styles.modalInfoLeft}>
                {normalizedPhotos[modalIndex].url === selectedPhotoNormalized && (
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
    </div>
  );
}