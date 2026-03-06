// ==========================================
// ARCHIVO DE EXPORTACIÓN DE ESTILOS - VOLTAJE
// ==========================================

// Exportar estilos de las páginas
export { default as dashboardStyles } from '../VoltajeDashboard.module.css';
export { default as statsStyles } from '../VoltajeStats.module.css';
export { default as historicoStyles } from '../VoltajeHistorico.module.css';

// NOTA: Los estilos de VoltageCard están en components/charts/Sensorvoltaje/
// No los exportamos desde aquí para mantener la separación de responsabilidades

// ==========================================
// CONSTANTES DE COLORES (para mantener consistencia)
// ==========================================
export const VOLTAJE_COLORS = {
  normal: 'var(--green)',
  bajo: 'var(--amber)',
  alto: 'var(--red)',
  sinDatos: 'var(--text-muted)',
  fondo: 'var(--bg-surface)',
  borde: 'var(--border-dim)',
  texto: 'var(--text-primary)',
  textoSecundario: 'var(--text-muted)'
};

// ==========================================
// RANGOS DE VOLTAJE POR DEFECTO
// ==========================================
export const VOLTAJE_RANGOS = {
  min: 110,
  max: 130,
  criticoMin: 105,
  criticoMax: 135,
  unidad: 'V',
  advertencia: 'V'
};

// ==========================================
// NOMBRES DE FASES
// ==========================================
export const FASES = [
  { id: 'R', nombre: 'Fase R', nombreCompleto: 'Fase R (Roja)', color: '#00ff9d', pin: 'A0' },
  { id: 'S', nombre: 'Fase S', nombreCompleto: 'Fase S (Blanca)', color: '#00cc7a', pin: 'A1' },
  { id: 'T', nombre: 'Fase T', nombreCompleto: 'Fase T (Negra)', color: '#009955', pin: 'A2' }
];

// ==========================================
// FUNCIONES DE UTILIDAD PARA ESTILOS
// ==========================================

/**
 * Obtiene el color según el valor de voltaje
 * @param {number} voltage - Valor de voltaje
 * @param {number} min - Voltaje mínimo normal
 * @param {number} max - Voltaje máximo normal
 * @returns {string} - Variable CSS del color
 */
export const getVoltageColor = (voltage, min = 110, max = 130) => {
  if (!voltage || voltage === 0) return VOLTAJE_COLORS.sinDatos;
  if (voltage >= min && voltage <= max) return VOLTAJE_COLORS.normal;
  if (voltage < min) return VOLTAJE_COLORS.bajo;
  if (voltage > max) return VOLTAJE_COLORS.alto;
  return VOLTAJE_COLORS.sinDatos;
};

/**
 * Obtiene el texto de estado según el voltaje
 * @param {number} voltage - Valor de voltaje
 * @param {number} min - Voltaje mínimo normal
 * @param {number} max - Voltaje máximo normal
 * @returns {string} - Texto descriptivo
 */
export const getVoltageStatus = (voltage, min = 110, max = 130) => {
  if (!voltage || voltage === 0) return 'S/D';
  if (voltage >= min && voltage <= max) return 'Normal';
  if (voltage < min) return 'Bajo';
  if (voltage > max) return 'Alto';
  return '--';
};

/**
 * Obtiene el ícono según el voltaje
 * @param {number} voltage - Valor de voltaje
 * @param {number} min - Voltaje mínimo normal
 * @param {number} max - Voltaje máximo normal
 * @returns {string} - Emoji/ícono
 */
export const getVoltageIcon = (voltage, min = 110, max = 130) => {
  if (!voltage || voltage === 0) return '⚪';
  if (voltage >= min && voltage <= max) return '✅';
  if (voltage < min) return '⚠️';
  if (voltage > max) return '🔴';
  return '⚪';
};

/**
 * Formatea un valor de voltaje con unidad
 * @param {number} voltage - Valor de voltaje
 * @param {number} decimales - Número de decimales
 * @returns {string} - Voltaje formateado (ej: "127.5 V")
 */
export const formatVoltage = (voltage, decimales = 1) => {
  if (voltage === undefined || voltage === null) return '-- V';
  return `${voltage.toFixed(decimales)} ${VOLTAJE_RANGOS.unidad}`;
};

// ==========================================
// CONFIGURACIÓN DE GRÁFICAS
// ==========================================
export const VOLTAJE_CHART_CONFIG = {
  colors: {
    R: '#00ff9d',
    S: '#00cc7a',
    T: '#009955'
  },
  tooltip: {
    backgroundColor: 'var(--bg-surface)',
    borderColor: 'var(--border-dim)',
    textColor: 'var(--text-primary)'
  },
  grid: {
    stroke: 'var(--border-dim)',
    strokeDasharray: '3 3'
  },
  margins: {
    top: 20,
    right: 30,
    bottom: 30,
    left: 40
  }
};

// ==========================================
// FORMATO DE FECHAS
// ==========================================
export const DATE_FORMATS = {
  horaMinuto: 'HH:mm',
  diaMes: 'DD/MM',
  completo: 'DD/MM/YYYY HH:mm',
  sql: 'YYYY-MM-DD HH:mm:ss',
  iso: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};

// ==========================================
// TEXTOS Y ETIQUETAS
// ==========================================
export const VOLTAJE_TEXTS = {
  titulo: 'Control de Voltaje',
  subtitulo: 'Monitoreo de 3 fases con ZMPT101B',
  estadisticas: 'Estadísticas de Voltaje',
  historico: 'Histórico de Voltaje',
  promedio: 'Promedio trifásico',
  ultimoRegistro: 'Último registro',
  sinDatos: 'No hay datos disponibles',
  cargando: 'Cargando...',
  error: 'Error al cargar datos'
};

// ==========================================
//CONFIGURACIÓN DE ENDPOINTS
// ==========================================
export const VOLTAJE_ENDPOINTS = {
  status: '/api/arduino-voltaje/status',
  ultimo: '/api/arduino-voltaje/ultimo',
  historico: '/api/arduino-voltaje/historico',
  buscar: '/api/arduino-voltaje/buscar',
  stats: '/api/arduino-voltaje/stats',
  resumen: '/api/arduino-voltaje/resumen'
};

// ==========================================
// VALORES POR DEFECTO
// ==========================================
export const DEFAULT_VALUES = {
  voltage: 0,
  sdStatus: 'DESCONOCIDO',
  sdFails: 0,
  registros: []
};

// ==========================================
// EXPORTACIÓN POR DEFECTO (TODOS LOS ESTILOS JUNTOS)
// ==========================================
export default {
  // Estilos de páginas
  dashboard: dashboardStyles,
  stats: statsStyles,
  historico: historicoStyles,
  
  // Configuración
  colores: VOLTAJE_COLORS,
  rangos: VOLTAJE_RANGOS,
  fases: FASES,
  textos: VOLTAJE_TEXTS,
  endpoints: VOLTAJE_ENDPOINTS,
  defaults: DEFAULT_VALUES,
  
  // Utilidades
  utils: {
    getColor: getVoltageColor,
    getStatus: getVoltageStatus,
    getIcon: getVoltageIcon,
    format: formatVoltage
  },
  
  // Gráficas
  charts: VOLTAJE_CHART_CONFIG,
  dateFormats: DATE_FORMATS
};