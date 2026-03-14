import type { Person } from '../../types/genealogy';
import { getDisplayName, getBirthEvent, getDeathEvent } from '../../types/genealogy';
import styles from './PersonNode.module.css';

interface Props {
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick: () => void;
  variant?: 'classic' | 'parchment' | 'natural' | 'victorian' | 'handdrawn';
}

export function PersonNode({ person, x, y, width, height, onClick, variant = 'classic' }: Props) {
  const birth = getBirthEvent(person);
  const death = getDeathEvent(person);
  const isDeceased = !!death;

  const birthYear = birth?.date?.year ? String(birth.date.year) : '';
  const deathYear = death?.date?.year ? String(death.date.year) : (isDeceased ? '?' : '');
  const lifespan = birthYear || deathYear
    ? `${birthYear} - ${deathYear}`
    : '';

  return (
    <g
      className={`${styles.node} ${styles[variant]}`}
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <rect
        width={width}
        height={height}
        rx={variant === 'victorian' ? 0 : 8}
        className={`${styles.card} ${styles[`card_${variant}`]} ${person.sex === 'M' ? styles.male : person.sex === 'F' ? styles.female : ''}`}
      />
      {variant === 'victorian' && (
        <rect
          x={-2}
          y={-2}
          width={width + 4}
          height={height + 4}
          rx={0}
          fill="none"
          stroke="#c9a84c"
          strokeWidth={2}
        />
      )}
      <text
        x={width / 2}
        y={24}
        textAnchor="middle"
        className={`${styles.name} ${styles[`name_${variant}`]}`}
      >
        {getDisplayName(person)}
      </text>
      {lifespan && (
        <text
          x={width / 2}
          y={44}
          textAnchor="middle"
          className={`${styles.dates} ${styles[`dates_${variant}`]}`}
        >
          {lifespan}
        </text>
      )}
      {birth?.place?.city && (
        <text
          x={width / 2}
          y={60}
          textAnchor="middle"
          className={`${styles.place} ${styles[`place_${variant}`]}`}
        >
          {birth.place.city}
        </text>
      )}
      {/* Sex indicator */}
      <circle
        cx={width - 12}
        cy={12}
        r={6}
        className={`${styles.sexDot} ${person.sex === 'M' ? styles.dotMale : styles.dotFemale}`}
      />
    </g>
  );
}
