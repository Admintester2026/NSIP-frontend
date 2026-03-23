import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { voltajeAPI } from '../../api/voltaje';
import { usePolling } from '../../hooks/useAsync';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import styles from './VoltajeGraficas.module.css';

export default function VoltajeGraficas() {
  const [periodo, setPeriodo] = useState('dia'); // dia, semana, mes
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorico = useCallback(() => voltajeAPI.getHistorico(1000), []);
  const { data, error } = usePolling(fetchHistorico, 60000);

  useEffect(() => {
    if (data) {
      procesarDatos(data, periodo);
    }
  }, [data, periodo]);

  const procesarDatos = (datosCrudos, periodoSeleccionado) => {
    if (!datosCrudos || datosCrudos.length === 0) return;

    if (periodoSeleccionado === 'dia') {
      // Filtrar solo hoy y agrupar por hora
      const hoy = new Date();
      const fechaHoy = `${hoy.getFullYear()}/${(hoy.getMonth()+1).toString().padStart(2,'0')}/${hoy.getDate().toString().padStart(2,'0')}`;
      
      const datosHoy = datosCrudos.filter(item => {
        const itemFecha = formatDateOnly(item.FECHA);
        return itemFecha === fechaHoy;
      });

      // Crear array con 24 horas
      const horas = Array.from({ length: 24 }, (_, i) => ({
        hora: i,
        R: 0,
        S: 0,
        T: 0,
        count: 0
      }));

      datosHoy.forEach(item => {
        const fecha = new Date(item.FECHA);
        const hora = fecha.getHours();
        horas[hora].R += item.V_R || 0;
        horas[hora].S += item.V_S || 0;
        horas[hora].T += item.V_T || 0;
        horas[hora].count += 1;
      });

      // Calcular promedios
      const datosGrafica = horas.map(h => ({
        hora: `${h.hora}:00`,
        R: h.count > 0 ? (h.R / h.count).toFixed(1) : 0,
        S: h.count > 0 ? (h.S / h.count).toFixed(1) : 0,
        T: h.count > 0 ? (h.T / h.count).toFixed(1) : 0
      }));

      setDatos(datosGrafica);
    } 
    else if (periodoSeleccionado === 'semana') {
      // Agrupar por día de la semana (últimos 7 días)
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const datosSemana = [];

      for (let i = 6; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        const fechaStr = `${fecha.getFullYear()}/${(fecha.getMonth()+1).toString().padStart(2,'0')}/${fecha.getDate().toString().padStart(2,'0')}`;
        
        const datosDia = datosCrudos.filter(item => {
          const itemFecha = formatDateOnly(item.FECHA);
          return itemFecha === fechaStr;
        });

        if (datosDia.length > 0) {
          const sumR = datosDia.reduce((acc, curr) => acc + (curr.V_R || 0), 0);
          const sumS = datosDia.reduce((acc, curr) => acc + (curr.V_S || 0), 0);
          const sumT = datosDia.reduce((acc, curr) => acc + (curr.V_T || 0), 0);
          
          datosSemana.push({
            dia: diasSemana[fecha.getDay()],
            R: (sumR / datosDia.length).toFixed(1),
            S: (sumS / datosDia.length).toFixed(1),
            T: (sumT / datosDia.length).toFixed(1)
          });
        } else {
          datosSemana.push({
            dia: diasSemana[fecha.getDay()],
            R: 0,
            S: 0,
            T: 0
          });
        }
      }
      setDatos(datosSemana);
    }
    else if (periodoSeleccionado === 'mes') {
      // Agrupar por semana del mes
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
          const itemFecha = new Date(item.FECHA);
          return itemFecha >= inicioSemana && itemFecha <= finSemana;
        });

        if (datosSemana.length > 0) {
          const sumR = datosSemana.reduce((acc, curr) => acc + (curr.V_R || 0), 0);
          const sumS = datosSemana.reduce((acc, curr) => acc + (curr.V_S || 0), 0);
          const sumT = datosSemana.reduce((acc, curr) => acc + (curr.V_T || 0), 0);
          
          datosMes.push({
            semana: semanas[semana],
            R: (sumR / datosSemana.length).toFixed(1),
            S: (sumS / datosSemana.length).toFixed(1),
            T: (sumT / datosSemana.length).toFixed(1)
          });
        } else {
          datosMes.push({
            semana: semanas[semana],
            R: 0,
            S: 0,
            T: 0
          });
        }
      }
      setDatos(datosMes);
    }
    setLoading(false);
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return '--/--/----';
    const fecha = new Date(isoString);
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    return `${año}/${mes}/${dia}`;
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
            <Line type="monotone" dataKey="R" stroke="#00ff9d" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="S" stroke="#00cc7a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="T" stroke="#009955" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfica de áreas (apiladas) */}
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
            <Area type="monotone" dataKey="R" stackId="1" stroke="#00ff9d" fill="#00ff9d" fillOpacity={0.3} />
            <Area type="monotone" dataKey="S" stackId="1" stroke="#00cc7a" fill="#00cc7a" fillOpacity={0.3} />
            <Area type="monotone" dataKey="T" stackId="1" stroke="#009955" fill="#009955" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}