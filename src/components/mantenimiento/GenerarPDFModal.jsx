// FRONTEND/src/components/mantenimiento/GenerarPDFModal.jsx
import { useState, useEffect } from 'react';
import { ordenesAPI } from '../../api/ordenes';
import { mantenimientoAPI } from '../../api/mantenimiento';
import styles from './GenerarPDFModal.module.css';

const API_BASE = import.meta.env.VITE_API_URL;

export default function GenerarPDFModal({ isOpen, onClose, orden, equipo, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [incluirImagenes, setIncluirImagenes] = useState(true);
  const [incluirEvidencias, setIncluirEvidencias] = useState(true);
  const [evidencias, setEvidencias] = useState([]);
  const [selectedEvidencias, setSelectedEvidencias] = useState(new Set());
  const [paso, setPaso] = useState(1);

  console.log('🔵 [Modal] Renderizando, isOpen:', isOpen);
  console.log('🔵 [Modal] orden recibida:', orden);
  console.log('🔵 [Modal] equipo recibido:', equipo);

  useEffect(() => {
    if (isOpen && orden && orden.estado === 'completado') {
      console.log('🔵 [Modal] Cargando evidencias para orden:', orden.id);
      cargarEvidencias();
    }
  }, [isOpen, orden]);

  const cargarEvidencias = async () => {
    try {
      const url = `${API_BASE}/mantenimiento/evidencias/mantenimiento/${orden.id}`;
      console.log('🔵 [Modal] Fetching evidencias desde:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('🔵 [Modal] Evidencias recibidas:', data);
      if (data.ok && data.datos) {
        setEvidencias(data.datos);
      }
    } catch (err) {
      console.error('🔴 [Modal] Error cargando evidencias:', err);
    }
  };

  const handleToggleEvidencia = (url) => {
    setSelectedEvidencias(prev => {
      const newSet = new Set(prev);
      if (newSet.has(url)) {
        newSet.delete(url);
      } else {
        newSet.add(url);
      }
      return newSet;
    });
  };

  const handleSelectAllEvidencias = () => {
    if (selectedEvidencias.size === evidencias.length) {
      setSelectedEvidencias(new Set());
    } else {
      setSelectedEvidencias(new Set(evidencias.map(e => e.url)));
    }
  };

  const generarPDF = async () => {
    setLoading(true);
    try {
      console.log('🔵 [Modal] === INICIANDO GENERACIÓN DE PDF ===');
      console.log('🔵 [Modal] Paso 1: Datos de orden:', orden);
      console.log('🔵 [Modal] Paso 1: Datos de equipo:', equipo);
      
      const pdfData = {
        orden,
        equipo,
        incluirImagenes,
        incluirEvidencias: incluirEvidencias && evidencias.length > 0,
        evidenciasSeleccionadas: incluirEvidencias ? Array.from(selectedEvidencias) : []
      };
      
      console.log('🔵 [Modal] Paso 2: pdfData a enviar:', JSON.stringify(pdfData, null, 2));
      
      const url = `${API_BASE}/ordenes/generar-pdf`;
      console.log('🔵 [Modal] Paso 3: URL del endpoint:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfData)
      });
      
      console.log('🔵 [Modal] Paso 4: Response status:', response.status);
      console.log('🔵 [Modal] Paso 5: Response ok?', response.ok);
      
      if (response.ok) {
        console.log('🔵 [Modal] Paso 6: Generando blob...');
        const blob = await response.blob();
        console.log('🔵 [Modal] Paso 7: Blob creado, tamaño:', blob.size, 'bytes');
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const nombreEquipo = (equipo?.nombre || orden.equipo_nombre || 'equipo').replace(/[^a-z0-9]/gi, '_');
        a.download = `orden_${orden.id}_${nombreEquipo}.pdf`;
        a.href = downloadUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        console.log('🔵 [Modal] Paso 8: PDF descargado exitosamente');
        
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        console.error('🔴 [Modal] Paso 9: Error response:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('🔴 [Modal] Paso 10: Error capturado:', err);
      alert('Error al generar el PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>📄 Generar PDF de Orden de Trabajo</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modalBody}>
          {paso === 1 && (
            <div className={styles.pasoContainer}>
              <h4>📋 Resumen de la orden</h4>
              <div className={styles.resumenCard}>
                <p><strong>Orden #:</strong> ORD-{orden.id}</p>
                <p><strong>Equipo:</strong> {equipo?.nombre || orden.equipo_nombre}</p>
                <p><strong>Título:</strong> {orden.titulo}</p>
                <p><strong>Estado:</strong> {orden.estado === 'completado' ? '✅ Completado' : '🟡 Pendiente'}</p>
                <p><strong>Prioridad:</strong> {orden.prioridad}</p>
                <p><strong>Fecha inicio:</strong> {formatDate(orden.fecha_inicio)}</p>
                {orden.fecha_completado && <p><strong>Fecha completado:</strong> {formatDate(orden.fecha_completado)}</p>}
                {orden.completado_por && <p><strong>Técnico:</strong> {orden.completado_por}</p>}
                {orden.notas_completado && <p><strong>Notas:</strong> {orden.notas_completado}</p>}
                {orden.materiales_usados && <p><strong>Materiales:</strong> {orden.materiales_usados}</p>}
                {orden.costo_materiales > 0 && <p><strong>Costo:</strong> ${orden.costo_materiales}</p>}
              </div>

              <div className={styles.opcionesContainer}>
                <h4>⚙️ Opciones del PDF</h4>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={incluirImagenes}
                    onChange={(e) => setIncluirImagenes(e.target.checked)}
                  />
                  Incluir foto del equipo
                </label>
                {orden.estado === 'completado' && evidencias.length > 0 && (
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={incluirEvidencias}
                      onChange={(e) => setIncluirEvidencias(e.target.checked)}
                    />
                    Incluir evidencias del mantenimiento
                  </label>
                )}
              </div>

              <div className={styles.buttonsContainer}>
                <button className={styles.cancelarBtn} onClick={onClose}>
                  Cancelar
                </button>
                <button 
                  className={styles.siguienteBtn}
                  onClick={() => {
                    if (incluirEvidencias && evidencias.length > 0) {
                      setPaso(2);
                    } else {
                      generarPDF();
                    }
                  }}
                >
                  {incluirEvidencias && evidencias.length > 0 ? 'Siguiente →' : 'Generar PDF'}
                </button>
              </div>
            </div>
          )}

          {paso === 2 && (
            <div className={styles.pasoContainer}>
              <h4>🖼️ Selecciona las evidencias a incluir</h4>
              <div className={styles.evidenciasHeader}>
                <button className={styles.selectAllBtn} onClick={handleSelectAllEvidencias}>
                  {selectedEvidencias.size === evidencias.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
                <span>{selectedEvidencias.size} de {evidencias.length} seleccionadas</span>
              </div>

              <div className={styles.evidenciasGrid}>
                {evidencias.map((ev, idx) => (
                  <div key={idx} className={styles.evidenciaItem}>
                    <input
                      type="checkbox"
                      checked={selectedEvidencias.has(ev.url)}
                      onChange={() => handleToggleEvidencia(ev.url)}
                      id={`ev-${idx}`}
                    />
                    <label htmlFor={`ev-${idx}`} className={styles.evidenciaPreview}>
                      {ev.url?.match(/\.pdf$/i) ? (
                        <div className={styles.pdfPreview}>📄 PDF</div>
                      ) : (
                        <img src={ev.url} alt={`Evidencia ${idx + 1}`} />
                      )}
                      <span className={styles.evidenciaFilename}>
                        {ev.filename?.length > 30 ? ev.filename.substring(0, 27) + '...' : ev.filename}
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              <div className={styles.buttonsContainer}>
                <button className={styles.volverBtn} onClick={() => setPaso(1)}>
                  ← Volver
                </button>
                <button 
                  className={styles.generarBtn}
                  onClick={generarPDF}
                  disabled={loading}
                >
                  {loading ? 'Generando...' : '📄 Generar PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}