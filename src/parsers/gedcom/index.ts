import { lexGedcom } from './lexer';
import { parseGedcomTokens } from './parser';
import { transformGedcom } from './transformer';
import type { GenealogyDatabase } from '../../types/genealogy';

export function parseGedcomFile(input: string): GenealogyDatabase {
  const tokens = lexGedcom(input);
  const nodes = parseGedcomTokens(tokens);
  return transformGedcom(nodes);
}

export { lexGedcom } from './lexer';
export { parseGedcomTokens } from './parser';
export { transformGedcom } from './transformer';
