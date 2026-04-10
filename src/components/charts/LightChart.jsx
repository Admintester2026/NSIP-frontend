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
    if (mes > 12 || dia > 31) return false;
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

// Para DÍA: mostrar valores por hora (datos reales, no promedios)
function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
  // Filtrar datos válidos
  const datosValidos = data.filter(item => {
    if (!item?.FECHA) return false;
    if (!esFechaValida(item.FECHA)) return false;
    return true;
  });
  
  if (datosValidos.length === 0) return [];
  
  // Ordenar por fecha
  datosValidos.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
  
  // Crear mapa de hora -> valor (tomar el último valor de cada hora)
  const dataMap = new Map();
  
  datosValidos.forEach(item => {
    try {
      const fecha = new Date(item.FECHA);
      if (!isNaN(fecha.getTime())) {
        const hora = fecha.getUTCHours();
        const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
        dataMap.set(hora, valor);
      }
    } catch (e) {
      console.warn('Error procesando fecha:', item.FECHA);
    }
  });
  
  // Generar todas las horas del día (0-23)
  const horas = Array.from({ length: 24 }, (_, i) => i);
  
  return horas.map(hora => {
    const valor = dataMap.has(hora) ? dataMap.get(hora) : null;
    return {
      hora: `${hora.toString().padStart(2, '0')}:00`,
      LUZ: valor,
      tieneDato: dataMap.has(hora),
      horaNumero: hora
    };
  });
}

// Para SEMANA: agrupar por día de la semana (usando SOLO los datos recibidos)
function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
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
    
    return {
      dia: dia.substring(0, 3),
      LUZ: Math.round(promedio * 10) / 10,
      registros: valores.length,
      esPromedio: true
    };
  });
}

// Para MES: agrupar por semana del mes (usando SOLO los datos recibidos)
function generarDatosMes(data) {
  if (!data || data.length === 0) return [];
  
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
    
    return {
      semana: `S${idx + 1}`,
      LUZ: Math.round(promedio * 10) / 10,
      registros: valores.length,
      esPromedio: true
    };
  });
}

// ==========================================
// COMPONENTES DE PUNTO Y TOOLTIP
// ==========================================

const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  const key = `dot-${index}-${payload.hora || payload.dia || payload.semana}`;
  
  if (payload.LUZ === null || payload.LUZ === undefined) {
    return null;
  }
  if (payload.registros === 0) {
    return <circle key={key} cx={cx} cy={cy} r={3} fill="var(--amber)" stroke="none" />;
  }
  if (payload.esPromedio) {
    return <circle key={key} cx={cx} cy={cy} r={5} fill="var(--amber)" stroke="var(--green)" strokeWidth={2} />;
  }
  return <circle key={key} cx={cx} cy={cy} r={4} fill="#00ff9d" stroke="none" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const valorLuz = dataPoint.LUZ !== null && dataPoint.LUZ !== undefined 
      ? (typeof dataPoint.LUZ === 'number' ? dataPoint.LUZ.toFixed(1) : dataPoint.LUZ)
      : 'Sin datos';
    
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
            📊 Valor promedio
          </p>
        )}
        
        <p style={{ margin: 0, color: 'var(--green)', fontSize: '1rem', marginTop: '0.25rem' }}>
          Luz: {valorLuz} lux
        </p>
        
        {dataPoint.registros !== undefined && dataPoint.registros > 0 && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Basado en {dataPoint.registros} {dataPoint.registros === 1 ? 'registro' : 'registros'}
          </p>
        )}
        
        {dataPoint.LUZ === null && (
          <p style={{ margin: 0, color: 'var(--amber)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            ⚠️ Sin datos en este período
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
        📭 No hay datos disponibles para mostrar
      </div>
    );
  }

  // Verificar si hay datos con fechas válidas
  const datosConFechaValida = data.filter(item => {
    if (!item?.FECHA) return false;
    return esFechaValida(item.FECHA);
  });

  if (datosConFechaValida.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        ⚠️ No hay datos con fechas válidas para mostrar
      </div>
    );
  }

  // Procesar datos según el período
  let chartData = [];
  let dataKey = '';
  let xAxisLabel = '';
  
  if (periodo === 'dia') {
    chartData = generarDatosDia(datosConFechaValida);
    dataKey = 'hora';
    xAxisLabel = 'Hora del día';
  } else if (periodo === 'semana') {
    chartData = generarDatosSemana(datosConFechaValida);
    dataKey = 'dia';
    xAxisLabel = 'Día de la semana';
  } else {
    chartData = generarDatosMes(datosConFechaValida);
    dataKey = 'semana';
    xAxisLabel = 'Semana del mes';
  }

  // Verificar si hay datos para graficar
  const hasValidData = chartData.some(item => item.LUZ !== null && item.LUZ !== undefined && item.LUZ > 0);
  
  if (!hasValidData) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        📊 No hay datos suficientes para generar la gráfica en este período
      </div>
    );
  }

  return (
    <div>
      {periodo !== 'dia' && (
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