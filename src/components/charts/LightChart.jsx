// src/components/charts/LightChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==========================================
// GRÁFICA DE DÍA - Curva continua con todos los puntos
// ==========================================
function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
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
  
  if (datosDelDia.length === 0) return [];
  
  // Agrupar por hora (promedio por hora)
  const dataPorHora = new Map();
  for (let i = 0; i < 24; i++) {
    dataPorHora.set(i, { suma: 0, count: 0, tieneDato: false });
  }
  
  datosDelDia.forEach(item => {
    const fecha = new Date(item.FECHA);
    const hora = fecha.getHours();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    const grupo = dataPorHora.get(hora);
    grupo.suma += valor;
    grupo.count++;
    grupo.tieneDato = true;
  });
  
  // Generar array de 24 horas con valores
  const horas = Array.from({ length: 24 }, (_, i) => i);
  
  // Primero, crear los datos con valores reales y nulos
  const datosConNulls = horas.map(hora => {
    const grupo = dataPorHora.get(hora);
    let valor = null;
    let tieneDato = false;
    
    if (grupo && grupo.count > 0) {
      valor = grupo.suma / grupo.count;
      tieneDato = true;
    }
    
    return {
      hora: `${hora.toString().padStart(2, '0')}:00`,
      LUZ: valor,
      tieneDato: tieneDato,
      registros: grupo?.count || 0,
      horaNumero: hora
    };
  });
  
  // Rellenar valores nulos con el último valor conocido (para línea continua)
  let ultimoValor = null;
  const datosContinuos = datosConNulls.map((item, index) => {
    if (item.LUZ !== null) {
      ultimoValor = item.LUZ;
      return { ...item, LUZ: item.LUZ };
    } else {
      // Si no hay dato, usar el último valor conocido para la línea
      return { ...item, LUZ: ultimoValor };
    }
  });
  
  return datosContinuos;
}

// ==========================================
// GRÁFICA DE SEMANA
// ==========================================
function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
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
  if (!data || data.length === 0) return [];
  
  const ahora = new Date();
  const añoActual = ahora.getFullYear();
  const mesActual = ahora.getMonth();
  
  const datosMes = data.filter(item => {
    if (!item?.FECHA) return false;
    const fecha = new Date(item.FECHA);
    return fecha.getFullYear() === añoActual && fecha.getMonth() === mesActual;
  });
  
  if (datosMes.length === 0) return [];
  
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
  // Solo mostrar puntos donde realmente hay datos (tieneDato = true)
  if (!payload.tieneDato && payload.registros === 0) {
    return null;
  }
  // Punto amarillo para valores con datos reales
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill="#FFB300" stroke="#FFB300" strokeWidth={1} />;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const tieneDatosReales = dataPoint.tieneDato === true || dataPoint.registros > 0;
    
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #00ff9d',
        borderRadius: '8px',
        padding: '0.75rem',
        color: '#fff',
        minWidth: '180px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', color: '#00ff9d', marginBottom: '0.5rem' }}>
          {label}
        </p>
        
        {tieneDatosReales ? (
          <>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#FFB300', fontWeight: 'bold' }}>
              {dataPoint.LUZ?.toFixed(1)} lux
            </p>
            {dataPoint.registros > 0 && (
              <p style={{ margin: 0, color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                📊 Basado en {dataPoint.registros} {dataPoint.registros === 1 ? 'registro' : 'registros'}
              </p>
            )}
          </>
        ) : (
          <p style={{ margin: 0, color: '#666', fontStyle: 'italic' }}>
            Sin datos en este horario
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
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
        📭 No hay datos disponibles
      </div>
    );
  }

  let chartData = [];
  let dataKey = '';
  let chartName = '';
  let yAxisLabel = 'Luz (lux)';

  if (periodo === 'dia') {
    chartData = generarDatosDia(data);
    dataKey = 'hora';
    chartName = 'Luz (lux)';
    yAxisLabel = 'Luz (lux)';
  } else if (periodo === 'semana') {
    chartData = generarDatosSemana(data);
    dataKey = 'dia';
    chartName = 'Luz promedio (lux)';
    yAxisLabel = 'Luz promedio (lux)';
  } else {
    chartData = generarDatosMes(data);
    dataKey = 'semana';
    chartName = 'Luz promedio (lux)';
    yAxisLabel = 'Luz promedio (lux)';
  }

  if (chartData.length === 0 || chartData.every(item => item.LUZ === null || item.LUZ === 0)) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
        📊 No hay datos para el período seleccionado
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey={dataKey} 
          stroke="#888" 
          tick={{ fill: '#888', fontSize: 12 }}
          interval={periodo === 'dia' ? 2 : 0}
        />
        <YAxis 
          stroke="#888" 
          tick={{ fill: '#888', fontSize: 12 }}
          domain={[0, 'auto']}
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#888', offset: 10 }}
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
          activeDot={{ r: 7, stroke: '#00ff9d', strokeWidth: 2 }}
          name={chartName}
          connectNulls={true}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}