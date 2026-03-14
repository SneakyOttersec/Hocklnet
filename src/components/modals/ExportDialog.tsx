import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenealogy } from '../../store/GenealogyContext';
import { serializeGedcom } from '../../parsers/gedcom/serializer';
import { serializeGeneweb } from '../../parsers/geneweb/serializer';
import styles from './Modal.module.css';

interface Props {
  onClose: () => void;
}

export function ExportDialog({ onClose }: Props) {
  const { t } = useTranslation();
  const { state } = useGenealogy();
  const [format, setFormat] = useState<'ged' | 'gw'>('ged');

  const handleExport = () => {
    const { database } = state;
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'ged') {
      content = serializeGedcom(database);
      filename = 'family-tree.ged';
      mimeType = 'text/plain';
    } else {
      content = serializeGeneweb(database);
      filename = 'family-tree.gw';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{t('export.title')}</h3>

        <div className={styles.field}>
          <label className={styles.label}>{t('export.format')}</label>
          <select
            className={styles.select}
            value={format}
            onChange={(e) => setFormat(e.target.value as 'ged' | 'gw')}
          >
            <option value="ged">{t('export.gedcom')}</option>
            <option value="gw">{t('export.geneweb')}</option>
          </select>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            {t('export.cancel')}
          </button>
          <button className={styles.btnPrimary} onClick={handleExport}>
            {t('export.download')}
          </button>
        </div>
      </div>
    </div>
  );
}
