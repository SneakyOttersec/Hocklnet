import type { GeneDate } from '../types/genealogy';

const GEDCOM_MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

const MONTH_TO_GEDCOM: Record<number, string> = {
  1: 'JAN', 2: 'FEB', 3: 'MAR', 4: 'APR', 5: 'MAY', 6: 'JUN',
  7: 'JUL', 8: 'AUG', 9: 'SEP', 10: 'OCT', 11: 'NOV', 12: 'DEC',
};

const MONTH_NAMES_EN: Record<number, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December',
};

const MONTH_NAMES_FR: Record<number, string> = {
  1: 'janvier', 2: 'février', 3: 'mars', 4: 'avril',
  5: 'mai', 6: 'juin', 7: 'juillet', 8: 'août',
  9: 'septembre', 10: 'octobre', 11: 'novembre', 12: 'décembre',
};

function parseSimpleDate(parts: string[]): Partial<GeneDate> {
  const result: Partial<GeneDate> = {};
  for (const part of parts) {
    const upper = part.toUpperCase();
    if (GEDCOM_MONTHS[upper]) {
      result.month = GEDCOM_MONTHS[upper];
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        if (num > 31) {
          result.year = num;
        } else if (result.month !== undefined || parts.indexOf(part) === 0 && parts.length >= 2) {
          if (result.day === undefined && num <= 31 && parts.indexOf(part) < parts.length - 1) {
            result.day = num;
          } else {
            result.year = num;
          }
        } else {
          result.year = num;
        }
      }
    }
  }
  return result;
}

export function parseGedcomDate(raw: string): GeneDate {
  if (!raw || raw.trim() === '') {
    return { type: 'exact', raw: raw || '' };
  }
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();

  // BET ... AND ...
  const betMatch = upper.match(/^BET\s+(.+?)\s+AND\s+(.+)$/);
  if (betMatch) {
    const d1 = parseSimpleDate(betMatch[1].split(/\s+/));
    const d2 = parseSimpleDate(betMatch[2].split(/\s+/));
    return {
      type: 'between',
      day: d1.day,
      month: d1.month,
      year: d1.year,
      day2: d2.day,
      month2: d2.month,
      year2: d2.year,
      raw: trimmed,
    };
  }

  // ABT
  if (upper.startsWith('ABT ')) {
    const d = parseSimpleDate(upper.slice(4).split(/\s+/));
    return { type: 'about', ...d, raw: trimmed };
  }

  // BEF
  if (upper.startsWith('BEF ')) {
    const d = parseSimpleDate(upper.slice(4).split(/\s+/));
    return { type: 'before', ...d, raw: trimmed };
  }

  // AFT
  if (upper.startsWith('AFT ')) {
    const d = parseSimpleDate(upper.slice(4).split(/\s+/));
    return { type: 'after', ...d, raw: trimmed };
  }

  // Simple date
  const d = parseSimpleDate(upper.split(/\s+/));
  return { type: 'exact', ...d, raw: trimmed };
}

export function parseGenwebDate(raw: string): GeneDate {
  if (!raw || raw.trim() === '') {
    return { type: 'exact', raw: raw || '' };
  }
  const trimmed = raw.trim();

  // Between: 1665..1670
  const betMatch = trimmed.match(/^(\d+)\.\.(\d+)$/);
  if (betMatch) {
    return {
      type: 'between',
      year: parseInt(betMatch[1], 10),
      year2: parseInt(betMatch[2], 10),
      raw: trimmed,
    };
  }

  // Between with full dates: d1/m1/y1..d2/m2/y2
  const betMatch2 = trimmed.match(/^(.+?)\.\.(.+)$/);
  if (betMatch2) {
    const d1 = parseGwSimpleDate(betMatch2[1]);
    const d2 = parseGwSimpleDate(betMatch2[2]);
    return {
      type: 'between',
      ...d1,
      day2: d2.day,
      month2: d2.month,
      year2: d2.year,
      raw: trimmed,
    };
  }

  let str = trimmed;
  let type: GeneDate['type'] = 'exact';

  // ~ prefix = about
  if (str.startsWith('~')) {
    type = 'about';
    str = str.slice(1);
  } else if (str.startsWith('<')) {
    type = 'before';
    str = str.slice(1);
  } else if (str.startsWith('>')) {
    type = 'after';
    str = str.slice(1);
  }

  const parsed = parseGwSimpleDate(str);
  return { type, ...parsed, raw: trimmed };
}

