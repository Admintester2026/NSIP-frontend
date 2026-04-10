import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getFullYear() > 2000;
}

function getLocalDate(utcDateString) {
  // Convertir UTC a local (México GMT-6)
  const date = new Date(utcDateString);
  return new Date(date.getTime() - (6 * 60 * 60 * 1000));
}

// ==========================================
// GRÁFICA DE DÍA - Mostrar datos hora por hora del día actual
// ==========================================
function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
  // Filtrar datos del día actual
  const ahora = new Date();
  const hoyLocal = new Date(ahora.getTime() - (6 * 60 * 60 * 1000));
  const año = hoyLocal.getFullYear();
  const mes = hoyLocal.getMonth();
  const dia = hoyLocal.getDate();
  
  const datosDelDia = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fechaLocal = getLocalDate(item.FECHA);
    return fechaLocal.getFullYear() === año &&
           fechaLocal.getMonth() === mes &&
           fechaLocal.getDate() === dia;
  });
  
  if (datosDelDia.length === 0) return [];
  
  // Ordenar por hora
  datosDelDia.sort((a, b) => new Date(a.FECHA) - new Date(b.FECHA));
  
  // Crear mapa de hora -> último valor de esa hora
  const dataMap = new Map();
  datosDelDia.forEach(item => {
    const fechaLocal = getLocalDate(item.FECHA);
    const hora = fechaLocal.getHours();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    dataMap.set(hora, valor);
  });
  
  // Generar todas las horas (0-23)
  const horas = Array.from({ length: 24 }, (_, i) => i);
  
  return horas.map(hora => ({
    hora: `${hora.toString().padStart(2, '0')}:00`,
    LUZ: dataMap.has(hora) ? dataMap.get(hora) : null,
    tieneDato: dataMap.has(hora)
  }));
}

// ==========================================
// GRÁFICA DE SEMANA - Promedio por día de la semana (Lunes a Domingo)
// ==========================================
function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
  // Filtrar datos de la semana actual
  const ahora = new Date();
  const hoyLocal = new Date(ahora.getTime() - (6 * 60 * 60 * 1000));
  
  // Calcular inicio de semana (Lunes)
  const diaSemana = hoyLocal.getDay(); // 0 = Domingo, 1 = Lunes, ...
  let inicioSemana = new Date(hoyLocal);
  if (diaSemana === 0) {
    inicioSemana.setDate(hoyLocal.getDate() - 6);
  } else {
    inicioSemana.setDate(hoyLocal.getDate() - (diaSemana - 1));
  }
  inicioSemana.setHours(0, 0, 0, 0);
  
  // Calcular fin de semana (Domingo)
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  const datosSemana = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fechaLocal = getLocalDate(item.FECHA);
    return fechaLocal >= inicioSemana && fechaLocal <= finSemana;
  });
  
  if (datosSemana.length === 0) return [];
  
  // Agrupar por día de semana
  const diasMap = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
    5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
  };
  
  const datosPorDia = new Map();
  for (let i = 1; i <= 7; i++) {
    const diaNombre = i === 7 ? 'Domingo' : diasMap[i];
    datosPorDia.set(diaNombre, []);
  }
  
  datosSemana.forEach(item => {
    const fechaLocal = getLocalDate(item.FECHA);
    let diaNum = fechaLocal.getDay();
    const diaNombre = diasMap[diaNum];
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    
    if (datosPorDia.has(diaNombre)) {
      datosPorDia.get(diaNombre).push(valor);
    }
  });
  
  // Calcular promedios
  const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  return ordenDias.map(dia => {
    const valores = datosPorDia.get(dia) || [];
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

// ==========================================
// GRÁFICA DE MES - Promedio por semana del mes
// ==========================================
function generarDatosMes(data) {
  if (!data || data.length === 0) return [];
  
  // Filtrar datos del mes actual
  const ahora = new Date();
  const hoyLocal = new Date(ahora.getTime() - (6 * 60 * 60 * 1000));
  const año = hoyLocal.getFullYear();
  const mes = hoyLocal.getMonth();
  
  const datosMes = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fechaLocal = getLocalDate(item.FECHA);
    return fechaLocal.getFullYear() === año && fechaLocal.getMonth() === mes;
  });
  
  if (datosMes.length === 0) return [];
  
  // Agrupar por semana del mes (1-5)
  const datosPorSemana = new Map();
  for (let i = 1; i <= 5; i++) {
    datosPorSemana.set(i, []);
  }
  
  datosMes.forEach(item => {
    const fechaLocal = getLocalDate(item.FECHA);
    const dia = fechaLocal.getDate();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    
    let numSemana;
    if (dia <= 7) numSemana = 1;
    else if (dia <= 14) numSemana = 2;
    else if (dia <= 21) numSemana = 3;
    else if (dia <= 28) numSemana = 4;
    else numSemana = 5;
    
    datosPorSemana.get(numSemana).push(valor);
  });
  
  // Calcular promedios
  return [1, 2, 3, 4, 5].map(num => {
    const valores = datosPorSemana.get(num) || [];
    const promedio = valores.length > 0 
      ? valores.reduce((a, b) => a + b, 0) / valores.length 
      : 0;
    
    return {
      semana: `S${num}`,
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
  const key = `dot-${index}`;
  
  if (payload.LUZ === null || payload.LUZ === undefined) {
    return null;
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
        borderRadius: '8px',
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
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
            Basado en {dataPoint.registros} {dataPoint.registros === 1 ? 'registro' : 'registros'}
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
  // Validar datos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        📭 No hay datos disponibles
      </div>
    );
  }

  // Filtrar solo fechas válidas
  const datosValidos = data.filter(item => isValidDate(item.FECHA));
  
  if (datosValidos.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        ⚠️ No hay datos con fechas válidas
      </div>
    );
  }

  // Generar datos según período
  let chartData = [];
  let dataKey = '';
  let xAxisLabel = '';
  
  if (periodo === 'dia') {
    chartData = generarDatosDia(datosValidos);
    dataKey = 'hora';
    xAxisLabel = 'Hora del día';
  } else if (periodo === 'semana') {
    chartData = generarDatosSemana(datosValidos);
    dataKey = 'dia';
    xAxisLabel = 'Día de la semana';
  } else {
    chartData = generarDatosMes(datosValidos);
    dataKey = 'semana';
    xAxisLabel = 'Semana del mes';
  }

  // Verificar si hay datos para mostrar
  const hasData = chartData.some(item => item.LUZ !== null && item.LUZ !== undefined && item.LUZ > 0);
  
  if (!hasData) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        📊 No hay datos suficientes para el período seleccionado
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
          borderRadius: '8px',
          color: 'var(--amber)',
          fontSize: '0.85rem'
        }}>
          <span>📊</span>
          <span>
            <strong>Valores promedio:</strong> Datos agrupados por {periodo === 'semana' ? 'día de la semana' : 'semana del mes'}
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
          <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
          <Line 
            type="monotone" 
            dataKey="LUZ" 
            stroke="#00ff9d" 
            dot={<CustomDot />}
            activeDot={{ r: 8 }}
            name={periodo === 'dia' ? 'Luz (lux)' : 'Luz promedio (lux)'}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}