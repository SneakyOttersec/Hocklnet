import type { GenealogyDatabase, EntityId } from '../../types/genealogy';
import { useTreeLayout, type TreeEdge } from '../../hooks/useTreeLayout';
import { PanZoomContainer } from './PanZoomContainer';
import { TreeRenderer } from './TreeRenderer';

interface Props {
  database: GenealogyDatabase;
  rootPersonId: EntityId | null;
  onPersonClick: (id: string) => void;
}

function HandDrawnTree({ database, rootPersonId, onPersonClick }: Props) {
  const layout = useTreeLayout(database, rootPersonId);

  const renderEdge = (edge: TreeEdge, i: number) => {
    // Wobbly line effect
    const wobble = () => (Math.random() - 0.5) * 4;

    if (edge.type === 'spouse') {
      const points: string[] = [];
      const steps = 8;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = edge.fromX + (edge.toX - edge.fromX) * t + (s > 0 && s < steps ? wobble() : 0);
        const y = edge.fromY + (edge.toY - edge.fromY) * t + (s > 0 && s < steps ? wobble() : 0);
        points.push(`${x},${y}`);
      }
      return (
        <polyline
          key={`s-${i}`}
          points={points.join(' ')}
          fill="none"
          stroke="#666"
          strokeWidth={1.5}
          strokeDasharray="6,4"
        />
      );
    }

    // Wobbly curve
    const midY = (edge.fromY + edge.toY) / 2;
    return (
      <path
        key={`pc-${i}`}
        d={`M ${edge.fromX + wobble()} ${edge.fromY + wobble()} C ${edge.fromX + wobble()} ${midY + wobble()}, ${edge.toX + wobble()} ${midY + wobble()}, ${edge.toX + wobble()} ${edge.toY + wobble()}`}
        fill="none"
        stroke="#555"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    );
  };

  const bgElement = (
    <>
      <defs>
        <pattern id="graph-paper" patternUnits="userSpaceOnUse" width="20" height="20">
          <rect width="20" height="20" fill="#fef9ef" />
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0dcd4" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={layout.width} height={layout.height} fill="url(#graph-paper)" />
      {/* Watercolor splash effects */}
      {layout.nodes.slice(0, 5).map((node, i) => {
        const colors = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#E8BAFF'];
        return (
          <circle
            key={`splash-${i}`}
            cx={node.x + node.width / 2}
            cy={node.y + node.height / 2}
            r={60}
            fill={colors[i % colors.length]}
            opacity={0.15}
            filter="url(#blur)"
          />
        );
      })}
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="15" />
        </filter>
      </defs>
    </>
  );

  return (
    <PanZoomContainer width={layout.width} height={layout.height}>
      <TreeRenderer
        layout={layout}
        onPersonClick={onPersonClick}
        variant="handdrawn"
        renderEdge={renderEdge}
        bgElement={bgElement}
      />
    </PanZoomContainer>
  );
}

export default HandDrawnTree;
