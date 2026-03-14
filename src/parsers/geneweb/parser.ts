import type { GwLine } from './lexer';

export interface GwFamBlock {
  type: 'fam';
  line: string;
  children: string[];
  fevtLines: string[];
}

export interface GwPevtBlock {
  type: 'pevt';
  line: string;
  eventLines: string[];
}

export interface GwNotesBlock {
  type: 'notes';
  line: string;
  textLines: string[];
}

export type GwBlock = GwFamBlock | GwPevtBlock | GwNotesBlock;

export function parseGwLines(lines: GwLine[]): GwBlock[] {
  const blocks: GwBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === 'fam') {
      const block: GwFamBlock = {
        type: 'fam',
        line: line.raw.trim(),
        children: [],
        fevtLines: [],
      };

      i++;
      // Gather fevt block if next
      while (i < lines.length) {
        const cur = lines[i];
        if (cur.type === 'fevt') {
          i++;
          // Read until "end fevt"
          while (i < lines.length) {
            const inner = lines[i];
            if (inner.type === 'end' && inner.raw.trim().startsWith('end fevt')) {
              i++;
              break;
            }
            if (inner.raw.trim()) {
              block.fevtLines.push(inner.raw.trim());
            }
            i++;
          }
        } else if (cur.type === 'cbp') {
          // cbp line - children birth place, skip for now
          i++;
        } else if (cur.type === 'beg') {
          i++;
          while (i < lines.length) {
            const inner = lines[i];
            if (inner.type === 'end' && inner.raw.trim() === 'end') {
              i++;
              break;
            }
            if (inner.type === 'child') {
              block.children.push(inner.raw.trim());
            }
            i++;
          }
        } else if (cur.type === 'empty') {
          i++;
          break;
        } else {
          break;
        }
      }

      blocks.push(block);
    } else if (line.type === 'pevt') {
      const block: GwPevtBlock = {
        type: 'pevt',
        line: line.raw.trim(),
        eventLines: [],
      };
      i++;
      while (i < lines.length) {
        const cur = lines[i];
        if (cur.type === 'end' && cur.raw.trim().startsWith('end pevt')) {
          i++;
          break;
        }
        if (cur.raw.trim()) {
          block.eventLines.push(cur.raw.trim());
        }
        i++;
      }
      blocks.push(block);
    } else if (line.type === 'notes') {
      const block: GwNotesBlock = {
        type: 'notes',
        line: line.raw.trim(),
        textLines: [],
      };
      i++;
      // skip 'beg'
      if (i < lines.length && lines[i].type === 'beg') i++;
      while (i < lines.length) {
        const cur = lines[i];
        if (cur.type === 'end' && cur.raw.trim().startsWith('end notes')) {
          i++;
          break;
        }
        block.textLines.push(cur.raw);
        i++;
      }
      blocks.push(block);
    } else {
      i++;
    }
  }

  return blocks;
}
