import type { GenealogyDatabase, EntityId } from '../../types/genealogy';
import { useTreeLayout, type TreeEdge } from '../../hooks/useTreeLayout';
import { PanZoomContainer } from './PanZoomContainer';
import { TreeRenderer } from './TreeRenderer';

interface Props {
  database: GenealogyDatabase;
  rootPersonId: EntityId | null;
  onPersonClick: (id: string) => void;
}

function VictorianTree({ database, rootPersonId, onPersonClick }: Props) {
  const layout = useTreeLayout(database, rootPersonId);

  const renderEdge = (edge: TreeEdge, i: number) => {
    if (edge.type === 'spouse') {
      return (
        <g key={`s-${i}`}>
          <line
            x1={edge.fromX} y1={edge.fromY}
            x2={edge.toX} y2={edge.toY}
            stroke="#c9a84c"
            strokeWidth={2}
          />
          {/* Fleur-de-lis endpoints */}
          <circle cx={edge.fromX} cy={edge.fromY} r={3} fill="#c9a84c" />
          <circle cx={edge.toX} cy={edge.toY} r={3} fill="#c9a84c" />
        </g>
      );
    }
    // Ornate scrollwork connector
    const midY = (edge.fromY + edge.toY) / 2;
    return (
      <g key={`pc-${i}`}>
        <path
          d={`M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY}, ${edge.toX} ${midY}, ${edge.toX} ${edge.toY}`}
          fill="none"
          stroke="#c9a84c"
          strokeWidth={2}
        />
        <circle cx={edge.fromX} cy={edge.fromY} r={3} fill="#c9a84c" />
        <circle cx={edge.toX} cy={edge.toY} r={3} fill="#c9a84c" />
      </g>
    );
  };

  const bgElement = (
    <>
      <defs>
        <pattern id="damask" patternUnits="userSpaceOnUse" width="60" height="60">
          <rect width="60" height="60" fill="#1a1a2e" />
          <circle cx="30" cy="30" r="15" fill="none" stroke="#252545" strokeWidth="0.5" />
          <circle cx="0" cy="0" r="15" fill="none" stroke="#252545" strokeWidth="0.5" />
          <circle cx="60" cy="0" r="15" fill="none" stroke="#252545" strokeWidth="0.5" />
          <circle cx="0" cy="60" r="15" fill="none" stroke="#252545" strokeWidth="0.5" />
          <circle cx="60" cy="60" r="15" fill="none" stroke="#252545" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={layout.width} height={layout.height} fill="url(#damask)" />
    </>
  );

  return (
    <PanZoomContainer width={layout.width} height={layout.height}>
      <TreeRenderer
        layout={layout}
        onPersonClick={onPersonClick}
        variant="victorian"
        renderEdge={renderEdge}
        bgElement={bgElement}
      />
    </PanZoomContainer>
  );
}

export default VictorianTree;
