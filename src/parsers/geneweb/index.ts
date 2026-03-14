import { lexGeneweb } from './lexer';
import { parseGwLines } from './parser';
import { transformGeneweb } from './transformer';
import type { GenealogyDatabase } from '../../types/genealogy';

export function parseGenwebFile(input: string): GenealogyDatabase {
  const tokens = lexGeneweb(input);
  const blocks = parseGwLines(tokens);
  return transformGeneweb(blocks);
}

export { lexGeneweb } from './lexer';
export { parseGwLines } from './parser';
export { transformGeneweb } from './transformer';
