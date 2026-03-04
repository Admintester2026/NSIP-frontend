import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RelayUsageChart({ stats }) {
  if (!stats?.data?.relays) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        No hay estadísticas disponibles
      </div>
    );
  }

  const data = stats.data.relays.map(relay => ({
    name: `R${relay.id}`,
    'Horas Encendido': relay.hours_on,
    'Horas Apagado': relay.hours_off,
    'Uso %': relay.percent
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis 
          dataKey="name" 
          stroke="#6c757d"
          tick={{ fill: '#6c757d', fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left"
          stroke="#6c757d"
          tick={{ fill: '#6c757d', fontSize: 12 }}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right"
          stroke="#6c757d"
          tick={{ fill: '#6c757d', fontSize: 12 }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1a1a1a', 
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#e0e0e0'
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="Horas Encendido" fill="#00ff9d" />
        <Bar yAxisId="left" dataKey="Horas Apagado" fill="#ff4d4d" />
        <Bar yAxisId="right" dataKey="Uso %" fill="#ffb340" />
      </BarChart>
    </ResponsiveContainer>
  );
}