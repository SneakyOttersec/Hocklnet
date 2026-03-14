import type { GwBlock, GwNotesBlock } from './parser';
import type {
  GenealogyDatabase, Person, Family, GeneEvent,
  GenePlace, Sex, EventType, EntityId,
} from '../../types/genealogy';
import { createEmptyDatabase } from '../../types/genealogy';
import { parseGenwebDate } from '../date-parser';
import { nanoid } from 'nanoid';

// Person key -> EntityId mapping (for deduplication by name)
type PersonKey = string;

function makePersonKey(surname: string, given: string): PersonKey {
  return `${surname.toLowerCase()}::${given.toLowerCase()}`;
}

function undoUnderscores(s: string): string {
  return s.replace(/_/g, ' ');
}

function stripDisambiguation(s: string): string {
  // Remove .N suffix (e.g., "Johann.1" -> "Johann")
  return s.replace(/\.\d+$/, '');
}

function parseBirthName(given: string): { given: string; birthName?: string } {
  // "Jacques_(Jakob)" -> given="Jacques", birthName="Jakob"
  const match = given.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { given: match[1].trim(), birthName: match[2].trim() };
  }
  return { given };
}

function parseGwPlace(s: string): GenePlace {
  const original = undoUnderscores(s);
  const result: GenePlace = { original };
  const parts = original.split(',').map(p => p.trim());
  if (parts.length >= 1) result.city = parts[0] || undefined;
  if (parts.length >= 2) result.postalCode = parts[1] || undefined;
  if (parts.length >= 3) result.county = parts[2] || undefined;
  if (parts.length >= 4) result.state = parts[3] || undefined;
  if (parts.length >= 5) result.country = parts[4] || undefined;
  return result;
}

function getOrCreatePerson(
  db: GenealogyDatabase,
  pMap: Map<PersonKey, EntityId>,
  surname: string,
  given: string,
): Person {
  const cleanGiven = stripDisambiguation(given);
  const displayGiven = undoUnderscores(cleanGiven);
  const displaySurname = undoUnderscores(surname);
  const key = makePersonKey(displaySurname, displayGiven);

  const existingId = pMap.get(key);
  if (existingId) {
    return db.persons.get(existingId)!;
  }

  const { given: finalGiven, birthName } = parseBirthName(displayGiven);
  const id = nanoid(8);
  const person: Person = {
    id,
    name: { given: finalGiven, surname: displaySurname, birthName },
    sex: 'U',
    events: [],
    media: [],
    familyAsSpouseIds: [],
  };
  db.persons.set(id, person);
  pMap.set(key, id);
  return person;
}

function findPersonByKey(
  db: GenealogyDatabase,
  pMap: Map<PersonKey, EntityId>,
  surname: string,
  given: string,
): Person | undefined {
  const cleanGiven = stripDisambiguation(given);
  const displayGiven = undoUnderscores(cleanGiven);
  const displaySurname = undoUnderscores(surname);
  const key = makePersonKey(displaySurname, displayGiven);
  const id = pMap.get(key);
  return id ? db.persons.get(id) : undefined;
}

// Parse: "SURNAME Given date1 #bp place date2 #dp place" from child line
function parseChildLine(line: string): {
  sex: Sex;
  surname?: string;
  given: string;
  tags: Map<string, string>;
  birthDate?: string;
  deathDate?: string;
} {
  // "- h Given [Surname] [date1] [#bp place] [date2] [#dp place] [#tags...]"
  // or "- f Given ..."
  const stripped = line.replace(/^-\s+/, '');
  const tokens = stripped.split(/\s+/);

  const sexChar = tokens[0];
  const sex: Sex = sexChar === 'h' ? 'M' : sexChar === 'f' ? 'F' : 'U';

  let given = '';
  let surname: string | undefined;
  let i = 1;

  // Given name is next token
  if (i < tokens.length && !tokens[i].startsWith('#')) {
    given = tokens[i];
    i++;
  }

  // Check if there's an optional surname (capitalized word before a date or #tag)
  if (i < tokens.length && !tokens[i].startsWith('#') &&
      !tokens[i].match(/^\d/) && tokens[i] !== 'od' && tokens[i] !== '0') {
    // Could be a surname if it starts uppercase and next is date-like
    const next = tokens[i];
    if (next.match(/^[A-Z]/) && i + 1 < tokens.length) {
      surname = next;
      i++;
    }
  }

  // Now parse remaining tokens for dates and #tags
  const remaining = tokens.slice(i);
  const tags = new Map<string, string>();
  let birthDate: string | undefined;
  let deathDate: string | undefined;
  let foundFirstDate = false;
  let j = 0;

  while (j < remaining.length) {
    const t = remaining[j];
    if (t.startsWith('#')) {
      const tag = t.slice(1);
      const values: string[] = [];
      j++;
      // Collect value tokens until next #tag, date, or end
      // Tags like #bp, #dp, #pp take a single place value
      // Tags like #occu take value tokens until a date-like token or another #tag
      const isPlaceTag = tag === 'bp' || tag === 'dp' || tag === 'pp' || tag === 'mp';
      while (j < remaining.length && !remaining[j].startsWith('#')) {
        // Stop if we hit a date-like token (unless this is a place tag taking one value)
        if (!isPlaceTag && (remaining[j].match(/^[~<>]?\d/) || remaining[j] === 'od' || remaining[j] === '0')) {
          break;
        }
        values.push(remaining[j]);
        j++;
        if (isPlaceTag) break; // Place tags take exactly one value
      }
      tags.set(tag, values.join(' '));
    } else if (t === 'od' || t === '0') {
      // "od" = death known but no date, "0" = unknown date
      if (!foundFirstDate) {
        foundFirstDate = true;
      } else {
        // second date-like = death
      }
      j++;
    } else if (t.match(/^[~<>]?\d/) || t.match(/^\d/)) {
      if (!foundFirstDate) {
        birthDate = t;
        foundFirstDate = true;
      } else {
        deathDate = t;
      }
      j++;
    } else {
      j++;
    }
  }

  return { sex, surname, given, tags, birthDate, deathDate };
}

