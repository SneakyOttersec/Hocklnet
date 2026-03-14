import { useMemo } from 'react';
import type { GenealogyDatabase, Person, EntityId } from '../types/genealogy';

export interface TreeNode {
  id: string;
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
  generation: number;
}

export interface TreeEdge {
  from: string;
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'parent-child' | 'spouse';
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const H_GAP = 30;
const V_GAP = 100;

export function useTreeLayout(
  database: GenealogyDatabase,
  rootPersonId: EntityId | null,
): TreeLayout {
  return useMemo(() => {
    if (!rootPersonId || database.persons.size === 0) {
      return { nodes: [], edges: [], width: 0, height: 0 };
    }

    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];
    const placed = new Set<string>();
    const nodeMap = new Map<string, TreeNode>();

    // Build generation assignments by traversing up from root then down
    const generations = new Map<string, number>();

    function assignGenerationsUp(personId: string, gen: number) {
      if (generations.has(personId)) return;
      generations.set(personId, gen);

      const person = database.persons.get(personId);
      if (!person?.familyAsChildId) return;

      const family = database.families.get(person.familyAsChildId);
      if (!family) return;

      if (family.husbandId) assignGenerationsUp(family.husbandId, gen - 1);
      if (family.wifeId) assignGenerationsUp(family.wifeId, gen - 1);
    }

    function assignGenerationsDown(personId: string, gen: number) {
      if (generations.has(personId)) {
        // Already assigned from ancestors; use existing
      } else {
        generations.set(personId, gen);
      }

      const person = database.persons.get(personId);
      if (!person) return;

      for (const famId of person.familyAsSpouseIds) {
        const family = database.families.get(famId);
        if (!family) continue;

        // Assign spouse same generation
        const spouseId = person.sex === 'M' ? family.wifeId : family.husbandId;
        if (spouseId && !generations.has(spouseId)) {
          generations.set(spouseId, gen);
        }

        // Assign children next generation
        for (const childId of family.childrenIds) {
          if (!generations.has(childId)) {
            assignGenerationsDown(childId, gen + 1);
          }
        }
      }
    }

    // Start from root: go up first, then down
    assignGenerationsUp(rootPersonId, 0);

    // Go down from root
    assignGenerationsDown(rootPersonId, generations.get(rootPersonId) || 0);

    // Also go down from all ancestors
    for (const [personId, gen] of generations) {
      assignGenerationsDown(personId, gen);
    }

    // Group by generation
    const genGroups = new Map<number, string[]>();
    for (const [personId, gen] of generations) {
      if (!genGroups.has(gen)) genGroups.set(gen, []);
      genGroups.get(gen)!.push(personId);
    }

    // Sort generations
    const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);
    const minGen = sortedGens[0] || 0;

    // Place nodes
    for (const gen of sortedGens) {
      const personIds = genGroups.get(gen)!;
      const row = gen - minGen;
      const y = row * (NODE_HEIGHT + V_GAP) + 50;

      // Sort persons within generation: couples together
      const sorted = sortPersonsByFamily(personIds, database);

      for (let i = 0; i < sorted.length; i++) {
        const personId = sorted[i];
        if (placed.has(personId)) continue;

        const person = database.persons.get(personId);
        if (!person) continue;

        const x = i * (NODE_WIDTH + H_GAP) + 50;
        const node: TreeNode = {
          id: personId,
          person,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          generation: gen,
        };
        nodes.push(node);
        nodeMap.set(personId, node);
        placed.add(personId);
      }
    }

    // Center each generation
    const maxWidth = Math.max(...sortedGens.map(gen => {
      const count = genGroups.get(gen)!.length;
      return count * (NODE_WIDTH + H_GAP);
    }), 0);

    for (const gen of sortedGens) {
      const genNodes = nodes.filter(n => n.generation === gen);
      const totalWidth = genNodes.length * (NODE_WIDTH + H_GAP) - H_GAP;
      const offset = (maxWidth - totalWidth) / 2;
      for (const node of genNodes) {
        node.x += offset;
      }
    }

    // Create edges
    for (const family of database.families.values()) {
      // Spouse edge
      if (family.husbandId && family.wifeId) {
        const h = nodeMap.get(family.husbandId);
        const w = nodeMap.get(family.wifeId);
        if (h && w) {
          edges.push({
            from: family.husbandId,
            to: family.wifeId,
            fromX: h.x + h.width,
            fromY: h.y + h.height / 2,
            toX: w.x,
            toY: w.y + w.height / 2,
            type: 'spouse',
          });
        }
      }

      // Parent-child edges
      const parentIds = [family.husbandId, family.wifeId].filter(Boolean) as string[];
      const parentNode = parentIds.map(id => nodeMap.get(id)).find(Boolean);

      if (parentNode) {
        const midX = parentNode.x + parentNode.width / 2;
        // If both parents, use midpoint between them
        const parent1 = family.husbandId ? nodeMap.get(family.husbandId) : undefined;
        const parent2 = family.wifeId ? nodeMap.get(family.wifeId) : undefined;
        const fromX = (parent1 && parent2)
          ? (parent1.x + parent1.width + parent2.x) / 2
          : midX;
        const fromY = parentNode.y + parentNode.height;

        for (const childId of family.childrenIds) {
          const child = nodeMap.get(childId);
          if (child) {
            edges.push({
              from: parentIds[0],
              to: childId,
              fromX,
              fromY,
              toX: child.x + child.width / 2,
              toY: child.y,
              type: 'parent-child',
            });
          }
        }
      }
    }

    const totalWidth = Math.max(...nodes.map(n => n.x + n.width), 0) + 100;
    const totalHeight = Math.max(...nodes.map(n => n.y + n.height), 0) + 100;

    return { nodes, edges, width: totalWidth, height: totalHeight };
  }, [database, rootPersonId]);
}

function sortPersonsByFamily(personIds: string[], db: GenealogyDatabase): string[] {
  const sorted: string[] = [];
  const used = new Set<string>();

  for (const id of personIds) {
    if (used.has(id)) continue;
    const person = db.persons.get(id);
    if (!person) continue;

    sorted.push(id);
    used.add(id);

    // Add spouses next to this person
    for (const famId of person.familyAsSpouseIds) {
      const family = db.families.get(famId);
      if (!family) continue;
      const spouseId = person.sex === 'M' ? family.wifeId : family.husbandId;
      if (spouseId && !used.has(spouseId) && personIds.includes(spouseId)) {
        sorted.push(spouseId);
        used.add(spouseId);
      }
    }
  }

  // Add any remaining
  for (const id of personIds) {
    if (!used.has(id)) {
      sorted.push(id);
    }
  }

  return sorted;
}
