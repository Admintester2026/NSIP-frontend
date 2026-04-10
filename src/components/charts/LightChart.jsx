// src/components/charts/LightChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==========================================
// GRÁFICA DE DÍA - Comportamiento igual a semana/mes
// ==========================================
function generarDatosDia(data) {
  // Inicializar array de 24 horas con valor 0
  const horasCompletas = Array.from({ length: 24 }, (_, i) => ({
    hora: `${i.toString().padStart(2, '0')}:00`,
    LUZ: 0,
    registros: 0,
    tieneDato: false
  }));
  
  if (!data || data.length === 0) {
    return horasCompletas;
  }
  
  const ahora = new Date();
  const añoActual = ahora.getFullYear();
  const mesActual = ahora.getMonth();
  const diaActual = ahora.getDate();
  
  // Filtrar datos del día actual
  const datosDelDia = data.filter(item => {
    if (!item?.FECHA) return false;
    const fecha = new Date(item.FECHA);
    return fecha.getFullYear() === añoActual &&
           fecha.getMonth() === mesActual &&
           fecha.getDate() === diaActual;
  });
  
  if (datosDelDia.length === 0) {
    return horasCompletas;
  }
  
  // Crear mapa de hora -> valor promedio
  const dataPorHora = new Map();
  for (let i = 0; i < 24; i++) {
    dataPorHora.set(i, { suma: 0, count: 0 });
  }
  
  datosDelDia.forEach(item => {
    const fecha = new Date(item.FECHA);
    const hora = fecha.getHours();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    const grupo = dataPorHora.get(hora);
    grupo.suma += valor;
    grupo.count++;
  });
  
  // Calcular promedios (mismo método que semana y mes)
  return horasCompletas.map((horaData, hora) => {
    const grupo = dataPorHora.get(hora);
    const tieneDato = grupo.count > 0;
    const promedio = tieneDato ? grupo.suma / grupo.count : 0;
    
    return {
      hora: horaData.hora,
      LUZ: Math.round(promedio * 10) / 10,
      registros: grupo.count,
      tieneDato: tieneDato
    };
  });
}

// ==========================================
// GRÁFICA DE SEMANA
// ==========================================
function generarDatosSemana(data) {
  const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const resultadoInicial = ordenDias.map(dia => ({
    dia: dia.substring(0, 3),
    LUZ: 0,
    registros: 0
  }));
  
  if (!data || data.length === 0) {
    return resultadoInicial;
  }
  
  const ahora = new Date();
  const diaSemana = ahora.getDay();
  
  let inicioSemana = new Date(ahora);
  if (diaSemana === 0) {
    inicioSemana.setDate(ahora.getDate() - 6);
  } else {
    inicioSemana.setDate(ahora.getDate() - (diaSemana - 1));
  }
  inicioSemana.setHours(0, 0, 0, 0);
  
  let finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  const datosSemana = data.filter(item => {
    if (!item?.FECHA) return false;
    const fecha = new Date(item.FECHA);
    return fecha >= inicioSemana && fecha <= finSemana;
  });
  
  if (datosSemana.length === 0) {
    return resultadoInicial;
  }
  
  const diasMap = { 0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado' };
  const datosPorDia = new Map();
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
    return {
      dia: dia.substring(0, 3),
      LUZ: Math.round(promedio * 10) / 10,
      registros: grupo.count
    };
  });
}

// ==========================================
// GRÁFICA DE MES
// ==========================================
function generarDatosMes(data) {
  const resultadoInicial = [1, 2, 3, 4, 5].map(num => ({
    semana: `S${num}`,
    LUZ: 0,
    registros: 0
  }));
  
  if (!data || data.length === 0) {
    return resultadoInicial;
  }
  
  const ahora = new Date();
  const añoActual = ahora.getFullYear();
  const mesActual = ahora.getMonth();
  
  const datosMes = data.filter(item => {
    if (!item?.FECHA) return false;
    const fecha = new Date(item.FECHA);
    return fecha.getFullYear() === añoActual && fecha.getMonth() === mesActual;
  });
  
  if (datosMes.length === 0) {
    return resultadoInicial;
  }
  
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
      registros: grupo.count
    };
  });
}

// ==========================================
// COMPONENTES GRÁFICOS
// ==========================================

const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  // Solo mostrar puntos donde hay datos reales (registros > 0)
  if (payload.registros === 0) return null;
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#FFB300" stroke="none" />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const valorLuz = dataPoint.LUZ !== undefined && dataPoint.LUZ !== null 
      ? (typeof dataPoint.LUZ === 'number' ? dataPoint.LUZ.toFixed(1) : dataPoint.LUZ)
      : '0.0';
    
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
          Luz: {valorLuz} lux
        </p>
        {dataPoint.registros > 0 && (
          <p style={{ margin: 0, color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            📊 {dataPoint.registros} {dataPoint.registros === 1 ? 'registro' : 'registros'}
          </p>
        )}
        {dataPoint.registros === 0 && (
          <p style={{ margin: 0, color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
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
  if (!data || !Array.isArray(data)) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>📭 No hay datos disponibles</div>;
  }

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

  if (chartData.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>📊 No hay datos para el período seleccionado</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey={dataKey} 
          stroke="#888" 
          tick={{ fill: '#888' }}
          interval={periodo === 'dia' ? 2 : 0}
        />
        <YAxis 
          stroke="#888" 
          tick={{ fill: '#888' }} 
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#888' }} />
        <Line 
          type="monotone" 
          dataKey="LUZ" 
          stroke="#00ff9d" 
          strokeWidth={2.5} 
          dot={<CustomDot />}
          activeDot={{ r: 6, stroke: '#00ff9d', strokeWidth: 2 }}
          name={chartName}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}