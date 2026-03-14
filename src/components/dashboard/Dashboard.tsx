import { useTranslation } from 'react-i18next';
import { useGenealogy } from '../../store/GenealogyContext';
import { useTreeStats } from '../../hooks/useTreeStats';
import { FileImport } from '../common/FileImport';
import { StatsCards } from './StatsCards';
import { CompletenessChart } from './CompletenessChart';
import { GeoMap } from './GeoMap';
import { QuickActions } from './QuickActions';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { t } = useTranslation();
  const { state } = useGenealogy();
  const stats = useTreeStats();

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.pageTitle}>{t('dashboard.title')}</h2>

      {!state.isLoaded ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{t('dashboard.noData')}</p>
          <FileImport />
        </div>
      ) : (
        <div className={styles.grid}>
          <div className={styles.statsRow}>
            <StatsCards stats={stats} />
          </div>

          <div className={styles.row}>
            <div className={styles.colWide}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>{t('dashboard.geoMap')}</h3>
                <GeoMap places={stats.uniquePlaces.map(p => p.place)} placeCounts={stats.uniquePlaces} />
              </div>
            </div>
            <div className={styles.colNarrow}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>{t('dashboard.completeness')}</h3>
                <CompletenessChart stats={stats} />
              </div>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>{t('dashboard.quickActions')}</h3>
                <QuickActions />
              </div>
            </div>
          </div>

          <div className={styles.importSection}>
            <FileImport />
          </div>
        </div>
      )}
    </div>
  );
}
