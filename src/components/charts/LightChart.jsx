import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Función para generar todos los puntos de un día (00:00 a 23:59)
function generarDiaCompleto(data, fecha) {
  if (!data || data.length === 0) return [];
  
  const fechaBase = fecha || (data[0]?.FECHA ? new Date(data[0].FECHA) : new Date());
  const horas = Array.from({ length: 24 }, (_, i) => i);
  const dataMap = new Map();
  
  data.forEach(item => {
    const fechaItem = new Date(item.FECHA);
    const hora = fechaItem.getUTCHours();
    dataMap.set(hora, item.LUZ);
  });
  
  return horas.map(hora => {
    const fechaCompleta = new Date(fechaBase);
    fechaCompleta.setUTCHours(hora, 0, 0, 0);
    
    return {
      hora: `${hora.toString().padStart(2, '0')}:00`,
      LUZ: dataMap.has(hora) ? dataMap.get(hora) : 0,
      timestamp: fechaCompleta.toISOString(),
      tieneDato: dataMap.has(hora)
    };
  });
}

// Función para generar días de la semana (PROMEDIO)
function generarSemanaCompleta(data) {
  if (!data || data.length === 0) return [];
  
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const dataPorDia = new Map();
  const diasMap = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 
    5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
  };
  
  diasSemana.forEach(dia => dataPorDia.set(dia, []));
  
  data.forEach(item => {
    const fecha = new Date(item.FECHA);
    const diaIdx = fecha.getUTCDay(); // 0 = Domingo
    const diaNombre = diasMap[diaIdx];
    
    if (dataPorDia.has(diaNombre)) {
      dataPorDia.get(diaNombre).push(item.LUZ);
    }
  });
  
  return diasSemana.map(dia => {
    const valores = dataPorDia.get(dia) || [];
    const promedio = valores.length > 0 
      ? valores.reduce((a, b) => a + b, 0) / valores.length 
      : 0;
    const redondeado = Math.round(promedio * 10) / 10;
    
    return {
      dia: dia.substring(0, 3), // Lun, Mar, Mié, etc.
      LUZ: redondeado,
      registros: valores.length,
      esPromedio: true,
      valorOriginal: valores.length > 0 ? promedio : 0
    };
  });
}

// Función para generar semanas del mes (PROMEDIO)
function generarMesCompleto(data) {
  if (!data || data.length === 0) return [];
  
  const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];
  const dataPorSemana = new Map();
  
  semanas.forEach(semana => dataPorSemana.set(semana, []));
  
  data.forEach(item => {
    const fecha = new Date(item.FECHA);
    const dia = fecha.getUTCDate();
    
    let numSemana;
    if (dia <= 7) numSemana = 1;
    else if (dia <= 14) numSemana = 2;
    else if (dia <= 21) numSemana = 3;
    else if (dia <= 28) numSemana = 4;
    else numSemana = 5;
    
    const semana = `Semana ${numSemana}`;
    if (dataPorSemana.has(semana)) {
      dataPorSemana.get(semana).push(item.LUZ);
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
      valorOriginal: valores.length > 0 ? promedio : 0
    };
  });
}

// Componente de punto personalizado con KEY incluida
const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  
  if (payload.tieneDato === false) {
    return <circle key={`dot-${index}-${payload.hora || payload.dia || payload.semana}`} cx={cx} cy={cy} r={3} fill="var(--amber)" stroke="none" />;
  }
  if (payload.registros === 0) {
    return <circle key={`dot-${index}-${payload.hora || payload.dia || payload.semana}`} cx={cx} cy={cy} r={2} fill="var(--text-muted)" stroke="none" />;
  }
  // Puntos especiales para promedios
  if (payload.esPromedio) {
    return <circle key={`dot-${index}-${payload.hora || payload.dia || payload.semana}`} cx={cx} cy={cy} r={5} fill="var(--amber)" stroke="var(--green)" strokeWidth={2} />;
  }
  return <circle key={`dot-${index}-${payload.hora || payload.dia || payload.semana}`} cx={cx} cy={cy} r={4} fill="#00ff9d" stroke="none" />;
};

// Componente de tooltip personalizado con información de promedio
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
          Luz: {dataPoint.LUZ} lux
        </p>
        
        {dataPoint.registros !== undefined && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Basado en {dataPoint.registros} {dataPoint.registros === 1 ? 'registro' : 'registros'}
          </p>
        )}
        
        {dataPoint.tieneDato !== undefined && !dataPoint.tieneDato && (
          <p style={{ margin: 0, color: 'var(--amber)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            ⚠️ Sin datos en este horario
          </p>
        )}
        
        {dataPoint.esPromedio && dataPoint.valorOriginal && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem', borderTop: '1px dashed var(--border-dim)', paddingTop: '0.25rem' }}>
            Promedio calculado
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function LightChart({ data, periodo = 'dia' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No hay datos disponibles
      </div>
    );
  }

  // Procesar datos según el período
  let chartData = [];
  let dataKey = '';
  let xAxisLabel = '';
  let showAverageNote = false;
  
  if (periodo === 'dia') {
    chartData = generarDiaCompleto(data);
    dataKey = 'hora';
    xAxisLabel = 'Hora del día';
    showAverageNote = false;
  } else if (periodo === 'semana') {
    chartData = generarSemanaCompleta(data);
    dataKey = 'dia';
    xAxisLabel = 'Día de la semana';
    showAverageNote = true;
  } else {
    chartData = generarMesCompleto(data);
    dataKey = 'semana';
    xAxisLabel = 'Semana del mes';
    showAverageNote = true;
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
          background: 'var(--amber-dim)',
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
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