import { useTranslation } from 'react-i18next';
import type { TreeStats } from '../../hooks/useTreeStats';
import styles from './StatsCards.module.css';

interface Props {
  stats: TreeStats;
}

export function StatsCards({ stats }: Props) {
  const { t } = useTranslation();

  const dateRange = stats.earliestYear && stats.latestYear
    ? `${stats.earliestYear} - ${stats.latestYear}`
    : '-';

  const cards = [
    { label: t('dashboard.totalPersons'), value: stats.totalPersons, icon: '👤' },
    { label: t('dashboard.totalFamilies'), value: stats.totalFamilies, icon: '👨‍👩‍👧' },
    { label: t('dashboard.dateRange'), value: dateRange, icon: '📅' },
    { label: t('dashboard.generations'), value: stats.generationDepth || '-', icon: '🌳' },
  ];

  return (
    <>
      {cards.map((card) => (
        <div key={card.label} className={styles.card}>
          <div className={styles.icon}>{card.icon}</div>
          <div className={styles.info}>
            <div className={styles.value}>{card.value}</div>
            <div className={styles.label}>{card.label}</div>
          </div>
        </div>
      ))}
    </>
  );
}
