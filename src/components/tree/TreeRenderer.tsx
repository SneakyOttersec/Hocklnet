import type { TreeLayout, TreeEdge } from '../../hooks/useTreeLayout';
import { PersonNode } from './PersonNode';

interface Props {
  layout: TreeLayout;
  onPersonClick: (id: string) => void;
  variant: 'classic' | 'parchment' | 'natural' | 'victorian' | 'handdrawn';
  renderEdge?: (edge: TreeEdge, i: number) => React.ReactNode;
  bgElement?: React.ReactNode;
}

function defaultEdge(edge: TreeEdge, i: number, variant: string) {
  const colors: Record<string, { spouse: string; parent: string }> = {
    classic: { spouse: '#cc2a41', parent: '#ccc' },
    parchment: { spouse: '#8B7355', parent: '#a89070' },
    natural: { spouse: '#4CAF50', parent: '#81C784' },
    victorian: { spouse: '#c9a84c', parent: '#8B7355' },
    handdrawn: { spouse: '#666', parent: '#999' },
  };

  const c = colors[variant] || colors.classic;

  if (edge.type === 'spouse') {
    return (
      <line
        key={`s-${i}`}
        x1={edge.fromX}
        y1={edge.fromY}
        x2={edge.toX}
        y2={edge.toY}
        stroke={c.spouse}
        strokeWidth={2}
        strokeDasharray="6,3"
      />
    );
  }

  // Parent-child: draw as curved path
  const midY = (edge.fromY + edge.toY) / 2;
  return (
    <path
      key={`pc-${i}`}
      d={`M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY}, ${edge.toX} ${midY}, ${edge.toX} ${edge.toY}`}
      fill="none"
      stroke={c.parent}
      strokeWidth={1.5}
    />
  );
}

export function TreeRenderer({ layout, onPersonClick, variant, renderEdge, bgElement }: Props) {
  return (
    <svg
      width={layout.width}
      height={layout.height}
      style={{ overflow: 'visible' }}
    >
      {bgElement}
      <g>
        {layout.edges.map((edge, i) =>
          renderEdge ? renderEdge(edge, i) : defaultEdge(edge, i, variant)
        )}
      </g>
      <g>
        {layout.nodes.map((node) => (
          <PersonNode
            key={node.id}
            person={node.person}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            onClick={() => onPersonClick(node.id)}
            variant={variant}
          />
        ))}
      </g>
    </svg>
  );
}
