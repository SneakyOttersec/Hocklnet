import type { GenealogyDatabase, Person } from '../../types/genealogy';
import { dateToGeneweb } from '../date-parser';

function toUnderscore(s: string): string {
  return s.replace(/ /g, '_');
}

function personRef(p: Person): string {
  const given = p.name.birthName
    ? `${p.name.given}_(${p.name.birthName})`
    : p.name.given;
  return `${toUnderscore(p.name.surname)} ${toUnderscore(given)}`;
}

export function serializeGeneweb(db: GenealogyDatabase): string {
  const lines: string[] = ['encoding: utf-8', 'gwplus', ''];

  for (const family of db.families.values()) {
    const husband = family.husbandId ? db.persons.get(family.husbandId) : undefined;
    const wife = family.wifeId ? db.persons.get(family.wifeId) : undefined;

    if (!husband || !wife) continue;

    const marriage = family.events.find(e => e.type === 'marriage');
    const marriageDateStr = marriage?.date ? `+${dateToGeneweb(marriage.date)}` : '+';
    const marriagePlaceStr = marriage?.place
      ? ` #mp ${toUnderscore(marriage.place.original)}` : '';

    lines.push(`fam ${personRef(husband)} ${marriageDateStr}${marriagePlaceStr} ${personRef(wife)}`);

    // fevt block
    if (family.events.length > 0) {
      lines.push('fevt');
      for (const evt of family.events) {
        let line = `#${eventTypeToGw(evt.type)}`;
        if (evt.date) line += ` ${dateToGeneweb(evt.date)}`;
        if (evt.place) line += ` #p ${toUnderscore(evt.place.original)}`;
        lines.push(line);
      }
      lines.push('end fevt');
    }

    // Children
    if (family.childrenIds.length > 0) {
      lines.push('beg');
      for (const childId of family.childrenIds) {
        const child = db.persons.get(childId);
        if (!child) continue;
        const sexChar = child.sex === 'M' ? 'h' : 'f';
        const birth = child.events.find(e => e.type === 'birth');
        const death = child.events.find(e => e.type === 'death');
        let line = `- ${sexChar} ${toUnderscore(child.name.given)}`;
        if (birth?.date) line += ` ${dateToGeneweb(birth.date)}`;
        if (birth?.place) line += ` #bp ${toUnderscore(birth.place.original)}`;
        if (death?.date) line += ` ${dateToGeneweb(death.date)}`;
        else if (death) line += ' 0';
        if (death?.place) line += ` #dp ${toUnderscore(death.place.original)}`;
        lines.push(line);
      }
      lines.push('end');
    }

    lines.push('');
  }

  // Person events
  for (const person of db.persons.values()) {
    if (person.events.length > 0) {
      lines.push(`pevt ${personRef(person)}`);
      for (const evt of person.events) {
        let line = `#${eventTypeToGw(evt.type)}`;
        if (evt.date) line += ` ${dateToGeneweb(evt.date)}`;
        if (evt.place) line += ` #p ${toUnderscore(evt.place.original)}`;
        lines.push(line);
        if (evt.notes) {
          for (const noteLine of evt.notes.split('\n')) {
            lines.push(`note ${noteLine}`);
          }
        }
      }
      lines.push('end pevt');
      lines.push('');
    }

    // Notes
    if (person.notes) {
      lines.push(`notes ${personRef(person)}`);
      lines.push('beg');
      lines.push(person.notes);
      lines.push('end notes');
      lines.push('');
    }
  }

  return lines.join('\n') + '\n';
}

function eventTypeToGw(type: string): string {
  switch (type) {
    case 'birth': return 'birt';
    case 'death': return 'deat';
    case 'marriage': return 'marr';
    case 'divorce': return 'div';
    case 'baptism': return 'bapt';
    case 'burial': return 'buri';
    case 'changeName': return 'chgn';
    default: return type;
  }
}
