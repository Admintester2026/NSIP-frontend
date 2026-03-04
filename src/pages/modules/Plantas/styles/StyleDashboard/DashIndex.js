import base from './base.module.css';
import header from './header.module.css';
import statusBar from './statusBar.module.css';
import mainPanel from './mainPanel.module.css';
import statsPanel from './statsPanel.module.css';
import lightMeter from './lightMeter.module.css';
import modeControl from './modeControl.module.css';
import relaySection from './relaySection.module.css';
import manualModeBanner from './manualModeBanner.module.css';
import confirmationBar from './confirmationBar.module.css';
import responsive from './responsive.module.css';

const styles = {
  // Base
  dashboard: base.dashboard,
  'fade-in': base['fade-in'],
  
  // Header
  header: header.header,
  titleSection: header.titleSection,
  title: header.title,
  subtitle: header.subtitle,
  actions: header.actions,
  actionButton: header.actionButton,
  actionIcon: header.actionIcon,
  
  // Status Bar
  statusBar: statusBar.statusBar,
  badge: statusBar.badge,
  badgeOnline: statusBar.badgeOnline,
  badgeOffline: statusBar.badgeOffline,
  badgeDot: statusBar.badgeDot,
  badgeLabel: statusBar.badgeLabel,
  badgeStatus: statusBar.badgeStatus,
  sdBadge: statusBar.sdBadge,
  sdOK: statusBar.sdOK,
  sdError: statusBar.sdError,
  sdIcon: statusBar.sdIcon,
  sdFails: statusBar.sdFails,
  lastUpdate: statusBar.lastUpdate,
  lastUpdateIcon: statusBar.lastUpdateIcon,
  lastUpdateText: statusBar.lastUpdateText,
  warning: statusBar.warning,
  
  // Main Panel
  mainPanel: mainPanel.mainPanel,
  
  // Stats Panel
  statsPanel: statsPanel.statsPanel,
  statCard: statsPanel.statCard,
  statLabel: statsPanel.statLabel,
  statValue: statsPanel.statValue,
  statUnit: statsPanel.statUnit,
  statProgress: statsPanel.statProgress,
  statProgressFill: statsPanel.statProgressFill,
  
  // Light Meter
  lightMeter: lightMeter.lightMeter,
  lightHeader: lightMeter.lightHeader,
  lightTitle: lightMeter.lightTitle,
  lightValue: lightMeter.lightValue,
  lightUnit: lightMeter.lightUnit,
  lightTrack: lightMeter.lightTrack,
  lightFill: lightMeter.lightFill,
  lightScale: lightMeter.lightScale,
  
  // Mode Control
  modeControl: modeControl.modeControl,
  modeLabel: modeControl.modeLabel,
  modeButtons: modeControl.modeButtons,
  modeButton: modeControl.modeButton,
  modeAutoActive: modeControl.modeAutoActive,
  modeManualActive: modeControl.modeManualActive,
  modeIcon: modeControl.modeIcon,
  modeStatus: modeControl.modeStatus,
  modeStatusManual: modeControl.modeStatusManual,
  
  // Relay Section
  relaySection: relaySection.relaySection,
  relayHeader: relaySection.relayHeader,
  relayTitle: relaySection.relayTitle,
  relayHint: relaySection.relayHint,
  relayGrid: relaySection.relayGrid,
  relayCard: relaySection.relayCard,
  relayOn: relaySection.relayOn,
  relayIndex: relaySection.relayIndex,
  relayStatus: relaySection.relayStatus,
  relayStatusOn: relaySection.relayStatusOn,
  relayLabel: relaySection.relayLabel,
  relayToggle: relaySection.relayToggle,
  relayToggleOn: relaySection.relayToggleOn,
  relayThumb: relaySection.relayThumb,
  relayStatusIndicator: relaySection.relayStatusIndicator,
  statusDot: relaySection.statusDot,
  statusText: relaySection.statusText,
  
  // Manual Mode Banner
  manualModeBanner: manualModeBanner.manualModeBanner,
  manualModeIcon: manualModeBanner.manualModeIcon,
  manualModeContent: manualModeBanner.manualModeContent,
  autoModeButton: manualModeBanner.autoModeButton,
  
  // Confirmation Bar
  confirmationBar: confirmationBar.confirmationBar,
  confirmationIcon: confirmationBar.confirmationIcon,
  confirmationText: confirmationBar.confirmationText,
  confirmationTime: confirmationBar.confirmationTime,
  
  // Responsive (los media queries se aplican automáticamente)
};

export default styles;