// src/components/charts/LightChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==========================================
// FUNCIÓN PARA CONVERTIR UTC A LOCAL (GMT-6)
// ==========================================
function convertirUtcALocal(utcDateString) {
  const fechaUTC = new Date(utcDateString);
  return new Date(fechaUTC.getTime() - (6 * 60 * 60 * 1000));
}

// ==========================================
// GRÁFICA DE DÍA - Datos del día actual en HORA LOCAL
// ==========================================
function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
  // Obtener fecha actual en LOCAL
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  const diaActual = ahoraLocal.getDate();
  
  console.log(`📅 Día actual (local): ${añoActual}/${mesActual + 1}/${diaActual}`);
  
  // Filtrar datos del día actual (convirtiendo cada fecha a local)
  const datosDelDia = data.filter(item => {
    if (!item?.FECHA) return false;
    const fechaLocal = convertirUtcALocal(item.FECHA);
    return fechaLocal.getFullYear() === añoActual &&
           fechaLocal.getMonth() === mesActual &&
           fechaLocal.getDate() === diaActual;
  });
  
  console.log(`📊 Datos del día (local): ${datosDelDia.length} registros`);
  
  if (datosDelDia.length === 0) return [];
  
  // Agrupar por hora local
  const dataPorHora = new Map();
  for (let i = 0; i < 24; i++) {
    dataPorHora.set(i, { suma: 0, count: 0 });
  }
  
  datosDelDia.forEach(item => {
    const fechaLocal = convertirUtcALocal(item.FECHA);
    const hora = fechaLocal.getHours();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    const grupo = dataPorHora.get(hora);
    grupo.suma += valor;
    grupo.count++;
  });
  
  // Generar array de 24 horas
  return Array.from({ length: 24 }, (_, i) => {
    const grupo = dataPorHora.get(i);
    const promedio = grupo.count > 0 ? grupo.suma / grupo.count : null;
    return {
      hora: `${i.toString().padStart(2, '0')}:00`,
      LUZ: promedio,
      registros: grupo.count
    };
  });
}

// ==========================================
// GRÁFICA DE SEMANA - Datos de la semana actual en HORA LOCAL
// ==========================================
function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const diaSemana = ahoraLocal.getDay(); // 0 = Domingo
  
  let inicioSemana = new Date(ahoraLocal);
  if (diaSemana === 0) {
    inicioSemana.setDate(ahoraLocal.getDate() - 6);
  } else {
    inicioSemana.setDate(ahoraLocal.getDate() - (diaSemana - 1));
  }
  inicioSemana.setHours(0, 0, 0, 0);
  
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  console.log(`📅 Semana (local): ${inicioSemana.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`);
  
  const datosSemana = data.filter(item => {
    if (!item?.FECHA) return false;
    const fechaLocal = convertirUtcALocal(item.FECHA);
    return fechaLocal >= inicioSemana && fechaLocal <= finSemana;
  });
  
  console.log(`📊 Datos semana: ${datosSemana.length} registros`);
  
  if (datosSemana.length === 0) return [];
  
  const diasMap = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const datosPorDia = new Map();
  const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  ordenDias.forEach(dia => datosPorDia.set(dia, { suma: 0, count: 0 }));
  
  datosSemana.forEach(item => {
    const fechaLocal = convertirUtcALocal(item.FECHA);
    const diaNombre = diasMap[fechaLocal.getDay()];
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
    return {
      dia: dia.substring(0, 3),
      LUZ: Math.round(promedio * 10) / 10,
      registros: grupo.count
    };
  });
}

// ==========================================
// GRÁFICA DE MES - Datos del mes actual en HORA LOCAL
// ==========================================
function generarDatosMes(data) {
  if (!data || data.length === 0) return [];
  
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  
  console.log(`📅 Mes actual (local): ${añoActual}/${mesActual + 1}`);
  
  const datosMes = data.filter(item => {
    if (!item?.FECHA) return false;
    const fechaLocal = convertirUtcALocal(item.FECHA);
    return fechaLocal.getFullYear() === añoActual && fechaLocal.getMonth() === mesActual;
  });
  
  console.log(`📊 Datos mes: ${datosMes.length} registros`);
  
  if (datosMes.length === 0) return [];
  
  const datosPorSemana = new Map();
  for (let i = 1; i <= 5; i++) {
    datosPorSemana.set(i, { suma: 0, count: 0 });
  }
  
  datosMes.forEach(item => {
    const fechaLocal = convertirUtcALocal(item.FECHA);
    const dia = fechaLocal.getDate();
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
      registros: grupo.count
    };
  });
}

// ==========================================
// COMPONENTES GRÁFICOS
// ==========================================

const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  if (payload.LUZ === null || payload.LUZ === undefined) return null;
  if (payload.registros === 0) return null;
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#FFB300" stroke="none" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #00ff9d',
        borderRadius: '8px',
        padding: '0.75rem',
        color: '#fff'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#00ff9d' }}>{label}</p>
        <p style={{ margin: 0, fontSize: '1rem', color: '#FFB300', marginTop: '0.25rem' }}>
          Luz: {dataPoint.LUZ?.toFixed(1)} lux
        </p>
        {dataPoint.registros > 0 && (
          <p style={{ margin: 0, color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            📊 {dataPoint.registros} registros
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
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>📭 No hay datos disponibles</div>;
  }

  console.log(`📊 LightChart - Período: ${periodo}, Datos recibidos: ${data.length}`);

  let chartData = [];
  let dataKey = '';
  let chartName = '';

  if (periodo === 'dia') {
    chartData = generarDatosDia(data);
    dataKey = 'hora';
    chartName = 'Luz (lux)';
  } else if (periodo === 'semana') {
    chartData = generarDatosSemana(data);
    dataKey = 'dia';
    chartName = 'Luz promedio (lux)';
  } else {
    chartData = generarDatosMes(data);
    dataKey = 'semana';
    chartName = 'Luz promedio (lux)';
  }

  if (chartData.length === 0 || chartData.every(item => item.LUZ === null || item.LUZ === 0)) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>📊 No hay datos para el período seleccionado</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey={dataKey} stroke="#888" tick={{ fill: '#888' }} />
        <YAxis stroke="#888" tick={{ fill: '#888' }} domain={[0, 'auto']} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#888' }} />
        <Line 
          type="monotone" 
          dataKey="LUZ" 
          stroke="#00ff9d" 
          strokeWidth={2.5} 
          dot={<CustomDot />} 
          name={chartName}
          connectNulls={true}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}