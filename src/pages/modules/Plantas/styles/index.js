import base from './stats/base.module.css';
import header from './stats/header.module.css';
import cards from './stats/cards.module.css';
import lastRecord from './stats/lastRecord.module.css';
import selectors from './stats/selectors.module.css';
import charts from './stats/charts.module.css';
import tables from './stats/tables.module.css';
import historico from './stats/historico.module.css';
import search from './stats/search.module.css';
import loading from './stats/loading.module.css';
import responsive from './stats/responsive.module.css';

// Combinar todos los estilos en un solo objeto
const styles = {
  // Base
  stats: base.stats,
  
  // Header
  header: header.header,
  titleSection: header.titleSection,
  title: header.title,
  subtitle: header.subtitle,
  backButton: header.backButton,
  
  // Cards
  summaryCards: cards.summaryCards,
  statCard: cards.statCard,
  statIcon: cards.statIcon,
  statContent: cards.statContent,
  statLabel: cards.statLabel,
  statValue: cards.statValue,
  statUnit: cards.statUnit,
  
  // Last Record
  lastRecord: lastRecord.lastRecord,
  sectionTitle: lastRecord.sectionTitle,
  sectionIcon: lastRecord.sectionIcon,
  lastRecordGrid: lastRecord.lastRecordGrid,
  lastRecordItem: lastRecord.lastRecordItem,
  lastRecordLabel: lastRecord.lastRecordLabel,
  lastRecordValue: lastRecord.lastRecordValue,
  relayStatusCompact: lastRecord.relayStatusCompact,
  relayStatusCompactItem: lastRecord.relayStatusCompactItem,
  
  // Selectors
  periodSelectorContainer: selectors.periodSelectorContainer,
  limitSelectorContainer: selectors.limitSelectorContainer,
  selectorLabel: selectors.selectorLabel,
  periodSelector: selectors.periodSelector,
  limitSelector: selectors.limitSelector,
  periodButton: selectors.periodButton,
  limitButton: selectors.limitButton,
  active: selectors.active,
  
  // Charts
  chartsGrid: charts.chartsGrid,
  chartCard: charts.chartCard,
  chartTitle: charts.chartTitle,
  chartIcon: charts.chartIcon,
  
  // Tables
  tablesGrid: tables.tablesGrid,
  tableColumn: tables.tableColumn,
  tableContainer: tables.tableContainer,
  tableTitle: tables.tableTitle,
  statsTable: tables.statsTable,
  relayId: tables.relayId,
  hoursOn: tables.hoursOn,
  hoursOff: tables.hoursOff,
  progressCell: tables.progressCell,
  progressBar: tables.progressBar,
  statusDot: tables.statusDot,
  statusHigh: tables.statusHigh,
  statusLow: tables.statusLow,
  
  // Historico
  historicoTable: historico.historicoTable,
  relayOn: historico.relayOn,
  relayOff: historico.relayOff,
  luxValue: historico.luxValue,
  emptyState: historico.emptyState,
  emptyIcon: historico.emptyIcon,
  
  // Search
  searchSection: search.searchSection,
  searchContainer: search.searchContainer,
  searchInput: search.searchInput,
  searchButton: search.searchButton,
  clearButton: search.clearButton,
  searchResults: search.searchResults,
  searchResultsHeader: search.searchResultsHeader,
  searchResultsCount: search.searchResultsCount,
  searchResultsTable: search.searchResultsTable,
  noResults: search.noResults,
  
  // Loading
  loading: loading.loading,
  spinner: loading.spinner,
  error: loading.error,
  
  // Responsive (los media queries se aplican automáticamente)
};

export default styles;