interface FamLineResult {
  husbSurname: string;
  husbGiven: string;
  wifeSurname: string;
  wifeGiven: string;
  marriageDate?: string;
  husbBirth?: string;
  husbDeath?: string;
  wifeBirth?: string;
  wifeDeath?: string;
  tags: Map<string, string>;
  husbTags: Map<string, string>;
  wifeTags: Map<string, string>;
}

function parseFamLine(line: string): FamLineResult {
  // "fam HUSB_SURNAME HUSB_GIVEN [dates] [#tags] + WIFE_SURNAME WIFE_GIVEN [dates] [#tags]"
  const content = line.replace(/^fam\s+/, '');

  // Split on ' + ' to get husband and wife parts
  const plusIdx = content.indexOf(' + ');
  if (plusIdx === -1) {
    // Check for +date format: "+28/5/1748"
    const plusDateMatch = content.match(/\s+(\+\S+)\s+/);
    if (plusDateMatch) {
      const pIdx = content.indexOf(plusDateMatch[0]);
      const husbPart = content.slice(0, pIdx).trim();
      const rest = content.slice(pIdx).trim();
      // rest starts with +date
      const marriageDateMatch = rest.match(/^\+(\S+)\s+(.*)/);
      if (marriageDateMatch) {
        const marriageDate = marriageDateMatch[1];
        const wifePart = marriageDateMatch[2];
        const husband = parsePersonTokens(husbPart.split(/\s+/));
        const wifeTokens = wifePart.split(/\s+/);

        // Check for #mp (marriage place) in the tokens before wife name
        let marriageTags = new Map<string, string>();
        let cleanWifeTokens = wifeTokens;
        const mpIdx = wifeTokens.findIndex(t => t === '#mp');
        if (mpIdx !== -1) {
          // Extract #mp value
          let mpEnd = mpIdx + 2;
          while (mpEnd < wifeTokens.length && !wifeTokens[mpEnd].startsWith('#') &&
                 !wifeTokens[mpEnd].match(/^[A-Z]/) || (mpEnd === mpIdx + 2 && wifeTokens[mpEnd]?.match(/^[A-Z]/))) {
            mpEnd++;
          }
          // Actually just find the wife surname which is typically uppercase
          // Simpler: find first token after #mp value that starts with uppercase
          marriageTags.set('mp', wifeTokens[mpIdx + 1] || '');
          cleanWifeTokens = [...wifeTokens.slice(0, mpIdx), ...wifeTokens.slice(mpIdx + 2)];
        }
        const msIdx = cleanWifeTokens.findIndex(t => t === '#ms');
        if (msIdx !== -1) {
          marriageTags.set('ms', cleanWifeTokens[msIdx + 1] || '');
          cleanWifeTokens = [...cleanWifeTokens.slice(0, msIdx), ...cleanWifeTokens.slice(msIdx + 2)];
        }

        const wife = parsePersonTokens(cleanWifeTokens);
        return {
          husbSurname: husband.surname,
          husbGiven: husband.given,
          wifeSurname: wife.surname,
          wifeGiven: wife.given,
          marriageDate,
          husbBirth: husband.birth,
          husbDeath: husband.death,
          wifeBirth: wife.birth,
          wifeDeath: wife.death,
          tags: marriageTags,
          husbTags: husband.tags,
          wifeTags: wife.tags,
        };
      }
    }
  }

  // Standard "... + ..." format
  let husbPart: string;
  let wifePart: string;
  let marriageDate: string | undefined;

  // Check for +date before the +
  const plusDateBefore = content.match(/^(.+?)\s+\+(\S+)\s+(.+)$/);
  if (plusDateBefore) {
    husbPart = plusDateBefore[1];
    marriageDate = plusDateBefore[2];
    wifePart = plusDateBefore[3];
  } else if (plusIdx !== -1) {
    husbPart = content.slice(0, plusIdx).trim();
    wifePart = content.slice(plusIdx + 3).trim();
  } else {
    // Fallback
    const tokens = content.split(/\s+/);
    return {
      husbSurname: tokens[0] || '',
      husbGiven: tokens[1] || '',
      wifeSurname: '',
      wifeGiven: '',
      tags: new Map(),
      husbTags: new Map(),
      wifeTags: new Map(),
    };
  }

  // Extract #mp and #ms from between marriage date and wife
  let marriageTags = new Map<string, string>();
  const wifeTokens = wifePart.split(/\s+/);
  let cleanWifeTokens = [...wifeTokens];

  const mpIdx = cleanWifeTokens.findIndex(t => t === '#mp');
  if (mpIdx !== -1) {
    marriageTags.set('mp', cleanWifeTokens[mpIdx + 1] || '');
    cleanWifeTokens = [...cleanWifeTokens.slice(0, mpIdx), ...cleanWifeTokens.slice(mpIdx + 2)];
  }
  const msIdx = cleanWifeTokens.findIndex(t => t === '#ms');
  if (msIdx !== -1) {
    marriageTags.set('ms', cleanWifeTokens[msIdx + 1] || '');
    cleanWifeTokens = [...cleanWifeTokens.slice(0, msIdx), ...cleanWifeTokens.slice(msIdx + 2)];
  }

  const husband = parsePersonTokens(husbPart.split(/\s+/));
  const wife = parsePersonTokens(cleanWifeTokens);

  return {
    husbSurname: husband.surname,
    husbGiven: husband.given,
    wifeSurname: wife.surname,
    wifeGiven: wife.given,
    marriageDate,
    husbBirth: husband.birth,
    husbDeath: husband.death,
    wifeBirth: wife.birth,
    wifeDeath: wife.death,
    tags: marriageTags,
    husbTags: husband.tags,
    wifeTags: wife.tags,
  };
}

