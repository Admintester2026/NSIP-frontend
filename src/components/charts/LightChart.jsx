// src/components/charts/LightChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function formatHora(hora) {
  return `${hora.toString().padStart(2, '0')}:00`;
}

function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  const diaActual = ahoraLocal.getDate();
  
  console.log(`📅 Día actual: ${añoActual}/${mesActual + 1}/${diaActual}`);
  
  const datosDelDia = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fecha = new Date(item.FECHA);
    return fecha.getFullYear() === añoActual &&
           fecha.getMonth() === mesActual &&
           fecha.getDate() === diaActual;
  });
  
  console.log(`📊 Datos del día: ${datosDelDia.length} registros`);
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

function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const diaSemanaActual = ahoraLocal.getDay();
  let inicioSemana = new Date(ahoraLocal);
  if (diaSemanaActual === 0) inicioSemana.setDate(ahoraLocal.getDate() - 6);
  else inicioSemana.setDate(ahoraLocal.getDate() - (diaSemanaActual - 1));
  inicioSemana.setHours(0, 0, 0, 0);
  
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  const datosSemana = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fecha = new Date(item.FECHA);
    return fecha >= inicioSemana && fecha <= finSemana;
  });
  
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
    return { dia: dia.substring(0, 3), LUZ: Math.round(promedio * 10) / 10, registros: grupo.count, esPromedio: true };
  });
}

function generarDatosMes(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  
  const datosMes = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fecha = new Date(item.FECHA);
    return fecha.getFullYear() === añoActual && fecha.getMonth() === mesActual;
  });
  
  if (datosMes.length === 0) return [];
  
  const datosPorSemana = new Map();
  for (let i = 1; i <= 5; i++) datosPorSemana.set(i, { suma: 0, count: 0 });
  
  datosMes.forEach(item => {
    const fecha = new Date(item.FECHA);
    const dia = fecha.getDate();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    let numSemana = dia <= 7 ? 1 : dia <= 14 ? 2 : dia <= 21 ? 3 : dia <= 28 ? 4 : 5;
    const grupo = datosPorSemana.get(numSemana);
    grupo.suma += valor;
    grupo.count++;
  });
  
  return [1, 2, 3, 4, 5].map(num => {
    const grupo = datosPorSemana.get(num);
    const promedio = grupo.count > 0 ? grupo.suma / grupo.count : 0;
    return { semana: `S${num}`, LUZ: Math.round(promedio * 10) / 10, registros: grupo.count, esPromedio: true };
  });
}

const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  if (payload.LUZ === null || payload.LUZ === undefined) return null;
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill="#00ff9d" stroke="none" />;
};

export default function LightChart({ data, periodo = 'dia' }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>📭 No hay datos disponibles</div>;
  }

  let chartData = [], dataKey = '', xAxisLabel = '';
  if (periodo === 'dia') { chartData = generarDatosDia(data); dataKey = 'hora'; xAxisLabel = 'Hora del día'; }
  else if (periodo === 'semana') { chartData = generarDatosSemana(data); dataKey = 'dia'; xAxisLabel = 'Día de la semana'; }
  else { chartData = generarDatosMes(data); dataKey = 'semana'; xAxisLabel = 'Semana del mes'; }

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>📊 No hay datos para el período seleccionado</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey={dataKey} stroke="#6c757d" tick={{ fill: '#6c757d', fontSize: 12 }} label={{ value: xAxisLabel, position: 'insideBottom', offset: -5, fill: '#6c757d' }} />
        <YAxis stroke="#6c757d" tick={{ fill: '#6c757d', fontSize: 12 }} label={{ value: 'Luz (lux)', angle: -90, position: 'insideLeft', fill: '#6c757d' }} domain={[0, 'auto']} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="LUZ" stroke="#00ff9d" strokeWidth={2} dot={<CustomDot />} name={periodo === 'dia' ? 'Luz (lux)' : 'Luz promedio (lux)'} connectNulls={true} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}