import React, { Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenealogy, type VizMode } from '../../store/GenealogyContext';
import { FileImport } from '../common/FileImport';
import { PersonModal } from '../modals/PersonModal';
import { TreeToolbar } from './TreeToolbar';
import styles from './TreeWorkspace.module.css';

const ClassicTree = React.lazy(() => import('./ClassicTree'));
const ParchmentTree = React.lazy(() => import('./ParchmentTree'));
const NaturalTree = React.lazy(() => import('./NaturalTree'));
const VictorianTree = React.lazy(() => import('./VictorianTree'));
const HandDrawnTree = React.lazy(() => import('./HandDrawnTree'));

export function TreeWorkspace() {
  const { t } = useTranslation();
  const { state, dispatch } = useGenealogy();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  if (!state.isLoaded) {
    return (
      <div className={styles.emptyState}>
        <p>{t('tree.noData')}</p>
        <FileImport />
      </div>
    );
  }

  const handlePersonClick = (id: string) => {
    setSelectedPersonId(id);
  };

  const handleNavigate = (id: string) => {
    setSelectedPersonId(id);
  };

  const handleSetMode = (mode: VizMode) => {
    dispatch({ type: 'SET_VIZ_MODE', payload: mode });
  };

  const TreeComponent = {
    classic: ClassicTree,
    parchment: ParchmentTree,
    natural: NaturalTree,
    victorian: VictorianTree,
    handdrawn: HandDrawnTree,
  }[state.vizMode];

  return (
    <div className={styles.workspace}>
      <TreeToolbar mode={state.vizMode} onModeChange={handleSetMode} />
      <div className={styles.treeContainer}>
        <Suspense fallback={<div className={styles.loading}>{t('common.loading')}</div>}>
          <TreeComponent
            database={state.database}
            rootPersonId={state.rootPersonId}
            onPersonClick={handlePersonClick}
          />
        </Suspense>
      </div>

      {selectedPersonId && (
        <PersonModal
          personId={selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
