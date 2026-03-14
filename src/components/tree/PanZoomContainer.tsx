import { useRef, useEffect, type ReactNode } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import styles from './PanZoomContainer.module.css';

interface Props {
  children: ReactNode;
  width: number;
  height: number;
  className?: string;
}

export function PanZoomContainer({ children, width, height, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = select(containerRef.current);
    const content = contentRef.current;

    const zoomBehavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform;
        content.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
        content.style.transformOrigin = '0 0';
      });

    container.call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    // Initial fit
    const containerRect = containerRef.current.getBoundingClientRect();
    if (width > 0 && height > 0) {
      const scaleX = containerRect.width / width;
      const scaleY = containerRect.height / height;
      const scale = Math.min(scaleX, scaleY, 1) * 0.9;
      const tx = (containerRect.width - width * scale) / 2;
      const ty = 20;

      container.call(
        zoomBehavior.transform,
        zoomIdentity.translate(tx, ty).scale(scale)
      );
    }

    return () => {
      container.on('.zoom', null);
    };
  }, [width, height]);

  return (
    <div ref={containerRef} className={`${styles.container} ${className || ''}`}>
      <div ref={contentRef} className={styles.content}>
        {children}
      </div>
    </div>
  );
}