function parseGwSimpleDate(s: string): { day?: number; month?: number; year?: number } {
  // Format: d/m/y or m/y or y
  const parts = s.split('/');
  if (parts.length === 3) {
    return {
      day: parseInt(parts[0], 10) || undefined,
      month: parseInt(parts[1], 10) || undefined,
      year: parseInt(parts[2], 10) || undefined,
    };
  }
  if (parts.length === 2) {
    return {
      month: parseInt(parts[0], 10) || undefined,
      year: parseInt(parts[1], 10) || undefined,
    };
  }
  const num = parseInt(parts[0], 10);
  if (!isNaN(num)) {
    return { year: num };
  }
  return {};
}

export function formatDate(date: GeneDate | undefined, locale: string = 'en'): string {
  if (!date) return '';
  const monthNames = locale === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;

  const fmt = (d?: number, m?: number, y?: number): string => {
    const parts: string[] = [];
    if (d) parts.push(String(d));
    if (m && monthNames[m]) parts.push(monthNames[m]);
    if (y) parts.push(String(y));
    return parts.join(' ');
  };

  const base = fmt(date.day, date.month, date.year);

  switch (date.type) {
    case 'about':
      return locale === 'fr' ? `vers ${base}` : `about ${base}`;
    case 'before':
      return locale === 'fr' ? `avant ${base}` : `before ${base}`;
    case 'after':
      return locale === 'fr' ? `après ${base}` : `after ${base}`;
    case 'between': {
      const base2 = fmt(date.day2, date.month2, date.year2);
      return locale === 'fr'
        ? `entre ${base} et ${base2}`
        : `between ${base} and ${base2}`;
    }
    default:
      return base;
  }
}

export function dateToGedcom(date: GeneDate): string {
  const fmt = (d?: number, m?: number, y?: number): string => {
    const parts: string[] = [];
    if (d) parts.push(String(d).padStart(2, '0'));
    if (m && MONTH_TO_GEDCOM[m]) parts.push(MONTH_TO_GEDCOM[m]);
    if (y) parts.push(String(y));
    return parts.join(' ');
  };

  switch (date.type) {
    case 'about':
      return `ABT ${fmt(date.day, date.month, date.year)}`;
    case 'before':
      return `BEF ${fmt(date.day, date.month, date.year)}`;
    case 'after':
      return `AFT ${fmt(date.day, date.month, date.year)}`;
    case 'between':
      return `BET ${fmt(date.day, date.month, date.year)} AND ${fmt(date.day2, date.month2, date.year2)}`;
    default:
      return fmt(date.day, date.month, date.year);
  }
}

export function dateToGeneweb(date: GeneDate): string {
  const fmt = (d?: number, m?: number, y?: number): string => {
    if (d && m && y) return `${d}/${m}/${y}`;
    if (m && y) return `${m}/${y}`;
    if (y) return String(y);
    return '';
  };

  switch (date.type) {
    case 'about':
      return `~${fmt(date.day, date.month, date.year)}`;
    case 'before':
      return `<${fmt(date.day, date.month, date.year)}`;
    case 'after':
      return `>${fmt(date.day, date.month, date.year)}`;
    case 'between':
      return `${fmt(date.day, date.month, date.year)}..${fmt(date.day2, date.month2, date.year2)}`;
    default:
      return fmt(date.day, date.month, date.year);
  }
}

export function dateToSortableNumber(date: GeneDate | undefined): number {
  if (!date || !date.year) return 0;
  return (date.year * 10000) + ((date.month || 0) * 100) + (date.day || 0);
}
