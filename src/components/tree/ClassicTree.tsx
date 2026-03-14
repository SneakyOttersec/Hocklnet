import type { GenealogyDatabase, EntityId } from '../../types/genealogy';
import { useTreeLayout } from '../../hooks/useTreeLayout';
import { PanZoomContainer } from './PanZoomContainer';
import { TreeRenderer } from './TreeRenderer';

interface Props {
  database: GenealogyDatabase;
  rootPersonId: EntityId | null;
  onPersonClick: (id: string) => void;
}

function ClassicTree({ database, rootPersonId, onPersonClick }: Props) {
  const layout = useTreeLayout(database, rootPersonId);

  return (
    <PanZoomContainer width={layout.width} height={layout.height}>
      <TreeRenderer
        layout={layout}
        onPersonClick={onPersonClick}
        variant="classic"
      />
    </PanZoomContainer>
  );
}

export default ClassicTree;
