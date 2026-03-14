import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenealogy } from '../../store/GenealogyContext';
import { getDisplayName, getBirthEvent, getDeathEvent, getMarriageEvent } from '../../types/genealogy';
import type { Person, Family } from '../../types/genealogy';
import { formatDate } from '../../parsers/date-parser';
import { PersonForm } from '../forms/PersonForm';
import styles from './PersonModal.module.css';

interface Props {
  personId: string;
  onClose: () => void;
  onNavigate: (personId: string) => void;
}

export function PersonModal({ personId, onClose, onNavigate }: Props) {
  const { t, i18n } = useTranslation();
  const { state, dispatch } = useGenealogy();
  const [showEdit, setShowEdit] = useState(false);
  const person = state.database.persons.get(personId);

  if (!person) return null;

  const birth = getBirthEvent(person);
  const death = getDeathEvent(person);
  const locale = i18n.language;

  // Find parents
  let parents: { father?: Person; mother?: Person } = {};
  if (person.familyAsChildId) {
    const parentFamily = state.database.families.get(person.familyAsChildId);
    if (parentFamily) {
      if (parentFamily.husbandId) parents.father = state.database.persons.get(parentFamily.husbandId);
      if (parentFamily.wifeId) parents.mother = state.database.persons.get(parentFamily.wifeId);
    }
  }

  // Find spouses and marriages
  const marriages: { spouse?: Person; family: Family }[] = [];
  for (const famId of person.familyAsSpouseIds) {
    const family = state.database.families.get(famId);
    if (family) {
      const spouseId = person.sex === 'M' ? family.wifeId : family.husbandId;
      const spouse = spouseId ? state.database.persons.get(spouseId) : undefined;
      marriages.push({ spouse, family });
    }
  }

  // Find children
  const children: Person[] = [];
  for (const famId of person.familyAsSpouseIds) {
    const family = state.database.families.get(famId);
    if (family) {
      for (const childId of family.childrenIds) {
        const child = state.database.persons.get(childId);
        if (child) children.push(child);
      }
    }
  }

  // Find siblings
  const siblings: Person[] = [];
  if (person.familyAsChildId) {
    const parentFamily = state.database.families.get(person.familyAsChildId);
    if (parentFamily) {
      for (const childId of parentFamily.childrenIds) {
        if (childId !== personId) {
          const sibling = state.database.persons.get(childId);
          if (sibling) siblings.push(sibling);
        }
      }
    }
  }

  const handleSetRoot = () => {
    dispatch({ type: 'SET_ROOT_PERSON', payload: personId });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>

        <div className={styles.header}>
          <div className={styles.avatar}>
            {person.sex === 'M' ? '♂' : person.sex === 'F' ? '♀' : '?'}
          </div>
          <div>
            <h2 className={styles.name}>{getDisplayName(person)}</h2>
            {person.name.birthName && (
              <span className={styles.birthName}>
                {t('form.birthName')}: {person.name.birthName}
              </span>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>{t('person.events')}</h4>
          {birth && (
            <div className={styles.event}>
              <span className={styles.eventLabel}>{t('person.born')}</span>
              <span>{formatDate(birth.date, locale)}</span>
              {birth.place && <span className={styles.place}>{birth.place.original}</span>}
            </div>
          )}
          {death && (
            <div className={styles.event}>
              <span className={styles.eventLabel}>{t('person.died')}</span>
              <span>{formatDate(death.date, locale)}</span>
              {death.place && <span className={styles.place}>{death.place.original}</span>}
            </div>
          )}
          {person.events.filter(e => e.type !== 'birth' && e.type !== 'death').map((evt, i) => (
            <div key={i} className={styles.event}>
              <span className={styles.eventLabel}>{evt.type}</span>
              {evt.date && <span>{formatDate(evt.date, locale)}</span>}
              {evt.place && <span className={styles.place}>{evt.place.original}</span>}
              {evt.notes && <span className={styles.notes}>{evt.notes}</span>}
            </div>
          ))}
        </div>

        {person.occupation && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('person.occupation')}</h4>
            <p>{person.occupation}</p>
          </div>
        )}

        {(parents.father || parents.mother) && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('person.parents')}</h4>
            {parents.father && (
              <button className={styles.personLink} onClick={() => onNavigate(parents.father!.id)}>
                {getDisplayName(parents.father)}
              </button>
            )}
            {parents.mother && (
              <button className={styles.personLink} onClick={() => onNavigate(parents.mother!.id)}>
                {getDisplayName(parents.mother)}
              </button>
            )}
          </div>
        )}

        {marriages.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('person.spouses')}</h4>
            {marriages.map(({ spouse, family }, i) => {
              const marriage = getMarriageEvent(family);
              return (
                <div key={i} className={styles.marriageItem}>
                  {spouse && (
                    <button className={styles.personLink} onClick={() => onNavigate(spouse.id)}>
                      {getDisplayName(spouse)}
                    </button>
                  )}
                  {marriage && (
                    <span className={styles.marriageDate}>
                      {t('person.married')}: {formatDate(marriage.date, locale)}
                      {marriage.place && ` - ${marriage.place.original}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {children.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('person.children')}</h4>
            {children.map((child) => (
              <button key={child.id} className={styles.personLink} onClick={() => onNavigate(child.id)}>
                {getDisplayName(child)}
              </button>
            ))}
          </div>
        )}

        {siblings.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('person.siblings')}</h4>
            {siblings.map((sib) => (
              <button key={sib.id} className={styles.personLink} onClick={() => onNavigate(sib.id)}>
                {getDisplayName(sib)}
              </button>
            ))}
          </div>
        )}

        {person.notes && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>{t('person.notes')}</h4>
            <p className={styles.notesText}>{person.notes}</p>
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.btnAccent} onClick={() => setShowEdit(true)}>
            {t('common.edit')}
          </button>
          <button className={styles.btnAccent} onClick={handleSetRoot}>
            {t('tree.setAsRoot')}
          </button>
        </div>

        {showEdit && (
          <PersonForm person={person} onClose={() => setShowEdit(false)} />
        )}
      </div>
    </div>
  );
}
