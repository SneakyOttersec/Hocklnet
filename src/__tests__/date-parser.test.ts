import { describe, it, expect } from 'vitest';
import {
  parseGedcomDate,
  parseGenwebDate,
  formatDate,
  dateToGedcom,
  dateToGeneweb,
} from '../parsers/date-parser';

describe('GEDCOM Date Parser', () => {
  it('should parse exact date', () => {
    const d = parseGedcomDate('15 JUN 1961');
    expect(d.type).toBe('exact');
    expect(d.day).toBe(15);
    expect(d.month).toBe(6);
    expect(d.year).toBe(1961);
  });

  it('should parse year only', () => {
    const d = parseGedcomDate('1916');
    expect(d.type).toBe('exact');
    expect(d.year).toBe(1916);
  });

  it('should parse ABT date', () => {
    const d = parseGedcomDate('ABT 2001');
    expect(d.type).toBe('about');
    expect(d.year).toBe(2001);
  });

  it('should parse AFT date', () => {
    const d = parseGedcomDate('AFT 1829');
    expect(d.type).toBe('after');
    expect(d.year).toBe(1829);
  });

  it('should parse BEF date', () => {
    const d = parseGedcomDate('BEF 1900');
    expect(d.type).toBe('before');
    expect(d.year).toBe(1900);
  });

  it('should parse BET...AND date', () => {
    const d = parseGedcomDate('BET 1665 AND 01 JAN 1670');
    expect(d.type).toBe('between');
    expect(d.year).toBe(1665);
    expect(d.day2).toBe(1);
    expect(d.month2).toBe(1);
    expect(d.year2).toBe(1670);
  });

  it('should parse month and year', () => {
    const d = parseGedcomDate('MAR 2026');
    expect(d.month).toBe(3);
    expect(d.year).toBe(2026);
  });
});

describe('GeneWeb Date Parser', () => {
  it('should parse d/m/y format', () => {
    const d = parseGenwebDate('15/6/1961');
    expect(d.type).toBe('exact');
    expect(d.day).toBe(15);
    expect(d.month).toBe(6);
    expect(d.year).toBe(1961);
  });

  it('should parse year only', () => {
    const d = parseGenwebDate('1916');
    expect(d.type).toBe('exact');
    expect(d.year).toBe(1916);
  });

  it('should parse ~ (about)', () => {
    const d = parseGenwebDate('~2001');
    expect(d.type).toBe('about');
    expect(d.year).toBe(2001);
  });

  it('should parse > (after)', () => {
    const d = parseGenwebDate('>1829');
    expect(d.type).toBe('after');
    expect(d.year).toBe(1829);
  });

  it('should parse < (before)', () => {
    const d = parseGenwebDate('<1900');
    expect(d.type).toBe('before');
    expect(d.year).toBe(1900);
  });

  it('should parse .. (between)', () => {
    const d = parseGenwebDate('1665..1670');
    expect(d.type).toBe('between');
    expect(d.year).toBe(1665);
    expect(d.year2).toBe(1670);
  });
});

describe('formatDate', () => {
  it('should format exact date in English', () => {
    const result = formatDate({ type: 'exact', day: 15, month: 6, year: 1961, raw: '' });
    expect(result).toBe('15 June 1961');
  });

  it('should format exact date in French', () => {
    const result = formatDate({ type: 'exact', day: 15, month: 6, year: 1961, raw: '' }, 'fr');
    expect(result).toBe('15 juin 1961');
  });

  it('should format about date', () => {
    const result = formatDate({ type: 'about', year: 2001, raw: '' });
    expect(result).toBe('about 2001');
  });

  it('should format between date', () => {
    const result = formatDate({ type: 'between', year: 1665, year2: 1670, raw: '' });
    expect(result).toBe('between 1665 and 1670');
  });
});

describe('dateToGedcom', () => {
  it('should serialize exact date', () => {
    expect(dateToGedcom({ type: 'exact', day: 15, month: 6, year: 1961, raw: '' }))
      .toBe('15 JUN 1961');
  });

  it('should serialize about date', () => {
    expect(dateToGedcom({ type: 'about', year: 2001, raw: '' }))
      .toBe('ABT 2001');
  });

  it('should serialize between date', () => {
    expect(dateToGedcom({ type: 'between', year: 1665, year2: 1670, raw: '' }))
      .toBe('BET 1665 AND 1670');
  });
});

describe('dateToGeneweb', () => {
  it('should serialize exact date', () => {
    expect(dateToGeneweb({ type: 'exact', day: 15, month: 6, year: 1961, raw: '' }))
      .toBe('15/6/1961');
  });

  it('should serialize about date', () => {
    expect(dateToGeneweb({ type: 'about', year: 2001, raw: '' }))
      .toBe('~2001');
  });

  it('should serialize between date', () => {
    expect(dateToGeneweb({ type: 'between', year: 1665, year2: 1670, raw: '' }))
      .toBe('1665..1670');
  });
});
