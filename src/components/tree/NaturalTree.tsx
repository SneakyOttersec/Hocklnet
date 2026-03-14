import type { GenealogyDatabase, EntityId } from '../../types/genealogy';
import { useTreeLayout, type TreeEdge } from '../../hooks/useTreeLayout';
import { PanZoomContainer } from './PanZoomContainer';
import { TreeRenderer } from './TreeRenderer';

interface Props {
  database: GenealogyDatabase;
  rootPersonId: EntityId | null;
  onPersonClick: (id: string) => void;
}

function NaturalTree({ database, rootPersonId, onPersonClick }: Props) {
  const layout = useTreeLayout(database, rootPersonId);

  const renderEdge = (edge: TreeEdge, i: number) => {
    if (edge.type === 'spouse') {
      return (
        <line
          key={`s-${i}`}
          x1={edge.fromX} y1={edge.fromY}
          x2={edge.toX} y2={edge.toY}
          stroke="#4CAF50"
          strokeWidth={2}
          strokeDasharray="6,3"
        />
      );
    }
    // Organic branch curve
    const midY = (edge.fromY + edge.toY) / 2;
    return (
      <path
        key={`pc-${i}`}
        d={`M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY + 20}, ${edge.toX} ${midY - 20}, ${edge.toX} ${edge.toY}`}
        fill="none"
        stroke="#795548"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.8}
      />
    );
  };

  const bgElement = (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="60%" stopColor="#E8F5E9" />
          <stop offset="100%" stopColor="#A5D6A7" />
        </linearGradient>
      </defs>
      <rect width={layout.width} height={layout.height} fill="url(#sky)" />
    </>
  );

  return (
    <PanZoomContainer width={layout.width} height={layout.height}>
      <TreeRenderer
        layout={layout}
        onPersonClick={onPersonClick}
        variant="natural"
        renderEdge={renderEdge}
        bgElement={bgElement}
      />
    </PanZoomContainer>
  );
}

export default NaturalTree;
