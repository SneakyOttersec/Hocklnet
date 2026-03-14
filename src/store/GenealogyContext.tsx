import React, { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import { produce } from 'immer';
import type {
  GenealogyDatabase, Person, Family, EntityId, GeneEvent,
} from '../types/genealogy';
import { createEmptyDatabase } from '../types/genealogy';
import { nanoid } from 'nanoid';
import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from '../utils/idb-storage';

// State
export interface GenealogyState {
  database: GenealogyDatabase;
  selectedPersonId: EntityId | null;
  rootPersonId: EntityId | null;
  vizMode: VizMode;
  isLoaded: boolean;
}

export type VizMode = 'classic' | 'parchment' | 'natural' | 'victorian' | 'handdrawn';

const initialState: GenealogyState = {
  database: createEmptyDatabase(),
  selectedPersonId: null,
  rootPersonId: null,
  vizMode: 'classic',
  isLoaded: false,
};

// Actions
export type GenealogyAction =
  | { type: 'LOAD_DATABASE'; payload: GenealogyDatabase }
  | { type: 'CLEAR_DATABASE' }
  | { type: 'SELECT_PERSON'; payload: EntityId | null }
  | { type: 'SET_ROOT_PERSON'; payload: EntityId | null }
  | { type: 'SET_VIZ_MODE'; payload: VizMode }
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'EDIT_PERSON'; payload: { id: EntityId; updates: Partial<Person> } }
  | { type: 'DELETE_PERSON'; payload: EntityId }
  | { type: 'ADD_FAMILY'; payload: Family }
  | { type: 'EDIT_FAMILY'; payload: { id: EntityId; updates: Partial<Family> } }
  | { type: 'DELETE_FAMILY'; payload: EntityId }
  | { type: 'ADD_EVENT_TO_PERSON'; payload: { personId: EntityId; event: GeneEvent } }
  | { type: 'ADD_EVENT_TO_FAMILY'; payload: { familyId: EntityId; event: GeneEvent } }
  | { type: 'MERGE_DATABASE'; payload: GenealogyDatabase };

// Reducer using immer
function genealogyReducer(state: GenealogyState, action: GenealogyAction): GenealogyState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'LOAD_DATABASE': {
        // Convert Maps from payload (they might not be real Maps after serialization)
        const db = action.payload;
        draft.database = {
          persons: db.persons instanceof Map ? db.persons : new Map(Object.entries(db.persons)),
          families: db.families instanceof Map ? db.families : new Map(Object.entries(db.families)),
          metadata: db.metadata,
        };
        draft.isLoaded = true;
        // Set root person to first person
        const firstId = draft.database.persons.keys().next().value;
        if (firstId && !draft.rootPersonId) {
          draft.rootPersonId = firstId;
        }
        break;
      }

      case 'CLEAR_DATABASE':
        draft.database = createEmptyDatabase();
        draft.selectedPersonId = null;
        draft.rootPersonId = null;
        draft.isLoaded = false;
        break;

      case 'SELECT_PERSON':
        draft.selectedPersonId = action.payload;
        break;

      case 'SET_ROOT_PERSON':
        draft.rootPersonId = action.payload;
        break;

      case 'SET_VIZ_MODE':
        draft.vizMode = action.payload;
        break;

      case 'ADD_PERSON': {
        const person = { ...action.payload, id: action.payload.id || nanoid(8) };
        draft.database.persons.set(person.id, person);
        break;
      }

      case 'EDIT_PERSON': {
        const existing = draft.database.persons.get(action.payload.id);
        if (existing) {
          Object.assign(existing, action.payload.updates);
        }
        break;
      }

      case 'DELETE_PERSON': {
        const id = action.payload;
        // Remove from families
        for (const family of draft.database.families.values()) {
          if (family.husbandId === id) family.husbandId = undefined;
          if (family.wifeId === id) family.wifeId = undefined;
          family.childrenIds = family.childrenIds.filter(cid => cid !== id);
        }
        draft.database.persons.delete(id);
        if (draft.selectedPersonId === id) draft.selectedPersonId = null;
        if (draft.rootPersonId === id) draft.rootPersonId = null;
        break;
      }

      case 'ADD_FAMILY': {
        const family = { ...action.payload, id: action.payload.id || nanoid(8) };
        draft.database.families.set(family.id, family);
        break;
      }

      case 'EDIT_FAMILY': {
        const existing = draft.database.families.get(action.payload.id);
        if (existing) {
          Object.assign(existing, action.payload.updates);
        }
        break;
      }

      case 'DELETE_FAMILY': {
        const id = action.payload;
        // Remove family references from persons
        for (const person of draft.database.persons.values()) {
          person.familyAsSpouseIds = person.familyAsSpouseIds.filter(fid => fid !== id);
          if (person.familyAsChildId === id) person.familyAsChildId = undefined;
        }
        draft.database.families.delete(id);
        break;
      }

      case 'ADD_EVENT_TO_PERSON': {
        const person = draft.database.persons.get(action.payload.personId);
        if (person) {
          person.events.push(action.payload.event);
        }
        break;
      }

      case 'ADD_EVENT_TO_FAMILY': {
        const family = draft.database.families.get(action.payload.familyId);
        if (family) {
          family.events.push(action.payload.event);
        }
        break;
      }

      case 'MERGE_DATABASE': {
        const incoming = action.payload;
        for (const [id, person] of incoming.persons) {
          if (!draft.database.persons.has(id)) {
            draft.database.persons.set(id, person);
          }
        }
        for (const [id, family] of incoming.families) {
          if (!draft.database.families.has(id)) {
            draft.database.families.set(id, family);
          }
        }
        draft.isLoaded = true;
        break;
      }
    }
  });
}

// Context
interface GenealogyContextValue {
  state: GenealogyState;
  dispatch: React.Dispatch<GenealogyAction>;
}

const GenealogyContext = createContext<GenealogyContextValue | null>(null);

export function GenealogyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(genealogyReducer, initialState);
  const [idbEnabled, setIdbEnabled] = React.useState(
    localStorage.getItem('hocklnet-idb') === 'true'
  );
  const hasLoadedIdb = useRef(false);

  // Load from IndexedDB on mount if enabled
  useEffect(() => {
    if (!idbEnabled || hasLoadedIdb.current) return;
    hasLoadedIdb.current = true;
    loadFromIndexedDB().then((db) => {
      if (db) dispatch({ type: 'LOAD_DATABASE', payload: db });
    });
  }, [idbEnabled]);

  // Listen for localStorage changes (when Settings toggles IDB)
  useEffect(() => {
    const onStorage = () => {
      setIdbEnabled(localStorage.getItem('hocklnet-idb') === 'true');
    };
    // Listen for changes from same window (custom event)
    window.addEventListener('hocklnet-idb-changed', onStorage);
    return () => window.removeEventListener('hocklnet-idb-changed', onStorage);
  }, []);

  // Auto-save to IndexedDB when database changes or IDB is toggled on
  useEffect(() => {
    if (!idbEnabled) return;
    if (!state.isLoaded) return;
    if (state.database.persons.size === 0 && state.database.families.size === 0) {
      clearIndexedDB();
      return;
    }
    saveToIndexedDB(state.database);
  }, [state.database, state.isLoaded, idbEnabled]);

  return (
    <GenealogyContext.Provider value={{ state, dispatch }}>
      {children}
    </GenealogyContext.Provider>
  );
}

export function useGenealogy() {
  const ctx = useContext(GenealogyContext);
  if (!ctx) throw new Error('useGenealogy must be used within GenealogyProvider');
  return ctx;
}
