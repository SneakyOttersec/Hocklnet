export interface GedcomToken {
  level: number;
  tag: string;
  xref?: string;
  value?: string;
  lineNumber: number;
}

export function lexGedcom(input: string): GedcomToken[] {
  const lines = input.split(/\r?\n/);
  const tokens: GedcomToken[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // GEDCOM line: LEVEL [XREF] TAG [VALUE]
    // e.g.: 0 @I1@ INDI
    //        1 NAME John /Doe/
    const match = line.match(/^(\d+)\s+(?:(@\w+@)\s+)?(\S+)(?:\s+(.*))?$/);
    if (!match) continue;

    tokens.push({
      level: parseInt(match[1], 10),
      xref: match[2] || undefined,
      tag: match[3],
      value: match[4] || undefined,
      lineNumber: i + 1,
    });
  }

  return tokens;
}
