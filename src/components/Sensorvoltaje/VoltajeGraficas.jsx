import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { voltajeAPI } from '../../api/voltaje';
import { usePolling } from '../../hooks/useAsync';
import { formatDate } from '../../utils/dateUtils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import styles from './VoltajeGraficas.module.css';

export default function VoltajeGraficas() {
  const [periodo, setPeriodo] = useState('dia');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorico = useCallback(() => voltajeAPI.getHistorico(1000), []);
  const { data } = usePolling(fetchHistorico, 60000); // ← Eliminado 'error' no usado

  useEffect(() => {
    if (data) {
      procesarDatos(data, periodo);
    }
  }, [data, periodo]);

  const procesarDatos = (datosCrudos, periodoSeleccionado) => {
    if (!datosCrudos || datosCrudos.length === 0) {
      setLoading(false);
      return;
    }

    if (periodoSeleccionado === 'dia') {
      // Filtrar solo hoy
      const hoy = new Date();
      const fechaHoy = formatDate(hoy.toISOString());
      
      const datosHoy = datosCrudos.filter(item => {
        const itemFecha = formatDate(item.FECHA);
        return itemFecha === fechaHoy;
      });

      // Crear array con 24 horas
      const horas = Array.from({ length: 24 }, (_, i) => ({
        hora: `${i}:00`,
        '1': 0,
        '2': 0,
        '3': 0,
        count: 0
      }));

      datosHoy.forEach(item => {
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

      // Calcular promedios
      const datosGrafica = horas.map(h => ({
        hora: h.hora,
        '1': h.count > 0 ? (h['1'] / h.count).toFixed(1) : 0,
        '2': h.count > 0 ? (h['2'] / h.count).toFixed(1) : 0,
        '3': h.count > 0 ? (h['3'] / h.count).toFixed(1) : 0
      }));

      setDatos(datosGrafica);
    } 
    else if (periodoSeleccionado === 'semana') {
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const datosSemana = [];

      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = formatDate(fecha.toISOString());
        
        const datosDia = datosCrudos.filter(item => {
          const itemFecha = formatDate(item.FECHA);
          return itemFecha === fechaStr;
        });

        if (datosDia.length > 0) {
          const sum1 = datosDia.reduce((acc, curr) => acc + (curr.V_R || 0), 0);
          const sum2 = datosDia.reduce((acc, curr) => acc + (curr.V_S || 0), 0);
          const sum3 = datosDia.reduce((acc, curr) => acc + (curr.V_T || 0), 0);
          
          datosSemana.push({
            dia: diasSemana[fecha.getDay()],
            '1': (sum1 / datosDia.length).toFixed(1),
            '2': (sum2 / datosDia.length).toFixed(1),
            '3': (sum3 / datosDia.length).toFixed(1)
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
      setDatos(datosSemana);
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

        const datosSemana = datosCrudos.filter(item => {
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
            '1': (sum1 / datosSemana.length).toFixed(1),
            '2': (sum2 / datosSemana.length).toFixed(1),
            '3': (sum3 / datosSemana.length).toFixed(1)
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
      setDatos(datosMes);
    }
    setLoading(false);
  };

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
          <p className={styles.subtitle}>Visualización de datos</p>
        </div>
        <Link to="/modulos/voltaje" className={styles.backButton}>
          ← Volver
        </Link>
      </div>

      {/* Selector de período */}
      <div className={styles.periodSelector}>
        <button 
          className={`${styles.periodButton} ${periodo === 'dia' ? styles.active : ''}`}
          onClick={() => setPeriodo('dia')}
        >
          📅 Día
        </button>
        <button 
          className={`${styles.periodButton} ${periodo === 'semana' ? styles.active : ''}`}
          onClick={() => setPeriodo('semana')}
        >
          📊 Semana
        </button>
        <button 
          className={`${styles.periodButton} ${periodo === 'mes' ? styles.active : ''}`}
          onClick={() => setPeriodo('mes')}
        >
          📈 Mes
        </button>
      </div>

      {/* Gráfica de líneas */}
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>
          {periodo === 'dia' ? 'Comportamiento por hora (hoy)' : 
           periodo === 'semana' ? 'Promedio por día (semana actual)' : 
           'Promedio por semana (mes actual)'}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={datos} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
            <XAxis 
              dataKey={periodo === 'dia' ? 'hora' : periodo === 'semana' ? 'dia' : 'semana'} 
              stroke="var(--text-muted)"
            />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderColor: 'var(--border-dim)',
                color: 'var(--text-primary)'
              }} 
            />
            <Legend />
            <Line type="monotone" dataKey="1" stroke="#00ff9d" strokeWidth={2} dot={false} name="Fase 1" />
            <Line type="monotone" dataKey="2" stroke="#00cc7a" strokeWidth={2} dot={false} name="Fase 2" />
            <Line type="monotone" dataKey="3" stroke="#009955" strokeWidth={2} dot={false} name="Fase 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de áreas */}
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>Comparativa de fases</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={datos} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
            <XAxis 
              dataKey={periodo === 'dia' ? 'hora' : periodo === 'semana' ? 'dia' : 'semana'} 
              stroke="var(--text-muted)"
            />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-surface)', 
                borderColor: 'var(--border-dim)',
                color: 'var(--text-primary)'
              }} 
            />
            <Legend />
            <Area type="monotone" dataKey="1" stackId="1" stroke="#00ff9d" fill="#00ff9d" fillOpacity={0.3} name="Fase 1" />
            <Area type="monotone" dataKey="2" stackId="1" stroke="#00cc7a" fill="#00cc7a" fillOpacity={0.3} name="Fase 2" />
            <Area type="monotone" dataKey="3" stackId="1" stroke="#009955" fill="#009955" fillOpacity={0.3} name="Fase 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}