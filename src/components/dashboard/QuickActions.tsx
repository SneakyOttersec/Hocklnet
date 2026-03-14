import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useGenealogy } from '../../store/GenealogyContext';
import { ExportDialog } from '../modals/ExportDialog';
import { PersonForm } from '../forms/PersonForm';
import { FamilyForm } from '../forms/FamilyForm';
import styles from './QuickActions.module.css';

export function QuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useGenealogy();
  const [showExport, setShowExport] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);

  return (
    <div className={styles.actions}>
      <button className={styles.btn} onClick={() => navigate('/tree')}>
        {t('nav.tree')}
      </button>
      <button className={styles.btn} onClick={() => setShowAddPerson(true)}>
        {t('common.add')} {t('form.person')}
      </button>
      <button className={styles.btn} onClick={() => setShowAddFamily(true)}>
        {t('common.add')} {t('form.family')}
      </button>
      {state.isLoaded && (
        <button className={styles.btn} onClick={() => setShowExport(true)}>
          {t('dashboard.exportData')}
        </button>
      )}
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showAddPerson && <PersonForm onClose={() => setShowAddPerson(false)} />}
      {showAddFamily && <FamilyForm onClose={() => setShowAddFamily(false)} />}
    </div>
  );
}
