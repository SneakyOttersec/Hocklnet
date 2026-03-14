export type GwLineType =
  | 'encoding' | 'gwplus' | 'fam' | 'beg' | 'end'
  | 'child' | 'pevt' | 'fevt' | 'notes' | 'cbp'
  | 'comment' | 'empty' | 'text' | 'event' | 'note_line';

export interface GwLine {
  type: GwLineType;
  raw: string;
  lineNumber: number;
}

export function lexGeneweb(input: string): GwLine[] {
  const lines = input.split(/\r?\n/);
  const result: GwLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '') {
      result.push({ type: 'empty', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('encoding:')) {
      result.push({ type: 'encoding', raw, lineNumber: i + 1 });
    } else if (trimmed === 'gwplus') {
      result.push({ type: 'gwplus', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('fam ')) {
      result.push({ type: 'fam', raw, lineNumber: i + 1 });
    } else if (trimmed === 'beg') {
      result.push({ type: 'beg', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('end ') || trimmed === 'end') {
      result.push({ type: 'end', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('- ')) {
      result.push({ type: 'child', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('pevt ')) {
      result.push({ type: 'pevt', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('fevt')) {
      result.push({ type: 'fevt', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('notes ')) {
      result.push({ type: 'notes', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('cbp ')) {
      result.push({ type: 'cbp', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('#')) {
      result.push({ type: 'event', raw, lineNumber: i + 1 });
    } else if (trimmed.startsWith('note ')) {
      result.push({ type: 'note_line', raw, lineNumber: i + 1 });
    } else {
      result.push({ type: 'text', raw, lineNumber: i + 1 });
    }
  }

  return result;
}
