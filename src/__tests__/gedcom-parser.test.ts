import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseGedcomFile } from '../parsers/gedcom';
import { getDisplayName, getBirthEvent, getDeathEvent } from '../types/genealogy';

const gedcomContent = readFileSync(
  join(__dirname, '../../jhockl_2026-03-14.ged'),
  'utf-8'
);

describe('GEDCOM Parser', () => {
  const db = parseGedcomFile(gedcomContent);

  it('should parse all 75 persons', () => {
    expect(db.persons.size).toBe(75);
  });

  it('should parse all 27 families', () => {
    expect(db.families.size).toBe(27);
  });

  it('should parse person names correctly', () => {
    const alain = db.persons.get('I1');
    expect(alain).toBeDefined();
    expect(alain!.name.given).toBe('Alain');
    expect(alain!.name.surname).toBe('Hocquel');
    expect(alain!.sex).toBe('M');
  });

  it('should parse birth name in parentheses', () => {
    const jacques = db.persons.get('I5');
    expect(jacques).toBeDefined();
    expect(jacques!.name.given).toBe('Jacques');
    expect(jacques!.name.birthName).toBe('Jakob');
    expect(jacques!.name.surname).toBe('Hocquel');
  });

  it('should parse birth events', () => {
    const alain = db.persons.get('I1');
    const birth = getBirthEvent(alain!);
    expect(birth).toBeDefined();
    expect(birth!.date!.day).toBe(15);
    expect(birth!.date!.month).toBe(6);
    expect(birth!.date!.year).toBe(1961);
  });

  it('should parse death events', () => {
    const jacques = db.persons.get('I5');
    const death = getDeathEvent(jacques!);
    expect(death).toBeDefined();
    expect(death!.date!.year).toBe(2019);
    expect(death!.place!.original).toContain('Carpentras');
  });

  it('should parse birth places', () => {
    const jacques = db.persons.get('I5');
    const birth = getBirthEvent(jacques!);
    expect(birth!.place).toBeDefined();
    expect(birth!.place!.original).toContain('Lenauheim');
  });

  it('should parse ABT dates', () => {
    const olga = db.persons.get('I11');
    const death = getDeathEvent(olga!);
    expect(death).toBeDefined();
    expect(death!.date!.type).toBe('about');
    expect(death!.date!.year).toBe(2001);
  });

  it('should parse BET...AND dates', () => {
    const petrus = db.persons.get('I74');
    const birth = getBirthEvent(petrus!);
    expect(birth).toBeDefined();
    expect(birth!.date!.type).toBe('between');
    expect(birth!.date!.year).toBe(1665);
    expect(birth!.date!.year2).toBe(1670);
  });

  it('should parse AFT dates', () => {
    const franz = db.persons.get('I24');
    const death = getDeathEvent(franz!);
    expect(death).toBeDefined();
    expect(death!.date!.type).toBe('after');
    expect(death!.date!.year).toBe(1829);
  });

  it('should parse family relationships', () => {
    const f2 = db.families.get('F2');
    expect(f2).toBeDefined();
    expect(f2!.husbandId).toBe('I1');
    expect(f2!.wifeId).toBe('I2');
    expect(f2!.childrenIds).toContain('I3');
  });

  it('should parse marriage events', () => {
    const f27 = db.families.get('F27');
    expect(f27).toBeDefined();
    const marriage = f27!.events.find(e => e.type === 'marriage');
    expect(marriage).toBeDefined();
    expect(marriage!.date!.year).toBe(1689);
    expect(marriage!.place!.original).toContain('Berghausen');
  });

  it('should parse divorce events', () => {
    const f2 = db.families.get('F2');
    const div = f2!.events.find(e => e.type === 'divorce');
    expect(div).toBeDefined();
    expect(div!.date!.year).toBe(2005);
  });

  it('should parse occupation', () => {
    const madeleine = db.persons.get('I6');
    expect(madeleine!.occupation).toBe('Aide soignante');
  });

  it('should parse CONT notes', () => {
    const franz = db.persons.get('I33');
    expect(franz!.notes).toBeDefined();
    expect(franz!.notes).toContain('Ottenschlag');
  });

  it('should link FAMC correctly', () => {
    const alain = db.persons.get('I1');
    expect(alain!.familyAsChildId).toBe('F1');
  });

  it('should link FAMS correctly', () => {
    const alain = db.persons.get('I1');
    expect(alain!.familyAsSpouseIds).toContain('F2');
    expect(alain!.familyAsSpouseIds).toContain('F3');
  });

  it('should handle family F22 with 13 children', () => {
    const f22 = db.families.get('F22');
    expect(f22).toBeDefined();
    expect(f22!.childrenIds.length).toBe(13);
  });

  it('should parse metadata', () => {
    expect(db.metadata.source).toBe('Geneanet');
    expect(db.metadata.charset).toBe('UTF-8');
  });
});