interface PersonTokenResult {
  surname: string;
  given: string;
  birth?: string;
  death?: string;
  tags: Map<string, string>;
}

function parsePersonTokens(tokens: string[]): PersonTokenResult {
  // First token is surname, second is given name
  // Then optional dates and #tags
  const result: PersonTokenResult = {
    surname: tokens[0] || '',
    given: tokens[1] || '',
    tags: new Map(),
  };

  let i = 2;
  let foundBirth = false;

  while (i < tokens.length) {
    const t = tokens[i];
    if (t.startsWith('#')) {
      const tag = t.slice(1);
      const values: string[] = [];
      i++;
      while (i < tokens.length && !tokens[i].startsWith('#')) {
        // Stop if we hit what looks like a death date
        if (!tag.endsWith('p') && !tag.endsWith('s') &&
            (tokens[i].match(/^[~<>]?\d/) || tokens[i] === 'od' || tokens[i] === '0')) {
          break;
        }
        values.push(tokens[i]);
        i++;
      }
      result.tags.set(tag, values.join(' '));
    } else if (t === '0' || t === 'od') {
      if (!foundBirth) {
        foundBirth = true;
      }
      i++;
    } else if (t.match(/^[~<>]?\d/) || t.match(/^\d/)) {
      if (!foundBirth) {
        result.birth = t;
        foundBirth = true;
      } else {
        result.death = t;
      }
      i++;
    } else {
      i++;
    }
  }

  return result;
}

function mapGwEventType(tag: string): EventType {
  switch (tag) {
    case 'birt': return 'birth';
    case 'deat': return 'death';
    case 'marr': return 'marriage';
    case 'div': return 'divorce';
    case 'bapt': return 'baptism';
    case 'buri': return 'burial';
    case 'chgn': return 'changeName';
    default: return 'other';
  }
}

