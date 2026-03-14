import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenealogy, type VizMode } from '../../store/GenealogyContext';
import styles from './SettingsPage.module.css';

const VIZ_OPTIONS: { value: VizMode; labelKey: string }[] = [
  { value: 'classic', labelKey: 'tree.classic' },
  { value: 'parchment', labelKey: 'tree.parchment' },
  { value: 'natural', labelKey: 'tree.natural' },
  { value: 'victorian', labelKey: 'tree.victorian' },
  { value: 'handdrawn', labelKey: 'tree.handdrawn' },
];

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useGenealogy();
  const [useIndexedDb, setUseIndexedDb] = useState(
    localStorage.getItem('hocklnet-idb') === 'true'
  );

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleIndexedDbToggle = () => {
    const newVal = !useIndexedDb;
    setUseIndexedDb(newVal);
    localStorage.setItem('hocklnet-idb', String(newVal));
    window.dispatchEvent(new Event('hocklnet-idb-changed'));
  };

  const handleClearData = () => {
    if (window.confirm(t('settings.clearConfirm'))) {
      dispatch({ type: 'CLEAR_DATABASE' });
    }
  };

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>{t('settings.title')}</h2>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settings.language')}</h3>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              name="language"
              checked={i18n.language === 'en'}
              onChange={() => handleLanguageChange('en')}
            />
            {t('settings.english')}
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="language"
              checked={i18n.language === 'fr'}
              onChange={() => handleLanguageChange('fr')}
            />
            {t('settings.french')}
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settings.defaultViz')}</h3>
        <select
          className={styles.select}
          value={state.vizMode}
          onChange={(e) => dispatch({ type: 'SET_VIZ_MODE', payload: e.target.value as VizMode })}
        >
          {VIZ_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('settings.persistence')}</h3>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={useIndexedDb}
            onChange={handleIndexedDbToggle}
          />
          <span className={styles.toggleLabel}>{t('settings.indexedDb')}</span>
        </label>
        <p className={styles.description}>{t('settings.indexedDbDesc')}</p>
      </div>

      <div className={styles.section}>
        <button className={styles.dangerBtn} onClick={handleClearData}>
          {t('settings.clearData')}
        </button>
      </div>
    </div>
  );
}
