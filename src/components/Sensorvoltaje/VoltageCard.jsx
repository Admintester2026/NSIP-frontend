import styles from './VoltageCard.module.css';
import { getVoltageColor, getVoltageStatus, getVoltageIcon, VOLTAJE_RANGOS } from '../../pages/modules/Voltaje/styles';

export default function VoltageCard({ 
  index, 
  label, 
  value, 
  unit = VOLTAJE_RANGOS.unidad, 
  min = VOLTAJE_RANGOS.min, 
  max = VOLTAJE_RANGOS.max 
}) {
  const voltage = value || 0;
  const color = getVoltageColor(voltage, min, max);
  const status = getVoltageStatus(voltage, min, max);
  const icon = getVoltageIcon(voltage, min, max);

  return (
    <div className={styles.voltageCard} style={{ borderColor: color }}>
      <div className={styles.voltageHeader}>
        <span className={styles.voltageIndex}>Fase {label}</span>
        <span className={styles.voltageBadge} style={{ backgroundColor: color }}>
          {icon} {status}
        </span>
      </div>
      
      <div className={styles.voltageValue} style={{ color }}>
        {voltage.toFixed(1)}
        <span className={styles.voltageUnit}>{unit}</span>
      </div>
      
      <div className={styles.voltageFooter}>
        <span className={styles.voltageRange}>
          {min}-{max} {unit}
        </span>
      </div>
    </div>
  );
}