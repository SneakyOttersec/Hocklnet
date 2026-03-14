import type { GedcomToken } from './lexer';

export interface GedcomNode {
  tag: string;
  xref?: string;
  value?: string;
  children: GedcomNode[];
}

export function parseGedcomTokens(tokens: GedcomToken[]): GedcomNode[] {
  const roots: GedcomNode[] = [];
  const stack: { node: GedcomNode; level: number }[] = [];

  for (const token of tokens) {
    const node: GedcomNode = {
      tag: token.tag,
      xref: token.xref,
      value: token.value,
      children: [],
    };

    // Handle CONT/CONC: append to parent's value
    if (token.tag === 'CONT' || token.tag === 'CONC') {
      // Find parent
      while (stack.length > 0 && stack[stack.length - 1].level >= token.level) {
        stack.pop();
      }
      if (stack.length > 0) {
        const parent = stack[stack.length - 1].node;
        if (token.tag === 'CONT') {
          parent.value = (parent.value || '') + '\n' + (token.value || '');
        } else {
          parent.value = (parent.value || '') + (token.value || '');
        }
      }
      continue;
    }

    // Pop stack to find correct parent
    while (stack.length > 0 && stack[stack.length - 1].level >= token.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ node, level: token.level });
  }

  return roots;
}
