import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { arduinoAPI } from '../../../api/arduino';
import { usePolling, useMutation } from '../../../hooks/useAsync';
import { useMode } from '../../../context/ModeContext';
import { 
  CycleCard, 
  CycleEditor, 
  CycleSummaryBar, 
  CycleTable,      // ← IMPORTADO (se usará)
  CycleActions,
  GlobalCycleEditor
  // CycleListSections ELIMINADO - ya no se usa
} from "./components/Indexcycles";
import ManualModeWarning from './components/ManualModeWarning';
import styles from "./styles/IndexCyclesStyles";

export default function Cycles() {
  // Usar el contexto para el modo
  const { mode } = useMode();
  
  const [cyclesData, setCyclesData] = useState(null);
  const [editingCycle, setEditingCycle] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  const fetchCycles = useCallback(() => arduinoAPI.getCycles(), []);
  const { data, loading, error } = usePolling(fetchCycles, 5000);

  useEffect(() => {
    if (data?.data) {
      setCyclesData(data.data);
    }
  }, [data]);

  const { mutate: saveCycle } = useMutation(
    async (cycleData) => {
      console.log('💾 Enviando al backend:', cycleData);
      try {
        const result = await arduinoAPI.setCycle(cycleData);
        console.log('✅ Respuesta del backend:', result);
        return result;
      } catch (error) {
        console.error('❌ Error en la petición:', error);
        throw error;
      }
    },
    {
      onSuccess: (data) => {
        console.log('🎉 Mutación exitosa:', data);
        setSaveStatus({ type: 'success', message: '✅ Ciclo guardado' });
        
        setTimeout(() => {
          console.log('🔄 Forzando actualización de datos...');
          fetchCycles();
        }, 1000);
        
        setTimeout(() => {
          setSaveStatus(null);
          setEditingCycle(null);
        }, 2000);
      },
      onError: (error) => {
        console.error('💥 Error en mutación:', error);
        setSaveStatus({ type: 'error', message: `❌ ${error.message}` });
        setTimeout(() => setSaveStatus(null), 3000);
      }
    }
  );

  const { mutate: deleteCycle } = useMutation(
    async ({ relay, cycle }) => {
      const result = await arduinoAPI.setCycle({
        relay,
        cycle,
        start_h: 0,
        start_m: 0,
        end_h: 0,
        end_m: 0,
        enabled: false
      });
      return result;
    },
    {
      onSuccess: () => {
        fetchCycles();
        setSaveStatus({ type: 'success', message: '✅ Ciclo eliminado' });
        setTimeout(() => setSaveStatus(null), 2000);
      }
    }
  );

  const handleEdit = (relayId, cycleNumber, cycleData) => {
    const [startHour, startMin] = cycleData.start.split(':').map(Number);
    const [endHour, endMin] = cycleData.end.split(':').map(Number);
    
    setEditingCycle({
      relayId,
      cycleNumber,
      startHour,
      startMin,
      endHour,
      endMin,
      enabled: cycleData.enabled
    });
  };

  const handleSaveGlobal = (globalConfig) => {
    console.log('🌍 Guardando ciclo global:', globalConfig);
    
    if (globalConfig.cycle === undefined || 
        globalConfig.start_h === undefined || 
        globalConfig.start_m === undefined || 
        globalConfig.end_h === undefined || 
        globalConfig.end_m === undefined) {
      alert('Error: Datos incompletos');
      return;
    }

    for (let relay = 1; relay <= 8; relay++) {
      const cycleData = {
        relay: relay,
        cycle: globalConfig.cycle,
        start_h: globalConfig.start_h,
        start_m: globalConfig.start_m,
        end_h: globalConfig.end_h,
        end_m: globalConfig.end_m,
        enabled: globalConfig.enabled
      };
      
      console.log(`📤 Enviando ciclo para relé ${relay}:`, cycleData);
      saveCycle(cycleData);
    }
  };

  const handleDeleteCycle = (relayId, cycleNumber) => {
    if (window.confirm(`¿Eliminar ciclo ${cycleNumber + 1} del relé ${relayId}?`)) {
      deleteCycle({ relay: relayId, cycle: cycleNumber });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¿Eliminar TODOS los ciclos de TODOS los relés?')) {
      for (let relay = 1; relay <= 8; relay++) {
        for (let cycle = 0; cycle < 6; cycle++) {
          deleteCycle({ relay, cycle });
        }
      }
    }
  };

  if (loading && !cyclesData) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando ciclos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <h2>Error al cargar ciclos</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  const hasAnyCycles = cyclesData?.relays?.some(relay => 
    relay.cycles.some(c => c.enabled)
  );

  return (
    <div className={styles.cycles}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Gestión de Ciclos</h1>
          <p className={styles.subtitle}>Configura hasta 6 ciclos por relé</p>
        </div>
        <Link to="/modulos/plantas" className={styles.backButton}>
          <span>←</span> Volver
        </Link>
      </div>

      {saveStatus && (
        <div className={`${styles.statusMessage} ${styles[saveStatus.type]}`}>
          {saveStatus.message}
        </div>
      )}

      <CycleSummaryBar cyclesData={cyclesData} />
      <ManualModeWarning />

      <GlobalCycleEditor 
        onSaveGlobal={handleSaveGlobal}
      />

      <div className={styles.cyclesGrid}>
        {cyclesData?.relays?.map((relay) => (
          <CycleCard
            key={relay.id}
            relayId={relay.id}
            cycles={relay.cycles}
            onEdit={handleEdit}
            onApplyToAll={(relayId) => {
              const firstActive = relay.cycles.find(c => c.enabled);
              if (firstActive) {
                const [sh, sm] = firstActive.start.split(':').map(Number);
                const [eh, em] = firstActive.end.split(':').map(Number);
                handleSaveGlobal({
                  cycle: 0,
                  start_h: sh,
                  start_m: sm,
                  end_h: eh,
                  end_m: em,
                  enabled: true
                });
              }
            }}
          />
        ))}
      </div>

      {/* REEMPLAZADO: CycleListSections por CycleTable */}
      <CycleTable 
        cyclesData={cyclesData}
        onEdit={handleEdit}
      />

      <CycleActions 
        onClearAll={handleClearAll}
        hasCycles={hasAnyCycles}
      />

      {editingCycle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <CycleEditor
              relayId={editingCycle.relayId}
              cycleNumber={editingCycle.cycleNumber}
              initialData={{
                startHour: editingCycle.startHour,
                startMin: editingCycle.startMin,
                endHour: editingCycle.endHour,
                endMin: editingCycle.endMin,
                enabled: editingCycle.enabled
              }}
              onSave={saveCycle}
              onCancel={() => setEditingCycle(null)}
              onApplyToAll={handleSaveGlobal}
            />
          </div>
        </div>
      )}
    </div>
  );
}