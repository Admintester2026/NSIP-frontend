import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// ==========================================
// CONFIGURACIÓN DE ZONA HORARIA
// ==========================================
const ZONA_HORARIA = -6; // GMT-6 (México)
const MS_POR_HORA = 60 * 60 * 1000;

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getFullYear() > 2000;
}

// Convertir fecha UTC a Local (GMT-6)
function convertirUtcALocal(utcDateString) {
  const fechaUTC = new Date(utcDateString);
  return new Date(fechaUTC.getTime() + (ZONA_HORARIA * MS_POR_HORA));
}

// Formatear hora para mostrar
function formatHora(hora) {
  return `${hora.toString().padStart(2, '0')}:00`;
}

// ==========================================
// GRÁFICA DE DÍA - Datos del día actual (hoy) con curva continua
// ==========================================
function generarDatosDia(data) {
  if (!data || data.length === 0) return [];
  
  // Obtener fecha actual en local
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  const diaActual = ahoraLocal.getDate();
  
  console.log(`📅 Día actual: ${añoActual}/${mesActual + 1}/${diaActual}`);
  
  // Filtrar datos del día actual (usando hora local)
  const datosDelDia = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fechaLocal = convertirUtcALocal(item.FECHA);
    return fechaLocal.getFullYear() === añoActual &&
           fechaLocal.getMonth() === mesActual &&
           fechaLocal.getDate() === diaActual;
  });
  
  console.log(`📊 Datos del día: ${datosDelDia.length} registros`);
  
  if (datosDelDia.length === 0) return [];
  
  // Agrupar por hora (promedio por hora para suavizar la curva)
  const dataPorHora = new Map();
  
  datosDelDia.forEach(item => {
    const fechaLocal = convertirUtcALocal(item.FECHA);
    const hora = fechaLocal.getHours();
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    
    if (!dataPorHora.has(hora)) {
      dataPorHora.set(hora, { suma: 0, count: 0 });
    }
    const grupo = dataPorHora.get(hora);
    grupo.suma += valor;
    grupo.count++;
  });
  
  // Generar todas las horas del día (0-23) con valores promedio
  const horas = Array.from({ length: 24 }, (_, i) => i);
  
  return horas.map(hora => {
    const grupo = dataPorHora.get(hora);
    let valor = null;
    let tieneDato = false;
    
    if (grupo && grupo.count > 0) {
      valor = grupo.suma / grupo.count;
      tieneDato = true;
    }
    
    // Para la curva, si no hay dato en una hora, usar el último valor conocido
    // Esto hace que la curva sea continua
    return {
      hora: formatHora(hora),
      LUZ: valor,
      tieneDato: tieneDato,
      horaNumero: hora
    };
  });
}

// ==========================================
// GRÁFICA DE SEMANA - Datos de Lunes a Domingo de la semana actual
// ==========================================
function generarDatosSemana(data) {
  if (!data || data.length === 0) return [];
  
  // Obtener fecha actual en local
  const ahoraLocal = new Date();
  const diaSemanaActual = ahoraLocal.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  
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
  
  console.log(`📅 Semana actual: ${inicioSemana.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`);
  
  // Filtrar datos de la semana actual
  const datosSemana = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fechaLocal = convertirUtcALocal(item.FECHA);
    return fechaLocal >= inicioSemana && fechaLocal <= finSemana;
  });
  
  console.log(`📊 Datos de la semana: ${datosSemana.length} registros`);
  
  if (datosSemana.length === 0) return [];
  
  // Mapeo de día número a nombre
  const diasMap = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
    5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
  };
  
  // Inicializar datos por día
  const datosPorDia = new Map();
  const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  ordenDias.forEach(dia => datosPorDia.set(dia, { suma: 0, count: 0 }));
  
  datosSemana.forEach(item => {
    const fechaLocal = convertirUtcALocal(item.FECHA);
    const diaNum = fechaLocal.getDay();
    const diaNombre = diasMap[diaNum];
    const valor = typeof item.LUZ === 'number' ? item.LUZ : parseFloat(item.LUZ) || 0;
    
    if (datosPorDia.has(diaNombre)) {
      const grupo = datosPorDia.get(diaNombre);
      grupo.suma += valor;
      grupo.count++;
    }
  });
  
  // Calcular promedios
  return ordenDias.map(dia => {
    const grupo = datosPorDia.get(dia);
    const promedio = grupo.count > 0 ? grupo.suma / grupo.count : 0;
    
    return {
      dia: dia.substring(0, 3),
      LUZ: Math.round(promedio * 10) / 10,
      registros: grupo.count,
      esPromedio: true
    };
  });
}

// ==========================================
// GRÁFICA DE MES - Datos del mes actual agrupados por semana
// ==========================================
function generarDatosMes(data) {
  if (!data || data.length === 0) return [];
  
  // Obtener fecha actual en local
  const ahoraLocal = new Date();
  const añoActual = ahoraLocal.getFullYear();
  const mesActual = ahoraLocal.getMonth();
  
  console.log(`📅 Mes actual: ${añoActual}/${mesActual + 1}`);
  
  // Filtrar datos del mes actual
  const datosMes = data.filter(item => {
    if (!isValidDate(item.FECHA)) return false;
    const fechaLocal = convertirUtcALocal(item.FECHA);
    return fechaLocal.getFullYear() === añoActual && fechaLocal.getMonth() === mesActual;
  });
  
  console.log(`📊 Datos del mes: ${datosMes.length} registros`);
  
  if (datosMes.length === 0) return [];
  
  // Inicializar datos por semana (1-5)
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
  
  // Calcular promedios
  return [1, 2, 3, 4, 5].map(num => {
    const grupo = datosPorSemana.get(num);
    const promedio = grupo.count > 0 ? grupo.suma / grupo.count : 0;
    
    return {
      semana: `S${num}`,
      LUZ: Math.round(promedio * 10) / 10,
      registros: grupo.count,
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
  return <circle key={key} cx={cx} cy={cy} r={3} fill="#00ff9d" stroke="none" />;
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
        
        {!dataPoint.tieneDato && dataPoint.LUZ === null && (
          <p style={{ margin: 0, color: 'var(--amber)', fontSize: '0.7rem', marginTop: '0.25rem' }}>
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
  // Validar datos
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        📭 No hay datos disponibles
      </div>
    );
  }

  console.log(`📊 LightChart - Período: ${periodo}, Datos recibidos: ${data.length}`);

  // Generar datos según período
  let chartData = [];
  let dataKey = '';
  let xAxisLabel = '';
  
  if (periodo === 'dia') {
    chartData = generarDatosDia(data);
    dataKey = 'hora';
    xAxisLabel = 'Hora del día';
  } else if (periodo === 'semana') {
    chartData = generarDatosSemana(data);
    dataKey = 'dia';
    xAxisLabel = 'Día de la semana';
  } else {
    chartData = generarDatosMes(data);
    dataKey = 'semana';
    xAxisLabel = 'Semana del mes';
  }

  if (chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        📊 No hay datos para el período seleccionado
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
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6 }}
            name={periodo === 'dia' ? 'Luz (lux)' : 'Luz promedio (lux)'}
            connectNulls={true}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}