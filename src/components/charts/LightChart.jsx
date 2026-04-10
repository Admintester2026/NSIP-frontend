// src/components/charts/LightChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==========================================
// FUNCIONES DE VALIDACIÓN
// ==========================================

function esFechaValida(fechaStr) {
  if (!fechaStr) return false;
  
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const mes = parseInt(match[2]);
    const dia = parseInt(match[3]);
    if (mes === 0 || dia === 0) return false;
  }
  
  try {
    const fecha = new Date(fechaStr);
    return !isNaN(fecha.getTime());
  } catch {
    return false;
  }
}

// ==========================================
// FUNCIONES DE GENERACIÓN DE DATOS
// ==========================================

// Función para generar todos los puntos de un día (00:00 a 23:59)
function generarDiaCompleto(data) {
  if (!data || data.length === 0) return [];
  
  // Filtrar solo datos con fechas válidas
  const datosValidos = data.filter(item => {
    if (!item?.FECHA) return false;
    return esFechaValida(item.FECHA);
  });
  
  if (datosValidos.length === 0) return [];
  
  // Obtener la fecha más reciente
  const fechas = datosValidos.map(item => new Date(item.FECHA)).filter(d => !isNaN(d.getTime()));
  if (fechas.length === 0) return [];
  
  const fechaBase = new Date(Math.max(...fechas));
  const horas = Array.from({ length: 24 }, (_, i) => i);
  const dataMap = new Map();
  
  datosValidos.forEach(item => {
    try {
      const fechaItem = new Date(item.FECHA);
      if (!isNaN(fechaItem.getTime())) {
        const hora = fechaItem.getUTCHours();
        const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
        dataMap.set(hora, valor);
      }
    } catch (e) {
      console.warn('Error procesando fecha:', item.FECHA);
    }
  });
  
  return horas.map(hora => {
    const valor = dataMap.has(hora) ? dataMap.get(hora) : 0;
    return {
      hora: `${hora.toString().padStart(2, '0')}:00`,
      LUZ: valor,
      tieneDato: dataMap.has(hora),
      horaNumero: hora
    };
  });
}

// Función para generar días de la semana (PROMEDIO)
function generarSemanaCompleta(data) {
  if (!data || data.length === 0) return [];
  
  // Filtrar solo datos con fechas válidas
  const datosValidos = data.filter(item => {
    if (!item?.FECHA) return false;
    return esFechaValida(item.FECHA);
  });
  
  if (datosValidos.length === 0) return [];
  
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dataPorDia = new Map();
  const diasMap = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
  
  diasSemana.forEach(dia => dataPorDia.set(dia, []));
  
  datosValidos.forEach(item => {
    try {
      const fecha = new Date(item.FECHA);
      if (!isNaN(fecha.getTime())) {
        const diaIdx = fecha.getUTCDay();
        const diaNombre = diasMap[diaIdx];
        const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
        
        if (dataPorDia.has(diaNombre)) {
          dataPorDia.get(diaNombre).push(valor);
        }
      }
    } catch (e) {
      console.warn('Error procesando fecha:', item.FECHA);
    }
  });
  
  return diasSemana.map(dia => {
    const valores = dataPorDia.get(dia) || [];
    const promedio = valores.length > 0 
      ? valores.reduce((a, b) => a + b, 0) / valores.length 
      : 0;
    const redondeado = Math.round(promedio * 10) / 10;
    
    return {
      dia: dia.substring(0, 3),
      LUZ: redondeado,
      registros: valores.length,
      esPromedio: true,
      valorOriginal: promedio
    };
  });
}

// Función para generar semanas del mes (PROMEDIO)
function generarMesCompleto(data) {
  if (!data || data.length === 0) return [];
  
  // Filtrar solo datos con fechas válidas
  const datosValidos = data.filter(item => {
    if (!item?.FECHA) return false;
    return esFechaValida(item.FECHA);
  });
  
  if (datosValidos.length === 0) return [];
  
  const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];
  const dataPorSemana = new Map();
  
  semanas.forEach(semana => dataPorSemana.set(semana, []));
  
  datosValidos.forEach(item => {
    try {
      const fecha = new Date(item.FECHA);
      if (!isNaN(fecha.getTime())) {
        const dia = fecha.getUTCDate();
        const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
        
        let numSemana;
        if (dia <= 7) numSemana = 1;
        else if (dia <= 14) numSemana = 2;
        else if (dia <= 21) numSemana = 3;
        else if (dia <= 28) numSemana = 4;
        else numSemana = 5;
        
        const semana = `Semana ${numSemana}`;
        if (dataPorSemana.has(semana)) {
          dataPorSemana.get(semana).push(valor);
        }
      }
    } catch (e) {
      console.warn('Error procesando fecha:', item.FECHA);
    }
  });
  
  return semanas.map((semana, idx) => {
    const valores = dataPorSemana.get(semana) || [];
    const promedio = valores.length > 0 
      ? valores.reduce((a, b) => a + b, 0) / valores.length 
      : 0;
    const redondeado = Math.round(promedio * 10) / 10;
    
    return {
      semana: `S${idx + 1}`,
      LUZ: redondeado,
      registros: valores.length,
      esPromedio: true,
      valorOriginal: promedio
    };
  });
}

