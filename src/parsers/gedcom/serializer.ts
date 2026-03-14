import type { GenealogyDatabase, Person, Family, GeneEvent, GenePlace, PersonName } from '../../types/genealogy';
import { dateToGedcom } from '../date-parser';

function serializeName(name: PersonName): string {
  let given = name.given;
  if (name.birthName) {
    given = `${given} (${name.birthName})`;
  }
  return `${given} /${name.surname}/`;
}

function serializePlace(place: GenePlace): string {
  return place.original || [
    place.city || '',
    place.postalCode || '',
    place.county || '',
    place.state || '',
    place.country || '',
  ].join(', ');
}

function eventTagFromType(type: string): string {
  switch (type) {
    case 'birth': return 'BIRT';
    case 'death': return 'DEAT';
    case 'marriage': return 'MARR';
    case 'divorce': return 'DIV';
    case 'baptism': return 'BAPM';
    case 'burial': return 'BURI';
    case 'census': return 'CENS';
    case 'emigration': return 'EMIG';
    case 'immigration': return 'IMMI';
    case 'naturalization': return 'NATU';
    case 'residence': return 'RESI';
    case 'changeName': return 'EVEN';
    default: return 'EVEN';
  }
}

function serializeEvent(event: GeneEvent, level: number): string[] {
  const lines: string[] = [];
  const tag = eventTagFromType(event.type);

  if (!event.date && !event.place && !event.notes) {
    lines.push(`${level} ${tag} Y`);
    return lines;
  }

  lines.push(`${level} ${tag}`);

  if (event.type === 'changeName' || event.type === 'other') {
    lines.push(`${level + 1} TYPE ${event.type === 'changeName' ? 'Change name' : 'Other'}`);
  }

  if (event.date?.year || event.date?.raw) {
    const dateStr = dateToGedcom(event.date);
    if (dateStr) lines.push(`${level + 1} DATE ${dateStr}`);
  }

  if (event.place) {
    lines.push(`${level + 1} PLAC ${serializePlace(event.place)}`);
  }

  if (event.notes) {
    const noteLines = event.notes.split('\n');
    lines.push(`${level + 1} NOTE ${noteLines[0]}`);
    for (let i = 1; i < noteLines.length; i++) {
      lines.push(`${level + 2} CONT ${noteLines[i]}`);
    }
  }

  if (event.sources) {
    for (const src of event.sources) {
      lines.push(`${level + 1} SOUR ${src}`);
    }
  }

  return lines;
}

function serializePerson(person: Person): string[] {
  const lines: string[] = [];
  lines.push(`0 @${person.id}@ INDI`);
  lines.push(`1 NAME ${serializeName(person.name)}`);
  lines.push(`1 SEX ${person.sex}`);

  for (const event of person.events) {
    lines.push(...serializeEvent(event, 1));
  }

  if (person.occupation) {
    lines.push(`1 OCCU ${person.occupation}`);
  }

  if (person.familyAsChildId) {
    lines.push(`1 FAMC @${person.familyAsChildId}@`);
  }

  for (const famId of person.familyAsSpouseIds) {
    lines.push(`1 FAMS @${famId}@`);
  }

  if (person.notes) {
    const noteLines = person.notes.split('\n');
    lines.push(`1 NOTE ${noteLines[0]}`);
    for (let i = 1; i < noteLines.length; i++) {
      lines.push(`2 CONT ${noteLines[i]}`);
    }
  }

  return lines;
}

function serializeFamily(family: Family): string[] {
  const lines: string[] = [];
  lines.push(`0 @${family.id}@ FAM`);

  for (const event of family.events) {
    lines.push(...serializeEvent(event, 1));
  }

  if (family.husbandId) {
    lines.push(`1 HUSB @${family.husbandId}@`);
  }
  if (family.wifeId) {
    lines.push(`1 WIFE @${family.wifeId}@`);
  }
  for (const childId of family.childrenIds) {
    lines.push(`1 CHIL @${childId}@`);
  }

  return lines;
}

export function serializeGedcom(db: GenealogyDatabase): string {
  const lines: string[] = [];

  // Header
  lines.push('0 HEAD');
  lines.push('1 SOUR Hocklnet');
  lines.push('2 NAME Hocklnet Genealogy');
  lines.push('2 VERS 1.0.0');
  lines.push('1 GEDC');
  lines.push('2 VERS 5.5.1');
  lines.push('2 FORM LINEAGE-LINKED');
  lines.push('1 CHAR UTF-8');

  // Persons
  for (const person of db.persons.values()) {
    lines.push(...serializePerson(person));
  }

  // Families
  for (const family of db.families.values()) {
    lines.push(...serializeFamily(family));
  }

  lines.push('0 TRLR');
  return lines.join('\n') + '\n';
}
