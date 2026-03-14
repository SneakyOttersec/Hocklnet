export type EntityId = string;

export type Sex = 'M' | 'F' | 'U';

export type EventType =
  | 'birth' | 'death' | 'marriage' | 'divorce'
  | 'baptism' | 'burial' | 'census' | 'emigration'
  | 'immigration' | 'naturalization' | 'occupation'
  | 'residence' | 'changeName' | 'other';

export type DateType = 'exact' | 'about' | 'before' | 'after' | 'between';

export interface GeneDate {
  type: DateType;
  day?: number;
  month?: number;
  year?: number;
  /** For 'between' type */
  year2?: number;
  month2?: number;
  day2?: number;
  raw: string;
}

export interface GenePlace {
  original: string;
  city?: string;
  postalCode?: string;
  county?: string;
  state?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export interface GeneEvent {
  type: EventType;
  date?: GeneDate;
  place?: GenePlace;
  notes?: string;
  witnesses?: string[];
  sources?: string[];
}

export interface PersonName {
  given: string;
  surname: string;
  birthName?: string;
}

export interface MediaItem {
  id: EntityId;
  filename: string;
  data: string; // base64
  mimeType: string;
}

export interface Person {
  id: EntityId;
  name: PersonName;
  sex: Sex;
  events: GeneEvent[];
  occupation?: string;
  notes?: string;
  media: MediaItem[];
  familyAsSpouseIds: EntityId[];
  familyAsChildId?: EntityId;
}

export interface Family {
  id: EntityId;
  husbandId?: EntityId;
  wifeId?: EntityId;
  childrenIds: EntityId[];
  events: GeneEvent[];
}

export interface GenealogyMetadata {
  source?: string;
  version?: string;
  date?: string;
  charset?: string;
  filename?: string;
}

export interface GenealogyDatabase {
  persons: Map<EntityId, Person>;
  families: Map<EntityId, Family>;
  metadata: GenealogyMetadata;
}

export function createEmptyDatabase(): GenealogyDatabase {
  return {
    persons: new Map(),
    families: new Map(),
    metadata: {},
  };
}

// Helper to get birth event
export function getBirthEvent(person: Person): GeneEvent | undefined {
  return person.events.find(e => e.type === 'birth');
}

export function getDeathEvent(person: Person): GeneEvent | undefined {
  return person.events.find(e => e.type === 'death');
}

export function getMarriageEvent(family: Family): GeneEvent | undefined {
  return family.events.find(e => e.type === 'marriage');
}

export function getDisplayName(person: Person): string {
  const parts: string[] = [];
  if (person.name.given) parts.push(person.name.given);
  if (person.name.surname) parts.push(person.name.surname);
  return parts.join(' ') || 'Unknown';
}
