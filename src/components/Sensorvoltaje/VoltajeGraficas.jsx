import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { voltajeAPI } from '../../api/voltaje';
import { usePolling } from '../../hooks/useAsync';
import { formatDate } from '../../utils/dateUtils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import styles from './VoltajeGraficas.module.css';

export default function VoltajeGraficas() {
  const [periodo, setPeriodo] = useState('dia');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para búsqueda histórica
  const [searchMode, setSearchMode] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [searchPeriodo, setSearchPeriodo] = useState('dia');
  const [searchDatos, setSearchDatos] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const fetchHistorico = useCallback(() => voltajeAPI.getHistorico(5000), []);
  const { data } = usePolling(fetchHistorico, 60000);

  useEffect(() => {
    if (data) {
      procesarDatos(data, periodo, setDatos);
      setLoading(false);
    }
  }, [data, periodo]);

  // Función para filtrar datos por período actual
  const filtrarPorPeriodoActual = (datosCrudos, periodoSeleccionado) => {
    if (!datosCrudos || datosCrudos.length === 0) return [];
    
    const hoy = new Date();
    const hoyStr = formatDate(hoy.toISOString());
    
    if (periodoSeleccionado === 'dia') {
      // Filtrar solo registros de hoy
      return datosCrudos.filter(item => {
        const itemFecha = formatDate(item.FECHA);
        return itemFecha === hoyStr;
      });
    } 
    else if (periodoSeleccionado === 'semana') {
      // Calcular el inicio de la semana (domingo)
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      
      const inicioStr = formatDate(inicioSemana.toISOString());
      const finStr = formatDate(finSemana.toISOString());
      
      return datosCrudos.filter(item => {
        const itemFecha = formatDate(item.FECHA);
        return itemFecha >= inicioStr && itemFecha <= finStr;
      });
    }
    else if (periodoSeleccionado === 'mes') {
      // Filtrar solo registros del mes actual
      const mesActual = hoy.getMonth();
      const añoActual = hoy.getFullYear();
      
      return datosCrudos.filter(item => {
        const itemFecha = new Date(item.FECHA);
        return itemFecha.getMonth() === mesActual && itemFecha.getFullYear() === añoActual;
      });
    }
    
    return datosCrudos;
  };

  // Función para procesar datos (reutilizable)
  const procesarDatos = (datosCrudos, periodoSeleccionado, setStateCallback) => {
    if (!datosCrudos || datosCrudos.length === 0) {
      setStateCallback([]);
      return;
    }

    // Filtrar datos según el período actual
    const datosFiltrados = filtrarPorPeriodoActual(datosCrudos, periodoSeleccionado);

    if (datosFiltrados.length === 0) {
      setStateCallback([]);
      return;
    }

    if (periodoSeleccionado === 'dia') {
      const horas = Array.from({ length: 24 }, (_, i) => ({
        hora: `${i}:00`,
        '1': 0,
        '2': 0,
        '3': 0,
        count: 0
      }));

      datosFiltrados.forEach(item => {
        const fechaStr = item.FECHA;
        let hora = 0;
        
        const timeMatch = fechaStr.match(/(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          hora = parseInt(timeMatch[1], 10);
        }
        
        horas[hora]['1'] += item.V_R || 0;
        horas[hora]['2'] += item.V_S || 0;
        horas[hora]['3'] += item.V_T || 0;
        horas[hora].count += 1;
      });

      const datosGrafica = horas.map(h => ({
        hora: h.hora,
        '1': h.count > 0 ? parseFloat((h['1'] / h.count).toFixed(1)) : 0,
        '2': h.count > 0 ? parseFloat((h['2'] / h.count).toFixed(1)) : 0,
        '3': h.count > 0 ? parseFloat((h['3'] / h.count).toFixed(1)) : 0
      }));

      setStateCallback(datosGrafica);
    } 
    else if (periodoSeleccionado === 'semana') {
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const datosSemana = [];

      // Obtener los últimos 7 días (desde hoy hacia atrás)
      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = formatDate(fecha.toISOString());
        
        const datosDia = datosFiltrados.filter(item => {
          const itemFecha = formatDate(item.FECHA);
          return itemFecha === fechaStr;
        });

        if (datosDia.length > 0) {
          const sum1 = datosDia.reduce((acc, curr) => acc + (curr.V_R || 0), 0);
          const sum2 = datosDia.reduce((acc, curr) => acc + (curr.V_S || 0), 0);
          const sum3 = datosDia.reduce((acc, curr) => acc + (curr.V_T || 0), 0);
          
          datosSemana.push({
            dia: diasSemana[fecha.getDay()],
            '1': parseFloat((sum1 / datosDia.length).toFixed(1)),
            '2': parseFloat((sum2 / datosDia.length).toFixed(1)),
            '3': parseFloat((sum3 / datosDia.length).toFixed(1))
          });
        } else {
          datosSemana.push({
            dia: diasSemana[fecha.getDay()],
            '1': 0,
            '2': 0,
            '3': 0
          });
        }
      }
      setStateCallback(datosSemana);
    }
    else if (periodoSeleccionado === 'mes') {
      const semanas = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
      const datosMes = [];

      const hoy = new Date();
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      
      for (let semana = 0; semana < 5; semana++) {
        const inicioSemana = new Date(primerDiaMes);
        inicioSemana.setDate(inicioSemana.getDate() + (semana * 7));
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(finSemana.getDate() + 6);

        const datosSemana = datosFiltrados.filter(item => {
          const itemFechaStr = formatDate(item.FECHA);
          const inicioStr = formatDate(inicioSemana.toISOString());
          const finStr = formatDate(finSemana.toISOString());
          return itemFechaStr >= inicioStr && itemFechaStr <= finStr;
        });

        if (datosSemana.length > 0) {
          const sum1 = datosSemana.reduce((acc, curr) => acc + (curr.V_R || 0), 0);
          const sum2 = datosSemana.reduce((acc, curr) => acc + (curr.V_S || 0), 0);
          const sum3 = datosSemana.reduce((acc, curr) => acc + (curr.V_T || 0), 0);
          
          datosMes.push({
            semana: semanas[semana],
            '1': parseFloat((sum1 / datosSemana.length).toFixed(1)),
            '2': parseFloat((sum2 / datosSemana.length).toFixed(1)),
            '3': parseFloat((sum3 / datosSemana.length).toFixed(1))
          });
        } else {
          datosMes.push({
            semana: semanas[semana],
            '1': 0,
            '2': 0,
            '3': 0
          });
        }
      }
      setStateCallback(datosMes);
    }
  };

  // Función para buscar registros históricos
  const handleSearch = async () => {
    if (!searchDate) {
      setSearchError('Selecciona una fecha');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchMode(true);

    try {
      const allData = await voltajeAPI.getHistorico(10000);
      
      if (!allData || allData.length === 0) {
        setSearchError('No hay datos disponibles');
        setSearchMode(false);
        return;
      }

      let filteredData = [];
      const searchDateObj = new Date(searchDate);
      
      if (searchPeriodo === 'dia') {
        const fechaBuscar = formatDate(searchDateObj.toISOString());
        filteredData = allData.filter(item => {
          const itemFecha = formatDate(item.FECHA);
          return itemFecha === fechaBuscar;
        });
      } 
      else if (searchPeriodo === 'semana') {
        const fechaInicio = new Date(searchDateObj);
        fechaInicio.setDate(fechaInicio.getDate() - fechaInicio.getDay());
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 6);
        
        filteredData = allData.filter(item => {
          const itemFecha = new Date(item.FECHA);
          return itemFecha >= fechaInicio && itemFecha <= fechaFin;
        });
      }
      else if (searchPeriodo === 'mes') {
        const mes = searchDateObj.getMonth();
        const año = searchDateObj.getFullYear();
        
        filteredData = allData.filter(item => {
          const itemFecha = new Date(item.FECHA);
          return itemFecha.getMonth() === mes && itemFecha.getFullYear() === año;
        });
      }

      if (filteredData.length === 0) {
        setSearchError(`No se encontraron registros para ${searchPeriodo === 'dia' ? 'el día' : searchPeriodo === 'semana' ? 'la semana' : 'el mes'} seleccionado`);
        setSearchMode(false);
      } else {
        procesarDatos(filteredData, searchPeriodo, setSearchDatos);
      }
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setSearchError('Error al buscar datos');
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchMode(false);
    setSearchDate('');
    setSearchDatos([]);
    setSearchError('');
  };

  const xAxisKey = periodo === 'dia' ? 'hora' : periodo === 'semana' ? 'dia' : 'semana';
  const searchXAxisKey = searchPeriodo === 'dia' ? 'hora' : searchPeriodo === 'semana' ? 'dia' : 'semana';

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Cargando gráficas...</p>
      </div>
    );
  }

  return (
    <div className={styles.graficas}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Gráficas de Voltaje</h1>
          <p className={styles.subtitle}>
            Visualización de datos | 
            <span className={styles.note}> 📅 Los botones muestran el período actual</span>
          </p>
        </div>
        <Link to="/modulos/voltaje" className={styles.backButtonOutline}>
          ← Volver
        </Link>
      </div>

      {/* Selector de período actual */}
      <div className={styles.periodSelector}>
        <button 
          className={`${styles.periodButton} ${periodo === 'dia' ? styles.active : ''}`}
          onClick={() => setPeriodo('dia')}
        >
          📅 Día Actual
        </button>
        <button 
          className={`${styles.periodButton} ${periodo === 'semana' ? styles.active : ''}`}
          onClick={() => setPeriodo('semana')}
        >
          📊 Semana Actual
        </button>
        <button 
          className={`${styles.periodButton} ${periodo === 'mes' ? styles.active : ''}`}
          onClick={() => setPeriodo('mes')}
        >
          📈 Mes Actual
        </button>
      </div>

      {/* Tres gráficas principales */}
      <div className={styles.chartsContainer}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Fase 1</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={datos} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
              <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" domain={[0, 250]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(20, 20, 30, 0.95)', 
                  borderColor: '#00ff9d',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }} 
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                formatter={(value) => [<span style={{ color: '#00ff9d' }}>{value} V</span>, 'Voltaje']}
              />
              <Line type="monotone" dataKey="1" stroke="#00ff9d" strokeWidth={3} dot={{ r: 3, fill: "#00ff9d" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Fase 2</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={datos} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
              <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" domain={[0, 250]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(20, 20, 30, 0.95)', 
                  borderColor: '#ffaa00',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }} 
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                formatter={(value) => [<span style={{ color: '#ffaa00' }}>{value} V</span>, 'Voltaje']}
              />
              <Line type="monotone" dataKey="2" stroke="#ffaa00" strokeWidth={3} dot={{ r: 3, fill: "#ffaa00" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Fase 3</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={datos} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
              <XAxis dataKey={xAxisKey} stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" domain={[0, 250]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(20, 20, 30, 0.95)', 
                  borderColor: '#ff6b6b',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }} 
                labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                formatter={(value) => [<span style={{ color: '#ff6b6b' }}>{value} V</span>, 'Voltaje']}
              />
              <Line type="monotone" dataKey="3" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 3, fill: "#ff6b6b" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Buscador histórico */}
      <div className={styles.searchSection}>
        <h3 className={styles.searchTitle}>📆 Buscar registros históricos</h3>
        <div className={styles.searchContainer}>
          <div className={styles.searchPeriodSelector}>
            <button 
              className={`${styles.searchPeriodButton} ${searchPeriodo === 'dia' ? styles.active : ''}`}
              onClick={() => setSearchPeriodo('dia')}
            >
              Día
            </button>
            <button 
              className={`${styles.searchPeriodButton} ${searchPeriodo === 'semana' ? styles.active : ''}`}
              onClick={() => setSearchPeriodo('semana')}
            >
              Semana
            </button>
            <button 
              className={`${styles.searchPeriodButton} ${searchPeriodo === 'mes' ? styles.active : ''}`}
              onClick={() => setSearchPeriodo('mes')}
            >
              Mes
            </button>
          </div>
          <div className={styles.searchInputGroup}>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className={styles.dateInput}
              max={new Date().toISOString().split('T')[0]}
            />
            <button 
              onClick={handleSearch} 
              className={styles.searchButton}
              disabled={searchLoading}
            >
              {searchLoading ? 'Buscando...' : '🔍 Buscar'}
            </button>
            {searchMode && (
              <button onClick={clearSearch} className={styles.clearButton}>
                ✕ Limpiar
              </button>
            )}
          </div>
          {searchError && <p className={styles.searchError}>{searchError}</p>}
        </div>
      </div>

      {/* Resultados de búsqueda histórica */}
      {searchMode && searchDatos.length > 0 && !searchLoading && (
        <div className={styles.searchResults}>
          <h3 className={styles.resultsTitle}>
            📊 Resultados para {searchPeriodo === 'dia' ? 'el día' : searchPeriodo === 'semana' ? 'la semana' : 'el mes'} seleccionado
          </h3>
          <div className={styles.chartsContainer}>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Fase 1 (Histórico)</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={searchDatos} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
                  <XAxis dataKey={searchXAxisKey} stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" domain={[0, 250]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(20, 20, 30, 0.95)', 
                      borderColor: '#00ff9d',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }} 
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    formatter={(value) => [<span style={{ color: '#00ff9d' }}>{value} V</span>, 'Voltaje']}
                  />
                  <Line type="monotone" dataKey="1" stroke="#00ff9d" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Fase 2 (Histórico)</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={searchDatos} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
                  <XAxis dataKey={searchXAxisKey} stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" domain={[0, 250]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(20, 20, 30, 0.95)', 
                      borderColor: '#ffaa00',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }} 
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    formatter={(value) => [<span style={{ color: '#ffaa00' }}>{value} V</span>, 'Voltaje']}
                  />
                  <Line type="monotone" dataKey="2" stroke="#ffaa00" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h2 className={styles.chartTitle}>Fase 3 (Histórico)</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={searchDatos} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
                  <XAxis dataKey={searchXAxisKey} stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" domain={[0, 250]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(20, 20, 30, 0.95)', 
                      borderColor: '#ff6b6b',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }} 
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    formatter={(value) => [<span style={{ color: '#ff6b6b' }}>{value} V</span>, 'Voltaje']}
                  />
                  <Line type="monotone" dataKey="3" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}