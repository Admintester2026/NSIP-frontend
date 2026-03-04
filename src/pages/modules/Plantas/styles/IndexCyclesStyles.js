import base from './Cycles/base.module.css';
import header from './Cycles/header.module.css';
import status from './Cycles/status.module.css';
import cards from './Cycles/cards.module.css';
import editor from './Cycles/editor.module.css';
import table from './Cycles/table.module.css';
import actions from './Cycles/actions.module.css';
import loading from './Cycles/loading.module.css';
import responsive from './Cycles/responsive.module.css';
import newStyles from './Cycles/new-styles.module.css';

// Combinar todos los estilos
const styles = {
  // Base
  cycles: base.cycles,
  'fade-in': base['fade-in'],
  'slide-in': base['slide-in'],
  
  // Header
  header: header.header,
  titleSection: header.titleSection,
  title: header.title,
  subtitle: header.subtitle,
  backButton: header.backButton,
  
  // Status
  statusMessage: status.statusMessage,
  success: status.success,
  error: status.error,
  
  // Cards
  summaryBar: cards.summaryBar,
  summaryItem: cards.summaryItem,
  summaryLabel: cards.summaryLabel,
  summaryValue: cards.summaryValue,
  cyclesGrid: cards.cyclesGrid,
  cycleCard: cards.cycleCard,
  topLeft: cards.topLeft,
  topRight: cards.topRight,
  lastLeft: cards.lastLeft,
  lastRight: cards.lastRight,
  cycleCardHeader: cards.cycleCardHeader,
  cycleCardTitle: cards.cycleCardTitle,
  cycleCardSubtitle: cards.cycleCardSubtitle,
  cycleCardStats: cards.cycleCardStats,
  cycleCardBadge: cards.cycleCardBadge,
  cycleStatus: cards.cycleStatus,
  statusInactive: cards.statusInactive,
  statusPartial: cards.statusPartial,
  statusFull: cards.statusFull,
  cycleCardGrid: cards.cycleCardGrid,
  cycleGridItem: cards.cycleGridItem,
  active: cards.active,
  cycleGridNumber: cards.cycleGridNumber,
  cycleGridTime: cards.cycleGridTime,
  cycleGridDisabled: cards.cycleGridDisabled,
  showMoreButton: cards.showMoreButton,
  cycleCardFooter: cards.cycleCardFooter,
  cycleCardStatus: cards.cycleCardStatus,
  nextCycle: cards.nextCycle,
  applyAllMiniButton: cards.applyAllMiniButton,
  
  // Editor
  modalOverlay: editor.modalOverlay,
  modal: editor.modal,
  cycleEditor: editor.cycleEditor,
  editorTitle: editor.editorTitle,
  editorRow: editor.editorRow,
  editorLabel: editor.editorLabel,
  editorCheckbox: editor.editorCheckbox,
  timeSelector: editor.timeSelector,
  timeLabel: editor.timeLabel,
  timeSelect: editor.timeSelect,
  timeSeparator: editor.timeSeparator,
  timeInputGroup: editor.timeInputGroup,
  timeInput: editor.timeInput,
  inputHint: editor.inputHint,
  editorActions: editor.editorActions,
  saveButton: editor.saveButton,
  applyAllButton: editor.applyAllButton,
  cancelButton: editor.cancelButton,
  
  // ===== TABLA (ACTUALIZADO) =====
  tableContainer: table.tableContainer,
  tableTitle: table.tableTitle,
  tableWrapper: table.tableWrapper,
  cyclesTable: table.cyclesTable,
  relayId: table.relayId,
  // NUEVAS CLASES PARA STICKERS DE CICLOS
  ciclo1: table.ciclo1,
  ciclo2: table.ciclo2,
  ciclo3: table.ciclo3,
  ciclo4: table.ciclo4,
  ciclo5: table.ciclo5,
  ciclo6: table.ciclo6,
  timeCell: table.timeCell,
  durationCell: table.durationCell,
  tableEditButton: table.tableEditButton,
  emptyTable: table.emptyTable,
  emptyIcon: table.emptyIcon,
  
  // NUEVOS ESTILOS DE TABLA
  tableFilters: table.tableFilters,
  filterGroup: table.filterGroup,
  filterSelect: table.filterSelect,
  filterInput: table.filterInput,
  clearFiltersButton: table.clearFiltersButton,
  tableScrollable: table.tableScrollable,
  noResults: table.noResults,
  tableFooter: table.tableFooter,
  
  // Actions
  actionsBar: actions.actionsBar,
  actionButton: actions.actionButton,
  actionIcon: actions.actionIcon,
  confirmDialog: actions.confirmDialog,
  confirmActions: actions.confirmActions,
  confirmButton: actions.confirmButton,
  
  // Loading
  loading: loading.loading,
  spinner: loading.spinner,
  error: loading.error,
  errorIcon: loading.errorIcon,
  retryButton: loading.retryButton,
  
  // ===== NUEVOS ESTILOS =====
  // Compact Card
  compactCard: newStyles.compactCard,
  compactHeader: newStyles.compactHeader,
  compactTitle: newStyles.compactTitle,
  compactStats: newStyles.compactStats,
  compactApplyButton: newStyles.compactApplyButton,
  compactGrid: newStyles.compactGrid,
  compactItem: newStyles.compactItem,
  compactNumber: newStyles.compactNumber,
  compactTime: newStyles.compactTime,
  compactDisabled: newStyles.compactDisabled,
  showMoreCompact: newStyles.showMoreCompact,
  compactFooter: newStyles.compactFooter,
  
  // Global Editor
  globalEditor: newStyles.globalEditor,
  timeInputs: newStyles.timeInputs,
  inputGroup: newStyles.inputGroup,
  timeInput: newStyles.timeInput,
  cycleButtons: newStyles.cycleButtons,
  cycleButton: newStyles.cycleButton,
  globalButton: newStyles.globalButton,
  
  // Lists
  listsContainer: newStyles.listsContainer,
  cycleList: newStyles.cycleList,
  listTitle: newStyles.listTitle,
  listGrid: newStyles.listGrid,
  listItem: newStyles.listItem,
  listBadge: newStyles.listBadge,
  listTime: newStyles.listTime,
  listCycle: newStyles.listCycle,
  deleteButton: newStyles.deleteButton,
  
  // Grid
  cyclesGrid: newStyles.cyclesGrid,
  
  // Manual Mode Warning
  warningBanner: newStyles.warningBanner,
  warningIcon: newStyles.warningIcon,
  warningContent: newStyles.warningContent,
  autoButton: newStyles.autoButton,
};

export default styles;