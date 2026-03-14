import { useMemo } from 'react';
import { useGenealogy } from '../store/GenealogyContext';
import type { Person, GeneEvent, GenePlace } from '../types/genealogy';

export interface TreeStats {
  totalPersons: number;
  totalFamilies: number;
  maleCount: number;
  femaleCount: number;
  unknownSexCount: number;
  earliestYear: number | null;
  latestYear: number | null;
  generationDepth: number;
  birthsKnown: number;
  deathsKnown: number;
  placesKnown: number;
  uniquePlaces: GenePlace[];
}

function getYear(event: GeneEvent | undefined): number | null {
  return event?.date?.year ?? null;
}

function countGenerations(
  personId: string,
  persons: Map<string, Person>,
  families: Map<string, { husbandId?: string; wifeId?: string; childrenIds: string[] }>,
  visited: Set<string>,
  direction: 'up' | 'down',
): number {
  if (visited.has(personId)) return 0;
  visited.add(personId);

  const person = persons.get(personId);
  if (!person) return 0;

  if (direction === 'up') {
    // Go to parents
    if (!person.familyAsChildId) return 1;
    const parentFamily = families.get(person.familyAsChildId);
    if (!parentFamily) return 1;

    let maxDepth = 0;
    if (parentFamily.husbandId) {
      maxDepth = Math.max(maxDepth, countGenerations(parentFamily.husbandId, persons, families, visited, 'up'));
    }
    if (parentFamily.wifeId) {
      maxDepth = Math.max(maxDepth, countGenerations(parentFamily.wifeId, persons, families, visited, 'up'));
    }
    return 1 + maxDepth;
  } else {
    // Go to children
    let maxDepth = 0;
    for (const famId of person.familyAsSpouseIds) {
      const family = families.get(famId);
      if (family) {
        for (const childId of family.childrenIds) {
          maxDepth = Math.max(maxDepth, countGenerations(childId, persons, families, visited, 'down'));
        }
      }
    }
    return maxDepth > 0 ? 1 + maxDepth : 1;
  }
}

export function useTreeStats(): TreeStats {
  const { state } = useGenealogy();
  const { database } = state;

  return useMemo(() => {
    const persons = database.persons;
    const families = database.families;

    let maleCount = 0;
    let femaleCount = 0;
    let unknownSexCount = 0;
    let earliestYear: number | null = null;
    let latestYear: number | null = null;
    let birthsKnown = 0;
    let deathsKnown = 0;
    let placesKnown = 0;
    const placeSet = new Map<string, GenePlace>();

    for (const person of persons.values()) {
      if (person.sex === 'M') maleCount++;
      else if (person.sex === 'F') femaleCount++;
      else unknownSexCount++;

      for (const event of person.events) {
        if (event.type === 'birth' && event.date?.year) birthsKnown++;
        if (event.type === 'death' && (event.date?.year || event.date?.raw)) deathsKnown++;

        if (event.place?.original) {
          placesKnown++;
          const key = event.place.original.toLowerCase();
          if (!placeSet.has(key)) {
            placeSet.set(key, event.place);
          }
        }

        const year = getYear(event);
        if (year) {
          if (earliestYear === null || year < earliestYear) earliestYear = year;
          if (latestYear === null || year > latestYear) latestYear = year;
        }
      }
    }

    // Calculate generation depth from root or first person
    let generationDepth = 0;
    if (persons.size > 0) {
      const rootId = state.rootPersonId || persons.keys().next().value;
      if (rootId) {
        const upDepth = countGenerations(rootId, persons, families, new Set(), 'up');
        const downDepth = countGenerations(rootId, persons, families, new Set(), 'down');
        generationDepth = upDepth + downDepth - 1;
      }
    }

    return {
      totalPersons: persons.size,
      totalFamilies: families.size,
      maleCount,
      femaleCount,
      unknownSexCount,
      earliestYear,
      latestYear,
      generationDepth,
      birthsKnown,
      deathsKnown,
      placesKnown,
      uniquePlaces: Array.from(placeSet.values()),
    };
  }, [database, state.rootPersonId]);
}
