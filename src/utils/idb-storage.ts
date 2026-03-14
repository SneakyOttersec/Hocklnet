import { openDB, type IDBPDatabase } from 'idb';
import type { GenealogyDatabase, Person, Family } from '../types/genealogy';
import { createEmptyDatabase } from '../types/genealogy';

const DB_NAME = 'hocklnet';
const DB_VERSION = 1;
const STORE_PERSONS = 'persons';
const STORE_FAMILIES = 'families';
const STORE_META = 'metadata';

async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_PERSONS)) {
        db.createObjectStore(STORE_PERSONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FAMILIES)) {
        db.createObjectStore(STORE_FAMILIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    },
  });
}

export async function saveToIndexedDB(database: GenealogyDatabase): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORE_PERSONS, STORE_FAMILIES, STORE_META], 'readwrite');

  // Clear existing
  await tx.objectStore(STORE_PERSONS).clear();
  await tx.objectStore(STORE_FAMILIES).clear();

  // Save persons
  for (const person of database.persons.values()) {
    await tx.objectStore(STORE_PERSONS).put(person);
  }

  // Save families
  for (const family of database.families.values()) {
    await tx.objectStore(STORE_FAMILIES).put(family);
  }

  // Save metadata
  await tx.objectStore(STORE_META).put(database.metadata, 'metadata');

  await tx.done;
}

export async function loadFromIndexedDB(): Promise<GenealogyDatabase | null> {
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_PERSONS, STORE_FAMILIES, STORE_META], 'readonly');

    const persons = await tx.objectStore(STORE_PERSONS).getAll();
    const families = await tx.objectStore(STORE_FAMILIES).getAll();
    const metadata = await tx.objectStore(STORE_META).get('metadata');

    if (persons.length === 0 && families.length === 0) {
      return null;
    }

    const result = createEmptyDatabase();
    for (const p of persons) {
      result.persons.set(p.id, p as Person);
    }
    for (const f of families) {
      result.families.set(f.id, f as Family);
    }
    if (metadata) {
      result.metadata = metadata;
    }

    return result;
  } catch {
    return null;
  }
}

export async function clearIndexedDB(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORE_PERSONS, STORE_FAMILIES, STORE_META], 'readwrite');
  await tx.objectStore(STORE_PERSONS).clear();
  await tx.objectStore(STORE_FAMILIES).clear();
  await tx.objectStore(STORE_META).clear();
  await tx.done;
}
