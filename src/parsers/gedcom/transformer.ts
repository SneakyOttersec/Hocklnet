import type { GedcomNode } from './parser';
import type {
  GenealogyDatabase, Person, Family, GeneEvent,
  PersonName, GenePlace, Sex, EventType,
} from '../../types/genealogy';
import { createEmptyDatabase } from '../../types/genealogy';
import { parseGedcomDate } from '../date-parser';

function findChild(node: GedcomNode, tag: string): GedcomNode | undefined {
  return node.children.find(c => c.tag === tag);
}

function findChildren(node: GedcomNode, tag: string): GedcomNode[] {
  return node.children.filter(c => c.tag === tag);
}

function parseName(nameStr: string): PersonName {
  // GEDCOM NAME format: "Given /Surname/" or "Given (BirthName) /Surname/"
  const result: PersonName = { given: '', surname: '' };

  // Extract surname from /.../ notation
  const surnameMatch = nameStr.match(/\/([^/]*)\//);
  if (surnameMatch) {
    result.surname = surnameMatch[1].trim();
  }

  // Get given name (everything before the /surname/)
  let given = nameStr.replace(/\/[^/]*\//, '').trim();

  // Extract birth name from parentheses: "Jacques (Jakob)" -> given="Jacques", birthName="Jakob"
  const birthNameMatch = given.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (birthNameMatch) {
    result.given = birthNameMatch[1].trim();
    result.birthName = birthNameMatch[2].trim();
  } else {
    result.given = given;
  }

  return result;
}

function parsePlace(placeStr: string): GenePlace {
  const result: GenePlace = { original: placeStr };
  // GEDCOM place format: "City, PostalCode, County, State, Country"
  const parts = placeStr.split(',').map(p => p.trim());
  if (parts.length >= 1) result.city = parts[0] || undefined;
  if (parts.length >= 2) result.postalCode = parts[1] || undefined;
  if (parts.length >= 3) result.county = parts[2] || undefined;
  if (parts.length >= 4) result.state = parts[3] || undefined;
  if (parts.length >= 5) result.country = parts[4] || undefined;
  return result;
}

function mapEventType(tag: string, typeValue?: string): EventType {
  switch (tag) {
    case 'BIRT': return 'birth';
    case 'DEAT': return 'death';
    case 'MARR': return 'marriage';
    case 'DIV': return 'divorce';
    case 'BAPM': case 'CHR': return 'baptism';
    case 'BURI': return 'burial';
    case 'CENS': return 'census';
    case 'EMIG': return 'emigration';
    case 'IMMI': return 'immigration';
    case 'NATU': return 'naturalization';
    case 'RESI': return 'residence';
    case 'EVEN':
      if (typeValue) {
        const lower = typeValue.toLowerCase();
        if (lower.includes('change name') || lower.includes('changement')) return 'changeName';
      }
      return 'other';
    default: return 'other';
  }
}

function parseEvent(node: GedcomNode): GeneEvent {
  const typeNode = findChild(node, 'TYPE');
  const event: GeneEvent = {
    type: mapEventType(node.tag, typeNode?.value),
  };

  const dateNode = findChild(node, 'DATE');
  if (dateNode?.value) {
    event.date = parseGedcomDate(dateNode.value);
  }

  const placeNode = findChild(node, 'PLAC');
  if (placeNode?.value) {
    event.place = parsePlace(placeNode.value);
  }

  const noteNode = findChild(node, 'NOTE');
  if (noteNode?.value) {
    event.notes = noteNode.value;
  }

  const sourNode = findChild(node, 'SOUR');
  if (sourNode?.value) {
    event.sources = [sourNode.value];
  }

  return event;
}

const EVENT_TAGS = new Set([
  'BIRT', 'DEAT', 'MARR', 'DIV', 'BAPM', 'CHR', 'BURI',
  'CENS', 'EMIG', 'IMMI', 'NATU', 'RESI', 'EVEN',
]);

function transformPerson(node: GedcomNode): Person {
  const id = node.xref?.replace(/@/g, '') || '';

  const nameNode = findChild(node, 'NAME');
  const name = nameNode?.value ? parseName(nameNode.value) : { given: '', surname: '' };

  const sexNode = findChild(node, 'SEX');
  const sex: Sex = (sexNode?.value === 'M' || sexNode?.value === 'F')
    ? sexNode.value : 'U';

  const events: GeneEvent[] = [];
  for (const child of node.children) {
    if (EVENT_TAGS.has(child.tag)) {
      events.push(parseEvent(child));
    }
  }

  const occuNode = findChild(node, 'OCCU');
  const noteNode = findChild(node, 'NOTE');

  const famcNode = findChild(node, 'FAMC');
  const famsNodes = findChildren(node, 'FAMS');

  return {
    id,
    name,
    sex,
    events,
    occupation: occuNode?.value,
    notes: noteNode?.value,
    media: [],
    familyAsSpouseIds: famsNodes.map(n => n.value?.replace(/@/g, '') || ''),
    familyAsChildId: famcNode?.value?.replace(/@/g, ''),
  };
}

function transformFamily(node: GedcomNode): Family {
  const id = node.xref?.replace(/@/g, '') || '';

  const husbNode = findChild(node, 'HUSB');
  const wifeNode = findChild(node, 'WIFE');
  const chilNodes = findChildren(node, 'CHIL');

  const events: GeneEvent[] = [];
  for (const child of node.children) {
    if (EVENT_TAGS.has(child.tag)) {
      events.push(parseEvent(child));
    }
  }

  return {
    id,
    husbandId: husbNode?.value?.replace(/@/g, ''),
    wifeId: wifeNode?.value?.replace(/@/g, ''),
    childrenIds: chilNodes.map(n => n.value?.replace(/@/g, '') || ''),
    events,
  };
}

export function transformGedcom(nodes: GedcomNode[]): GenealogyDatabase {
  const db = createEmptyDatabase();

  // Extract metadata from HEAD
  const headNode = nodes.find(n => n.tag === 'HEAD');
  if (headNode) {
    const sourNode = findChild(headNode, 'SOUR');
    if (sourNode) {
      db.metadata.source = sourNode.value;
      const versNode = findChild(sourNode, 'VERS');
      if (versNode) db.metadata.version = versNode.value;
    }
    const dateNode = findChild(headNode, 'DATE');
    if (dateNode?.value) db.metadata.date = dateNode.value;
    const charNode = findChild(headNode, 'CHAR');
    if (charNode?.value) db.metadata.charset = charNode.value;
  }

  for (const node of nodes) {
    if (node.tag === 'INDI') {
      const person = transformPerson(node);
      db.persons.set(person.id, person);
    } else if (node.tag === 'FAM') {
      const family = transformFamily(node);
      db.families.set(family.id, family);
    }
  }

  return db;
}
