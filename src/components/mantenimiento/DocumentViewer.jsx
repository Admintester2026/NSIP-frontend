// FRONTEND/src/components/mantenimiento/DocumentViewer.jsx
import { useState } from 'react';
import styles from './DocumentViewer.module.css';

export default function DocumentViewer({ documents, title = 'Documentos' }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showModal, setShowModal] = useState(false);

  if (!documents || documents.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>📄 No hay documentos cargados</p>
      </div>
    );
  }

  const isPDF = (url) => {
    return url?.match(/\.pdf$/i);
  };

  const isImage = (url) => {
    return url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const getDocumentIcon = (url) => {
    if (isPDF(url)) return '📑';
    if (isImage(url)) return '🖼️';
    return '📄';
  };

  const getDocumentType = (url) => {
    if (isPDF(url)) return 'PDF';
    if (isImage(url)) return 'Imagen';
    return 'Documento';
  };

  const getDocumentName = (doc) => {
    if (doc.nombre) return doc.nombre;
    if (doc.filename) return doc.filename;
    // Extraer nombre de la URL
    const urlParts = doc.url.split('/');
    const filename = urlParts[urlParts.length - 1];
    // Limpiar prefijos
    return filename.replace(/^(ficha_tecnica|manual|foto_equipo)-\d+-/, '');
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const openDocument = (doc) => {
    setSelectedDoc(doc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDoc(null);
  };

  return (
    <>
      <div className={styles.documentContainer}>
        <div className={styles.documentHeader}>
          <span className={styles.documentTitle}>{title}</span>
          <span className={styles.documentCount}>{documents.length} documento(s)</span>
        </div>

        <div className={styles.documentsGrid}>
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className={styles.documentCard}
              onClick={() => openDocument(doc)}
            >
              <div className={styles.documentIcon}>
                {getDocumentIcon(doc.url)}
              </div>
              <div className={styles.documentInfo}>
                <span className={styles.documentName} title={getDocumentName(doc)}>
                  {getDocumentName(doc).length > 30 
                    ? getDocumentName(doc).substring(0, 27) + '...' 
                    : getDocumentName(doc)}
                </span>
                <span className={styles.documentType}>
                  {getDocumentType(doc.url)}
                </span>
                {doc.fecha && (
                  <span className={styles.documentDate}>
                    📅 {formatDate(doc.fecha)}
                  </span>
                )}
              </div>
              <div className={styles.documentAction}>
                <span className={styles.openIcon}>🔍</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de visualización de documento */}
      {showModal && selectedDoc && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {getDocumentIcon(selectedDoc.url)} {getDocumentName(selectedDoc)}
              </h3>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.modalBody}>
              {isPDF(selectedDoc.url) ? (
                <iframe
                  src={selectedDoc.url}
                  className={styles.pdfViewer}
                  title={getDocumentName(selectedDoc)}
                />
              ) : isImage(selectedDoc.url) ? (
                <img
                  src={selectedDoc.url}
                  alt={getDocumentName(selectedDoc)}
                  className={styles.imageViewer}
                />
              ) : (
                <div className={styles.fileViewer}>
                  <div className={styles.fileIcon}>📄</div>
                  <a
                    href={selectedDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.downloadLink}
                  >
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <a
                href={selectedDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openNewTabBtn}
              >
                🔗 Abrir en nueva pestaña
              </a>
              <button className={styles.closeBtn} onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}