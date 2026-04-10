// src/components/charts/LightChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
  const ahora = new Date();
  const añoActual = ahora.getFullYear();
  const mesActual = ahora.getMonth();
  const diaActual = ahora.getDate();
  
  const datosDelDia = data.filter(item => {
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
    return { hora: `${hora.toString().padStart(2, '0')}:00`, LUZ: valor };
  });
}

function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
  const ahora = new Date();
  const diaSemana = ahora.getDay();
  let inicioSemana = new Date(ahora);
  if (diaSemana === 0) inicioSemana.setDate(ahora.getDate() - 6);
  else inicioSemana.setDate(ahora.getDate() - (diaSemana - 1));
  inicioSemana.setHours(0, 0, 0, 0);
  
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  const datosSemana = data.filter(item => {
    const fecha = new Date(item.FECHA);
    return fecha >= inicioSemana && fecha <= finSemana;
  });
  
  if (datosSemana.length === 0) return [];
  
  const diasMap = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
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
    return { dia: dia.substring(0, 3), LUZ: Math.round(promedio * 10) / 10, registros: grupo.count };
  });
}

function generarDatosMes(data) {
  if (!data || data.length === 0) return [];
  
  const ahora = new Date();
  const añoActual = ahora.getFullYear();
  const mesActual = ahora.getMonth();
  
  const datosMes = data.filter(item => {
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
    return { semana: `S${num}`, LUZ: Math.round(promedio * 10) / 10, registros: grupo.count };
  });
}

const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  if (payload.LUZ === null || payload.LUZ === undefined) return null;
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#FFB300" stroke="none" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #00ff9d', borderRadius: '8px', padding: '0.75rem', color: '#fff' }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#00ff9d' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '1rem', color: '#FFB300', marginTop: '0.25rem' }}>Luz: {dataPoint.LUZ?.toFixed(1)} lux</p>
        {dataPoint.registros > 0 && <p style={{ margin: 0, color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>📊 {dataPoint.registros} registros</p>}
      </div>
    );
  }
  return null;
};

export default function LightChart({ data, periodo = 'dia' }) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>📭 No hay datos disponibles</div>;
  }

  let chartData = [], dataKey = '';
  if (periodo === 'dia') { chartData = generarDatosDia(data); dataKey = 'hora'; }
  else if (periodo === 'semana') { chartData = generarDatosSemana(data); dataKey = 'dia'; }
  else { chartData = generarDatosMes(data); dataKey = 'semana'; }

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>📊 No hay datos para el período seleccionado</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey={dataKey} stroke="#888" tick={{ fill: '#888' }} />
        <YAxis stroke="#888" tick={{ fill: '#888' }} domain={[0, 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="LUZ" stroke="#00ff9d" strokeWidth={2.5} dot={<CustomDot />} name="Luz (lux)" connectNulls={true} />
      </LineChart>
    </ResponsiveContainer>
  );
}