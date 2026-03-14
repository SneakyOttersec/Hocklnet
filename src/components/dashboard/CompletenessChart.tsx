import { useTranslation } from 'react-i18next';
import type { TreeStats } from '../../hooks/useTreeStats';
import styles from './CompletenessChart.module.css';

interface Props {
  stats: TreeStats;
}

export function CompletenessChart({ stats }: Props) {
  const { t } = useTranslation();

  const items = [
    {
      label: t('dashboard.birthsKnown'),
      value: stats.birthsKnown,
      total: stats.totalPersons,
    },
    {
      label: t('dashboard.deathsKnown'),
      value: stats.deathsKnown,
      total: stats.totalPersons,
    },
    {
      label: t('dashboard.placesKnown'),
      value: stats.uniquePlaces.length,
      total: stats.totalPersons,
    },
  ];

  return (
    <div className={styles.chart}>
      {items.map((item) => {
        const pct = item.total > 0 ? Math.round((item.value / item.total) * 100) : 0;
        return (
          <div key={item.label} className={styles.item}>
            <div className={styles.labelRow}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.pct}>{item.value}/{item.total} ({pct}%)</span>
            </div>
            <div className={styles.barBg}>
              <div
                className={styles.barFill}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