function parsePevtEvents(lines: string[]): GeneEvent[] {
  const events: GeneEvent[] = [];
  let currentNotes: string[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) {
      const tokens = line.split(/\s+/);
      const tag = tokens[0].slice(1);
      const eventType = mapGwEventType(tag);

      const event: GeneEvent = { type: eventType };

      // Parse remaining tokens for date and #p place
      let i = 1;
      if (i < tokens.length && !tokens[i].startsWith('#')) {
        event.date = parseGenwebDate(tokens[i]);
        i++;
      }

      // Look for #p (place)
      while (i < tokens.length) {
        if (tokens[i] === '#p' && i + 1 < tokens.length) {
          event.place = parseGwPlace(tokens[i + 1]);
          i += 2;
        } else if (tokens[i] === '#s' && i + 1 < tokens.length) {
          event.sources = [undoUnderscores(tokens[i + 1])];
          i += 2;
        } else {
          i++;
        }
      }

      // Attach accumulated notes
      if (currentNotes.length > 0) {
        // Notes belong to previous event, handled below
      }

      events.push(event);
      currentNotes = [];
    } else if (line.startsWith('note ')) {
      const noteText = line.slice(5);
      // Attach to most recent event
      if (events.length > 0) {
        const last = events[events.length - 1];
        last.notes = last.notes ? last.notes + '\n' + noteText : noteText;
      }
    }
  }

  return events;
}