// ==========================================
// COMPONENTES DE PUNTO Y TOOLTIP
// ==========================================

const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  const key = `dot-${index}-${payload.hora || payload.dia || payload.semana}`;
  
  if (payload.tieneDato === false) {
    return <circle key={key} cx={cx} cy={cy} r={3} fill="var(--amber)" stroke="none" />;
  }
  if (payload.registros === 0) {
    return <circle key={key} cx={cx} cy={cy} r={2} fill="var(--text-muted)" stroke="none" />;
  }
  if (payload.esPromedio) {
    return <circle key={key} cx={cx} cy={cy} r={5} fill="var(--amber)" stroke="var(--green)" strokeWidth={2} />;
  }
  return <circle key={key} cx={cx} cy={cy} r={4} fill="#00ff9d" stroke="none" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-dim)',
        borderRadius: 'var(--r-md)',
        padding: '0.75rem',
        color: 'var(--text-primary)',
        maxWidth: '250px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '0.25rem' }}>{label}</p>
        
        {dataPoint.esPromedio && (
          <p style={{ margin: 0, color: 'var(--amber)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            ⚡ Valor promedio
          </p>
        )}
        
        <p style={{ margin: 0, color: 'var(--green)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Luz: {typeof dataPoint.LUZ === 'number' ? dataPoint.LUZ.toFixed(1) : dataPoint.LUZ} lux
        </p>
        
        {dataPoint.registros !== undefined && dataPoint.registros > 0 && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Basado en {dataPoint.registros} {dataPoint.registros === 1 ? 'registro' : 'registros'}
          </p>
        )}
        
        {dataPoint.tieneDato !== undefined && !dataPoint.tieneDato && (
          <p style={{ margin: 0, color: 'var(--amber)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            ⚠️ Sin datos en este horario
          </p>
        )}
      </div>
    );
  }
  return null;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function LightChart({ data, periodo = 'dia' }) {
  // Validar datos de entrada
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No hay datos disponibles para mostrar
      </div>
    );
  }

  // Verificar si hay datos válidos (con fechas válidas)
  const datosValidos = data.filter(item => {
    if (!item?.FECHA) return false;
    return esFechaValida(item.FECHA);
  });

  if (datosValidos.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No hay datos con fechas válidas para mostrar
      </div>
    );
  }

  // Procesar datos según el período
  let chartData = [];
  let dataKey = '';
  let xAxisLabel = '';
  let showAverageNote = false;
  
  if (periodo === 'dia') {
    chartData = generarDiaCompleto(datosValidos);
    dataKey = 'hora';
    xAxisLabel = 'Hora del día';
    showAverageNote = false;
  } else if (periodo === 'semana') {
    chartData = generarSemanaCompleta(datosValidos);
    dataKey = 'dia';
    xAxisLabel = 'Día de la semana';
    showAverageNote = true;
  } else {
    chartData = generarMesCompleto(datosValidos);
    dataKey = 'semana';
    xAxisLabel = 'Semana del mes';
    showAverageNote = true;
  }

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No se pudieron generar datos para la gráfica
      </div>
    );
  }

  return (
    <div>
      {showAverageNote && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          background: 'rgba(255, 179, 64, 0.1)',
          border: '1px solid var(--amber)',
          borderRadius: 'var(--r-md)',
          color: 'var(--amber)',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span>
            <strong>Valores promedio:</strong> Los datos mostrados son promedios por {periodo === 'semana' ? 'día de la semana' : 'semana del mes'}
          </span>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey={dataKey}
            stroke="#6c757d"
            tick={{ fill: '#6c757d', fontSize: 12 }}
            label={{ value: xAxisLabel, position: 'insideBottom', offset: -5, fill: '#6c757d' }}
          />
          <YAxis 
            stroke="#6c757d"
            tick={{ fill: '#6c757d', fontSize: 12 }}
            label={{ value: 'Luz (lux)', angle: -90, position: 'insideLeft', fill: '#6c757d' }}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ color: 'var(--text-secondary)' }}
            formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
          />
          <Line 
            type="monotone" 
            dataKey="LUZ" 
            stroke="#00ff9d" 
            dot={<CustomDot />}
            activeDot={{ r: 8, stroke: '#00ff9d', strokeWidth: 2 }}
            name={periodo === 'dia' ? 'Luz (lux)' : 'Luz promedio (lux)'}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}