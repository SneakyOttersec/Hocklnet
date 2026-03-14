import { useTranslation } from 'react-i18next';
import type { VizMode } from '../../store/GenealogyContext';
import styles from './TreeToolbar.module.css';

interface Props {
  mode: VizMode;
  onModeChange: (mode: VizMode) => void;
}

const VIZ_MODES: { value: VizMode; labelKey: string }[] = [
  { value: 'classic', labelKey: 'tree.classic' },
  { value: 'parchment', labelKey: 'tree.parchment' },
  { value: 'natural', labelKey: 'tree.natural' },
  { value: 'victorian', labelKey: 'tree.victorian' },
  { value: 'handdrawn', labelKey: 'tree.handdrawn' },
];

export function TreeToolbar({ mode, onModeChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className={styles.toolbar}>
      <h2 className={styles.title}>{t('tree.title')}</h2>
      <div className={styles.controls}>
        <label className={styles.label}>{t('tree.selectMode')}</label>
        <select
          className={styles.select}
          value={mode}
          onChange={(e) => onModeChange(e.target.value as VizMode)}
        >
          {VIZ_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {t(m.labelKey)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