export function transformGeneweb(blocks: GwBlock[]): GenealogyDatabase {
  const db = createEmptyDatabase();
  const pMap = new Map<PersonKey, EntityId>();
  let familyCounter = 0;

  // First pass: process families to create persons
  for (const block of blocks) {
    if (block.type === 'fam') {
      const fam = parseFamLine(block.line);
      familyCounter++;
      const familyId = `GF${familyCounter}`;

      // Get or create husband and wife
      const husband = getOrCreatePerson(db, pMap, fam.husbSurname, fam.husbGiven);
      husband.sex = 'M';
      if (!husband.familyAsSpouseIds.includes(familyId)) {
        husband.familyAsSpouseIds.push(familyId);
      }

      // Apply husband birth/death from fam line
      if (fam.husbBirth) {
        const hasBirth = husband.events.some(e => e.type === 'birth');
        if (!hasBirth) {
          const evt: GeneEvent = { type: 'birth', date: parseGenwebDate(fam.husbBirth) };
          const bp = fam.husbTags.get('bp');
          if (bp) evt.place = parseGwPlace(bp);
          husband.events.push(evt);
        }
      }
      if (fam.husbDeath) {
        const hasDeath = husband.events.some(e => e.type === 'death');
        if (!hasDeath) {
          const evt: GeneEvent = { type: 'death', date: parseGenwebDate(fam.husbDeath) };
          const dp = fam.husbTags.get('dp');
          if (dp) evt.place = parseGwPlace(dp);
          husband.events.push(evt);
        }
      }

      const wife = getOrCreatePerson(db, pMap, fam.wifeSurname, fam.wifeGiven);
      wife.sex = 'F';
      if (!wife.familyAsSpouseIds.includes(familyId)) {
        wife.familyAsSpouseIds.push(familyId);
      }

      // Apply wife birth/death from fam line
      if (fam.wifeBirth) {
        const hasBirth = wife.events.some(e => e.type === 'birth');
        if (!hasBirth) {
          const evt: GeneEvent = { type: 'birth', date: parseGenwebDate(fam.wifeBirth) };
          const bp = fam.wifeTags.get('bp');
          if (bp) evt.place = parseGwPlace(bp);
          wife.events.push(evt);
        }
      }
      if (fam.wifeDeath) {
        const hasDeath = wife.events.some(e => e.type === 'death');
        if (!hasDeath) {
          const evt: GeneEvent = { type: 'death', date: parseGenwebDate(fam.wifeDeath) };
          const dp = fam.wifeTags.get('dp');
          if (dp) evt.place = parseGwPlace(dp);
          wife.events.push(evt);
        }
      }

      // Create family
      const family: Family = {
        id: familyId,
        husbandId: husband.id,
        wifeId: wife.id,
        childrenIds: [],
        events: [],
      };

      // Parse marriage from fam line or fevt
      if (fam.marriageDate) {
        const marriageEvt: GeneEvent = {
          type: 'marriage',
          date: parseGenwebDate(fam.marriageDate),
        };
        const mp = fam.tags.get('mp');
        if (mp) marriageEvt.place = parseGwPlace(mp);
        const ms = fam.tags.get('ms');
        if (ms) marriageEvt.sources = [undoUnderscores(ms)];
        family.events.push(marriageEvt);
      }

      // Parse fevt lines for additional family events
      for (const fevtLine of block.fevtLines) {
        if (fevtLine.startsWith('#')) {
          const tokens = fevtLine.split(/\s+/);
          const tag = tokens[0].slice(1);
          const eventType = mapGwEventType(tag);

          // Skip if we already have this event from the fam line
          if (eventType === 'marriage' && family.events.some(e => e.type === 'marriage')) {
            // Update existing marriage with more details from fevt
            const existing = family.events.find(e => e.type === 'marriage')!;
            let i = 1;
            if (i < tokens.length && !tokens[i].startsWith('#')) {
              if (!existing.date?.year) {
                existing.date = parseGenwebDate(tokens[i]);
              }
              i++;
            }
            while (i < tokens.length) {
              if (tokens[i] === '#p' && i + 1 < tokens.length) {
                if (!existing.place) existing.place = parseGwPlace(tokens[i + 1]);
                i += 2;
              } else if (tokens[i] === '#s' && i + 1 < tokens.length) {
                if (!existing.sources) existing.sources = [undoUnderscores(tokens[i + 1])];
                i += 2;
              } else {
                i++;
              }
            }
            continue;
          }

          const event: GeneEvent = { type: eventType };
          let i = 1;
          if (i < tokens.length && !tokens[i].startsWith('#')) {
            event.date = parseGenwebDate(tokens[i]);
            i++;
          }
          while (i < tokens.length) {
            if (tokens[i] === '#p' && i + 1 < tokens.length) {
              event.place = parseGwPlace(tokens[i + 1]);
              i += 2;
            } else {
              i++;
            }
          }
          family.events.push(event);
        }
      }

      // Process children
      for (const childLine of block.children) {
        const child = parseChildLine(childLine);
        const childSurname = child.surname || fam.husbSurname;
        const childPerson = getOrCreatePerson(db, pMap, childSurname, child.given);
        childPerson.sex = child.sex;
        childPerson.familyAsChildId = familyId;
        family.childrenIds.push(childPerson.id);

        // Apply child birth/death
        if (child.birthDate) {
          const hasBirth = childPerson.events.some(e => e.type === 'birth');
          if (!hasBirth) {
            const evt: GeneEvent = { type: 'birth', date: parseGenwebDate(child.birthDate) };
            const bp = child.tags.get('bp');
            if (bp) evt.place = parseGwPlace(bp);
            childPerson.events.push(evt);
          }
        }
        if (child.deathDate) {
          const hasDeath = childPerson.events.some(e => e.type === 'death');
          if (!hasDeath) {
            const evt: GeneEvent = { type: 'death', date: parseGenwebDate(child.deathDate) };
            const dp = child.tags.get('dp');
            if (dp) evt.place = parseGwPlace(dp);
            childPerson.events.push(evt);
          }
        }

        // Apply occupation
        const occu = child.tags.get('occu');
        if (occu) {
          childPerson.occupation = undoUnderscores(occu);
        }
      }

      db.families.set(familyId, family);
    }
  }

  // Second pass: process pevt blocks to add/update events
  for (const block of blocks) {
    if (block.type === 'pevt') {
      // "pevt SURNAME Given"
      const parts = block.line.replace(/^pevt\s+/, '').split(/\s+/);
      const surname = parts[0] || '';
      const given = parts.slice(1).join(' ');

      const person = findPersonByKey(db, pMap, surname, given);
      if (person) {
        const newEvents = parsePevtEvents(block.eventLines);
        for (const evt of newEvents) {
          // Update existing events or add new ones
          const existing = person.events.find(e => e.type === evt.type);
          if (existing) {
            // Merge: prefer more detailed data
            if (evt.date && (!existing.date || !existing.date.year)) {
              existing.date = evt.date;
            }
            if (evt.place && !existing.place) {
              existing.place = evt.place;
            }
            if (evt.notes) {
              existing.notes = existing.notes
                ? existing.notes + '\n' + evt.notes
                : evt.notes;
            }
            if (evt.sources && !existing.sources) {
              existing.sources = evt.sources;
            }
          } else {
            person.events.push(evt);
          }
        }
      }
    }
  }

  // Third pass: notes blocks
  for (const block of blocks) {
    if (block.type === 'notes') {
      const parts = block.line.replace(/^notes\s+/, '').split(/\s+/);
      const surname = parts[0] || '';
      const given = parts.slice(1).join(' ');

      const person = findPersonByKey(db, pMap, surname, given);
      if (person) {
        const noteText = (block as GwNotesBlock).textLines.join('\n').trim();
        person.notes = person.notes ? person.notes + '\n' + noteText : noteText;
      }
    }
  }

  return db;
}
