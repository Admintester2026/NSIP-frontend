// src/context/DateContext.jsx
import React, { createContext, useContext, useCallback } from 'react';

// Crear el contexto
const DateContext = createContext();

// Hook personalizado para usar el contexto
export const useDateUtils = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDateUtils must be used within DateProvider');
  }
  return context;
};

// Proveedor del contexto
export const DateProvider = ({ children }) => {
  
  /**
   * Convierte una fecha string (YYYY-MM-DD) a un objeto Date local
   * SIN problemas de zona horaria
   */
  const stringToLocalDate = useCallback((dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, []);

  /**
   * Convierte un objeto Date a string local (YYYY-MM-DD)
   */
  const dateToLocalString = useCallback((date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  /**
   * Convierte una fecha ISO (de la BD) a objeto Date local
   */
  const isoToLocalDate = useCallback((isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }, []);

  /**
   * Compara dos fechas ignorando la hora
   * Retorna: -1 si a < b, 0 si a == b, 1 si a > b
   */
  const compareDates = useCallback((dateA, dateB) => {
    if (!dateA && !dateB) return 0;
    if (!dateA) return -1;
    if (!dateB) return 1;
    
    const a = new Date(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
    const b = new Date(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
    
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }, []);

  /**
   * Verifica si una fecha es hoy
   */
  const isToday = useCallback((date) => {
    if (!date) return false;
    const today = new Date();
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateLocal.getTime() === todayLocal.getTime();
  }, []);

  /**
   * Verifica si una fecha es futura (después de hoy)
   */
  const isFuture = useCallback((date) => {
    if (!date) return false;
    const today = new Date();
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateLocal > todayLocal;
  }, []);

  /**
   * Verifica si una fecha es pasada (antes de hoy)
   */
  const isPast = useCallback((date) => {
    if (!date) return false;
    const today = new Date();
    const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateLocal < todayLocal;
  }, []);

  /**
   * Obtiene la fecha de hoy como objeto Date local
   */
  const getTodayLocal = useCallback(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }, []);

  /**
   * Obtiene la fecha de hoy como string (YYYY-MM-DD)
   */
  const getTodayString = useCallback(() => {
    const today = new Date();
    return dateToLocalString(today);
  }, [dateToLocalString]);

  /**
   * Formatea una fecha para mostrar (dd/mm/yyyy)
   */
  const formatDateDisplay = useCallback((date, includeTime = false) => {
    if (!date) return 'No definida';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    if (includeTime) {
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
    return `${day}/${month}/${year}`;
  }, []);

  /**
   * Valida que una fecha no sea pasada (para formularios)
   */
  const validateNotPast = useCallback((dateString, fieldName = 'fecha') => {
    if (!dateString) return { valid: false, error: `${fieldName} es requerida` };
    
    const selectedDate = stringToLocalDate(dateString);
    const today = getTodayLocal();
    
    if (selectedDate < today) {
      return { valid: false, error: `No se puede programar una ${fieldName} en el pasado` };
    }
    return { valid: true, error: null };
  }, [stringToLocalDate, getTodayLocal]);

  /**
   * Valida que fecha_fin no sea anterior a fecha_inicio
   */
  const validateDateRange = useCallback((fechaInicio, fechaFin) => {
    if (!fechaInicio) return { valid: false, error: 'Fecha de inicio requerida' };
    if (!fechaFin) return { valid: true, error: null };
    
    const inicio = stringToLocalDate(fechaInicio);
    const fin = stringToLocalDate(fechaFin);
    
    if (fin < inicio) {
      return { valid: false, error: 'La fecha de fin no puede ser anterior a la fecha de inicio' };
    }
    return { valid: true, error: null };
  }, [stringToLocalDate]);

  /**
   * Obtiene el indicador de mes (actual, pasado, próximo)
   */
  const getMonthIndicator = useCallback((fecha) => {
    if (!fecha) return null;
    const fechaLocal = fecha instanceof Date ? fecha : new Date(fecha);
    const ahora = getTodayLocal();
    
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();
    const mesFecha = fechaLocal.getMonth();
    const añoFecha = fechaLocal.getFullYear();
    
    if (añoFecha === añoActual && mesFecha === mesActual) {
      return { texto: '📅 Mes actual', clase: 'mesActual' };
    } else if (añoFecha < añoActual || (añoFecha === añoActual && mesFecha < mesActual)) {
      return { texto: '📆 Mes pasado', clase: 'mesPasado' };
    } else {
      return { texto: '📅 Mes próximo', clase: 'mesProximo' };
    }
  }, [getTodayLocal]);

  // Valores expuestos por el contexto
  const value = {
    stringToLocalDate,
    dateToLocalString,
    isoToLocalDate,
    compareDates,
    isToday,
    isFuture,
    isPast,
    getTodayLocal,
    getTodayString,
    formatDateDisplay,
    validateNotPast,
    validateDateRange,
    getMonthIndicator
  };

  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};

export default DateContext;