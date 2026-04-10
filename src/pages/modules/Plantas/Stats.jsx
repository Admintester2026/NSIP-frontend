// src/components/charts/LightChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==========================================
// UTILIDADES
// ==========================================

function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getFullYear() > 2000;
}

function formatHora(hora) {
  return `${hora.toString().padStart(2, '0')}:00`;
}

// ==========================================
// GRÁFICA DE DÍA - Datos del día actual
// ==========================================
function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  const diaActual = ahoraLocal.getDate();
  
  const datosDelDia = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fecha = new Date(item.FECHA);
    return fecha.getFullYear() === añoActual &&
           fecha.getMonth() === mesActual &&
           fecha.getDate() === diaActual;
  });
  
  if (datosDelDia.length === 0) return [];
  
  const dataPorHora = new Map();
  datosDelDia.forEach(item => {
    const fecha = new Date(item.FECHA);
    const hora = fecha.getHours();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    if (!dataPorHora.has(hora)) dataPorHora.set(hora, { suma: 0, count: 0 });
    const grupo = dataPorHora.get(hora);
    grupo.suma += valor;
    grupo.count++;
  });
  
  const horas = Array.from({ length: 24 }, (_, i) => i);
  return horas.map(hora => {
    const grupo = dataPorHora.get(hora);
    let valor = null;
    if (grupo && grupo.count > 0) valor = grupo.suma / grupo.count;
    return { hora: formatHora(hora), LUZ: valor, tieneDato: grupo?.count > 0 };
  });
}

// ==========================================
// GRÁFICA DE SEMANA - TODOS los días de la semana (Lunes a Domingo)
// Incluye la semana actual COMPLETA
// ==========================================
function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const diaSemanaActual = ahoraLocal.getDay();
  
  // Calcular inicio de semana (Lunes)
  let inicioSemana = new Date(ahoraLocal);
  if (diaSemanaActual === 0) {
    inicioSemana.setDate(ahoraLocal.getDate() - 6);
  } else {
    inicioSemana.setDate(ahoraLocal.getDate() - (diaSemanaActual - 1));
  }
  inicioSemana.setHours(0, 0, 0, 0);
  
  // Calcular fin de semana (Domingo)
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  console.log(`📅 Semana: ${inicioSemana.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`);
  
  // Filtrar datos de la semana actual
  const datosSemana = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fecha = new Date(item.FECHA);
    return fecha >= inicioSemana && fecha <= finSemana;
  });
  
  console.log(`📊 Datos semana: ${datosSemana.length} registros`);
  
  if (datosSemana.length === 0) return [];
  
  const diasMap = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
  const datosPorDia = new Map();
  const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  ordenDias.forEach(dia => datosPorDia.set(dia, { suma: 0, count: 0 }));
  
  datosSemana.forEach(item => {
    const fecha = new Date(item.FECHA);
    const diaNombre = diasMap[fecha.getDay()];
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    if (datosPorDia.has(diaNombre)) {
      const grupo = datosPorDia.get(diaNombre);
      grupo.suma += valor;
      grupo.count++;
    }
  });
  
  return ordenDias.map(dia => {
    const grupo = datosPorDia.get(dia);
    const promedio = grupo.count > 0 ? grupo.suma / grupo.count : 0;
    const registros = grupo.count;
    return { 
      dia: dia.substring(0, 3), 
      LUZ: Math.round(promedio * 10) / 10, 
      registros: registros,
      tieneDatos: registros > 0
    };
  });
}

