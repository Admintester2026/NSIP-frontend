import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { arduinoAPI } from '../../../api/arduino';
import { usePolling, useMutation } from '../../../hooks/useAsync';
import { useMode } from '../../../context/ModeContext';
import { 
  CycleCard, 
  CycleEditor, 
  CycleSummaryBar, 
  CycleTable,
  CycleActions,
  GlobalCycleEditor
} from "./components/Indexcycles";
import ManualModeWarning from './components/ManualModeWarning';
import styles from "./styles/IndexCyclesStyles";

export default function Cycles() {
  const { mode } = useMode();
  
  const [cyclesData, setCyclesData] = useState(null);
  const [editingCycle, setEditingCycle] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCycles = useCallback(() => arduinoAPI.getCycles(), []);
  const { data, loading, error, refetch } = usePolling(fetchCycles, 5000);

  useEffect(() => {
    if (data?.data) {
      setCyclesData(data.data);
    }
  }, [data]);

  // Función de guardado normal (no useMutation para evitar problemas)
  const saveCycle = async (cycleData) => {
    console.log('💾 Enviando al backend:', cycleData);
    try {
      const result = await arduinoAPI.setCycle(cycleData);
      console.log('✅ Respuesta del backend:', result);
      setSaveStatus({ type: 'success', message: '✅ Ciclo guardado' });
      
      setTimeout(() => {
        console.log('🔄 Forzando actualización de datos...');
        refetch();
      }, 1000);
      
      setTimeout(() => {
        setSaveStatus(null);
        setEditingCycle(null);
      }, 2000);
      
      return result;
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      setSaveStatus({ type: 'error', message: `❌ ${error.message}` });
      setTimeout(() => setSaveStatus(null), 3000);
      throw error;
    }
  };

  // Función para eliminar un ciclo individual
  const deleteCycle = async ({ relay, cycle }) => {
    console.log(`🗑️ Eliminando ciclo ${cycle} del relé ${relay}`);
    try {
      const result = await arduinoAPI.setCycle({
        relay,
        cycle,
        start_h: 0,
        start_m: 0,
        end_h: 0,
        end_m: 0,
        enabled: false
      });
      console.log('✅ Ciclo eliminado correctamente');
      refetch();
      setSaveStatus({ type: 'success', message: '✅ Ciclo eliminado' });
      setTimeout(() => setSaveStatus(null), 2000);
      return result;
    } catch (error) {
      console.error('❌ Error eliminando ciclo:', error);
      setSaveStatus({ type: 'error', message: `❌ Error al eliminar: ${error.message}` });
      setTimeout(() => setSaveStatus(null), 3000);
      throw error;
    }
  };

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

  const handleSaveGlobal = async (globalConfig) => {
    console.log('🌍 Guardando ciclo global:', globalConfig);
    
    if (globalConfig.cycle === undefined || 
        globalConfig.start_h === undefined || 
        globalConfig.start_m === undefined || 
        globalConfig.end_h === undefined || 
        globalConfig.end_m === undefined) {
      alert('Error: Datos incompletos');
      return;
    }

    setSaveStatus({ type: 'info', message: '🔄 Aplicando configuración global...' });

    try {
      const savePromises = [];
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
        savePromises.push(arduinoAPI.setCycle(cycleData));
      }
      
      await Promise.all(savePromises);
      
      setSaveStatus({ type: 'success', message: '✅ Configuración global aplicada' });
      refetch();
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('❌ Error aplicando configuración global:', error);
      setSaveStatus({ type: 'error', message: `❌ Error: ${error.message}` });
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handleDeleteCycle = async (relayId, cycleNumber) => {
    if (window.confirm(`¿Eliminar ciclo ${cycleNumber + 1} del relé ${relayId}?`)) {
      await deleteCycle({ relay: relayId, cycle: cycleNumber });
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ ¿Eliminar TODOS los ciclos de TODOS los relés?\n\nEsta acción no se puede deshacer.')) {
      return;
    }
    
    setIsDeleting(true);
    setSaveStatus({ type: 'info', message: '🔄 Eliminando todos los ciclos...' });
    
    try {
      const deletePromises = [];
      for (let relay = 1; relay <= 8; relay++) {
        for (let cycle = 0; cycle < 6; cycle++) {
          deletePromises.push(
            arduinoAPI.setCycle({
              relay,
              cycle,
              start_h: 0,
              start_m: 0,
              end_h: 0,
              end_m: 0,
              enabled: false
            })
          );
        }
      }
      
      await Promise.all(deletePromises);
      
      console.log('✅ Todos los ciclos eliminados');
      setSaveStatus({ type: 'success', message: '✅ Todos los ciclos han sido eliminados' });
      refetch();
      
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('❌ Error eliminando ciclos:', error);
      setSaveStatus({ type: 'error', message: `❌ Error al eliminar: ${error.message}` });
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApplyToAll = (relayId, cycleNumber, cycleData) => {
    console.log('🔄 Aplicando a todos los relés:', cycleData);
    
    const globalConfig = {
      cycle: cycleNumber,
      start_h: cycleData.start_h,
      start_m: cycleData.start_m,
      end_h: cycleData.end_h,
      end_m: cycleData.end_m,
      enabled: cycleData.enabled
    };
    
    handleSaveGlobal(globalConfig);
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
            onApplyToAll={handleApplyToAll}
          />
        ))}
      </div>

      <CycleTable 
        cyclesData={cyclesData}
        onEdit={handleEdit}
      />

      <CycleActions 
        onClearAll={handleClearAll}
        hasCycles={hasAnyCycles}
        isDeleting={isDeleting}
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
              onApplyToAll={handleApplyToAll}
            />
          </div>
        </div>
      )}
    </div>
  );
}