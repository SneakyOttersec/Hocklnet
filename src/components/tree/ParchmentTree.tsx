import type { GenealogyDatabase, EntityId } from '../../types/genealogy';
import { useTreeLayout, type TreeEdge } from '../../hooks/useTreeLayout';
import { PanZoomContainer } from './PanZoomContainer';
import { TreeRenderer } from './TreeRenderer';

interface Props {
  database: GenealogyDatabase;
  rootPersonId: EntityId | null;
  onPersonClick: (id: string) => void;
}

function ParchmentTree({ database, rootPersonId, onPersonClick }: Props) {
  const layout = useTreeLayout(database, rootPersonId);

  const renderEdge = (edge: TreeEdge, i: number) => {
    if (edge.type === 'spouse') {
      return (
        <line
          key={`s-${i}`}
          x1={edge.fromX} y1={edge.fromY}
          x2={edge.toX} y2={edge.toY}
          stroke="#8B7355"
          strokeWidth={2}
          strokeDasharray="8,4"
        />
      );
    }
    // Ornate hand-drawn-style Bezier
    const midY = (edge.fromY + edge.toY) / 2;
    const cp1x = edge.fromX + (Math.random() - 0.5) * 10;
    const cp2x = edge.toX + (Math.random() - 0.5) * 10;
    return (
      <path
        key={`pc-${i}`}
        d={`M ${edge.fromX} ${edge.fromY} C ${cp1x} ${midY}, ${cp2x} ${midY}, ${edge.toX} ${edge.toY}`}
        fill="none"
        stroke="#5C4033"
        strokeWidth={2}
        opacity={0.7}
      />
    );
  };

  const bgElement = (
    <rect width={layout.width} height={layout.height} fill="#F5E6C8" rx={0} />
  );

  return (
    <PanZoomContainer
      width={layout.width}
      height={layout.height}
      className="parchment-bg"
    >
      <TreeRenderer
        layout={layout}
        onPersonClick={onPersonClick}
        variant="parchment"
        renderEdge={renderEdge}
        bgElement={bgElement}
      />
    </PanZoomContainer>
  );
}

export default ParchmentTree;