// ==========================================
// GRÁFICA DE MES - TODAS las semanas del mes (Semana 1 a Semana 5)
// ==========================================
function generarDatosMes(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  
  // Obtener el primer día del mes
  const primerDiaMes = new Date(añoActual, mesActual, 1);
  const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0);
  
  console.log(`📅 Mes: ${primerDiaMes.toLocaleDateString()} - ${ultimoDiaMes.toLocaleDateString()}`);
  
  // Filtrar datos del mes actual
  const datosMes = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fecha = new Date(item.FECHA);
    return fecha.getFullYear() === añoActual && fecha.getMonth() === mesActual;
  });
  
  console.log(`📊 Datos mes: ${datosMes.length} registros`);
  
  if (datosMes.length === 0) return [];
  
  // Inicializar datos por semana (1-5)
  const datosPorSemana = new Map();
  for (let i = 1; i <= 5; i++) {
    datosPorSemana.set(i, { suma: 0, count: 0 });
  }
  
  datosMes.forEach(item => {
    const fecha = new Date(item.FECHA);
    const dia = fecha.getDate();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    
    let numSemana;
    if (dia <= 7) numSemana = 1;
    else if (dia <= 14) numSemana = 2;
    else if (dia <= 21) numSemana = 3;
    else if (dia <= 28) numSemana = 4;
    else numSemana = 5;
    
    const grupo = datosPorSemana.get(numSemana);
    grupo.suma += valor;
    grupo.count++;
  });
  
  return [1, 2, 3, 4, 5].map(num => {
    const grupo = datosPorSemana.get(num);
    const promedio = grupo.count > 0 ? grupo.suma / grupo.count : 0;
    return { 
      semana: `S${num}`, 
      LUZ: Math.round(promedio * 10) / 10, 
      registros: grupo.count,
      tieneDatos: grupo.count > 0
    };
  });
}

// ==========================================
// COMPONENTE DE PUNTO PERSONALIZADO
// ==========================================
const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  const key = `dot-${index}`;
  
  // Si no hay datos, no mostrar punto
  if (payload.LUZ === null || payload.LUZ === undefined) return null;
  if (payload.registros === 0) return null;
  
  // Puntos AMARILLOS (no verdes)
  return <circle key={key} cx={cx} cy={cy} r={4} fill="#FFB300" stroke="none" />;
};

// ==========================================
// COMPONENTE DE TOOLTIP PERSONALIZADO
// ==========================================
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const valorLuz = dataPoint.LUZ !== null && dataPoint.LUZ !== undefined 
      ? (typeof dataPoint.LUZ === 'number' ? dataPoint.LUZ.toFixed(1) : dataPoint.LUZ)
      : 'Sin datos';
    
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #00ff9d',
        borderRadius: '8px',
        padding: '0.75rem',
        color: '#ffffff',
        maxWidth: '250px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '0.25rem', color: '#00ff9d' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '1rem', color: '#FFB300' }}>
          Luz: {valorLuz} lux
        </p>
        {dataPoint.registros !== undefined && dataPoint.registros > 0 && (
          <p style={{ margin: 0, color: '#888888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            📊 {dataPoint.registros} {dataPoint.registros === 1 ? 'registro' : 'registros'}
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
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>📭 No hay datos disponibles</div>;
  }

  let chartData = [];
  let dataKey = '';
  let xAxisLabel = '';
  let chartName = '';
  
  if (periodo === 'dia') {
    chartData = generarDatosDia(data);
    dataKey = 'hora';
    xAxisLabel = 'Hora del día';
    chartName = 'Luz (lux)';
  } else if (periodo === 'semana') {
    chartData = generarDatosSemana(data);
    dataKey = 'dia';
    xAxisLabel = 'Día de la semana';
    chartName = 'Luz promedio (lux)';
  } else {
    chartData = generarDatosMes(data);
    dataKey = 'semana';
    xAxisLabel = 'Semana del mes';
    chartName = 'Luz promedio (lux)';
  }

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>📊 No hay datos para el período seleccionado</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey={dataKey}
          stroke="#888"
          tick={{ fill: '#888', fontSize: 12 }}
          label={{ value: xAxisLabel, position: 'insideBottom', offset: -5, fill: '#888' }}
        />
        <YAxis 
          stroke="#888"
          tick={{ fill: '#888', fontSize: 12 }}
          label={{ value: 'Luz (lux)', angle: -90, position: 'insideLeft', fill: '#888' }}
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ color: '#888' }}
          formatter={(value) => <span style={{ color: '#888' }}>{value}</span>}
        />
        <Line 
          type="monotone" 
          dataKey="LUZ" 
          stroke="#00ff9d"
          strokeWidth={2.5}
          dot={<CustomDot />}
          activeDot={{ r: 6, stroke: '#00ff9d', strokeWidth: 2 }}
          name={chartName}
          connectNulls={true}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}