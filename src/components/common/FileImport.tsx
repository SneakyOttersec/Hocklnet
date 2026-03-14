import { useState, useRef, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileImport } from '../../hooks/useFileImport';
import styles from './FileImport.module.css';

export function FileImport() {
  const { t } = useTranslation();
  const { importFile } = useFileImport();
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      setStatus(null);
      const result = await importFile(file);
      setStatus({
        type: 'success',
        message: t('import.success', { count: result.persons, families: result.families }),
      });
    } catch (err) {
      setStatus({
        type: 'error',
        message: t('import.error', { message: (err as Error).message }),
      });
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <p className={styles.text}>{t('import.dragDrop')}</p>
      <p className={styles.or}>{t('import.or')}</p>
      <button className={styles.browseBtn} onClick={() => fileInputRef.current?.click()}>
        {t('import.browse')}
      </button>
      <p className={styles.formats}>{t('import.supported')}</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".ged,.gw"
        className={styles.hiddenInput}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {status && (
        <div className={`${styles.status} ${styles[status.type]}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
