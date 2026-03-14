import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseGenwebFile } from '../parsers/geneweb';
import { getDisplayName, getBirthEvent, getDeathEvent } from '../types/genealogy';
import type { Person } from '../types/genealogy';

const gwContent = readFileSync(
  join(__dirname, '../../jhockl_2026-03-14.gw'),
  'utf-8'
);

describe('GeneWeb Parser', () => {
  const db = parseGenwebFile(gwContent);

  it('should parse persons (expect roughly 75)', () => {
    // GW deduplicates by name, may differ slightly
    expect(db.persons.size).toBeGreaterThanOrEqual(60);
    expect(db.persons.size).toBeLessThanOrEqual(85);
  });

  it('should parse families', () => {
    expect(db.families.size).toBeGreaterThanOrEqual(20);
  });

  function findPersonByName(given: string, surname: string): Person | undefined {
    for (const p of db.persons.values()) {
      if (p.name.given.includes(given) && p.name.surname.includes(surname)) {
        return p;
      }
    }
    return undefined;
  }

  it('should parse person names with underscore-to-space', () => {
    const anna = findPersonByName('Anna Maria', 'FRANK');
    expect(anna).toBeDefined();
    expect(anna!.name.given).toBe('Anna Maria');
  });

  it('should parse birth name in parentheses', () => {
    const jacques = findPersonByName('Jacques', 'Hocquel');
    expect(jacques).toBeDefined();
    expect(jacques!.name.birthName).toBe('Jakob');
  });

  it('should parse birth dates', () => {
    const alain = findPersonByName('Alain', 'Hocquel');
    expect(alain).toBeDefined();
    const birth = getBirthEvent(alain!);
    expect(birth).toBeDefined();
    expect(birth!.date!.day).toBe(15);
    expect(birth!.date!.month).toBe(6);
    expect(birth!.date!.year).toBe(1961);
  });

  it('should parse death dates', () => {
    const jacques = findPersonByName('Jacques', 'Hocquel');
    const death = getDeathEvent(jacques!);
    expect(death).toBeDefined();
    expect(death!.date!.year).toBe(2019);
  });

  it('should parse approximate dates (~)', () => {
    const olga = findPersonByName('Olga', 'KOPPENSTEIN');
    expect(olga).toBeDefined();
    const death = getDeathEvent(olga!);
    expect(death).toBeDefined();
    expect(death!.date!.type).toBe('about');
    expect(death!.date!.year).toBe(2001);
  });

  it('should parse between dates (..)', () => {
    const petrus = findPersonByName('Petrus', 'HOCKL');
    expect(petrus).toBeDefined();
    const birth = getBirthEvent(petrus!);
    expect(birth).toBeDefined();
    expect(birth!.date!.type).toBe('between');
    expect(birth!.date!.year).toBe(1665);
    expect(birth!.date!.year2).toBe(1670);
  });

  it('should parse places', () => {
    const jacques = findPersonByName('Jacques', 'Hocquel');
    const birth = getBirthEvent(jacques!);
    expect(birth!.place).toBeDefined();
    expect(birth!.place!.original).toContain('Lenauheim');
  });

  it('should parse sex correctly', () => {
    const alain = findPersonByName('Alain', 'Hocquel');
    expect(alain!.sex).toBe('M');
    const florence = findPersonByName('Florence', 'Bages');
    expect(florence!.sex).toBe('F');
  });

  it('should parse occupation', () => {
    const madeleine = findPersonByName('Madeleine', 'Busch');
    expect(madeleine).toBeDefined();
    expect(madeleine!.occupation).toBe('Aide soignante');
  });

  it('should parse notes', () => {
    const anton = findPersonByName('Anton', 'HOCKL');
    expect(anton).toBeDefined();
    expect(anton!.notes).toContain('HUCKELL');
  });

  it('should create family with children', () => {
    // Find a family with Alain as husband
    let alainFamily = false;
    for (const fam of db.families.values()) {
      const husband = fam.husbandId ? db.persons.get(fam.husbandId) : undefined;
      if (husband && husband.name.given === 'Alain' && husband.name.surname === 'Hocquel') {
        if (fam.childrenIds.length > 0) {
          alainFamily = true;
          break;
        }
      }
    }
    expect(alainFamily).toBe(true);
  });

  it('should parse marriage events', () => {
    let hasMarriage = false;
    for (const fam of db.families.values()) {
      const marriage = fam.events.find(e => e.type === 'marriage');
      if (marriage?.date?.year === 1689) {
        hasMarriage = true;
        break;
      }
    }
    expect(hasMarriage).toBe(true);
  });

  it('should handle .N disambiguation suffixes', () => {
    // Georg.1 should become just Georg
    const georg = findPersonByName('Georg', 'Müller');
    expect(georg).toBeDefined();
    // Should not have ".1" in the name
    expect(georg!.name.given).not.toContain('.1');
  });
});
