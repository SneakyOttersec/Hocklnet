import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenealogy } from '../../store/GenealogyContext';
import { nanoid } from 'nanoid';
import { getDisplayName } from '../../types/genealogy';
import type { Family } from '../../types/genealogy';
import { parseGedcomDate } from '../../parsers/date-parser';
import styles from '../modals/Modal.module.css';
import formStyles from './Forms.module.css';

interface Props {
  family?: Family;
  onClose: () => void;
}

export function FamilyForm({ family, onClose }: Props) {
  const { t } = useTranslation();
  const { state, dispatch } = useGenealogy();
  const isEdit = !!family;

  const [husbandId, setHusbandId] = useState(family?.husbandId || '');
  const [wifeId, setWifeId] = useState(family?.wifeId || '');
  const [childrenIds, setChildrenIds] = useState<string[]>(family?.childrenIds || []);
  const [marriageDate, setMarriageDate] = useState('');
  const [marriagePlace, setMarriagePlace] = useState('');
  const [selectedChild, setSelectedChild] = useState('');

  const personOptions = useMemo(() => {
    return Array.from(state.database.persons.values())
      .map(p => ({ id: p.id, name: getDisplayName(p), sex: p.sex }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.database.persons]);

  const males = personOptions.filter(p => p.sex === 'M');
  const females = personOptions.filter(p => p.sex === 'F');

  const handleAddChild = () => {
    if (selectedChild && !childrenIds.includes(selectedChild)) {
      setChildrenIds([...childrenIds, selectedChild]);
      setSelectedChild('');
    }
  };

  const handleRemoveChild = (id: string) => {
    setChildrenIds(childrenIds.filter(c => c !== id));
  };

  const handleSave = () => {
    const events = [];
    if (marriageDate || marriagePlace) {
      events.push({
        type: 'marriage' as const,
        date: marriageDate ? parseGedcomDate(marriageDate) : undefined,
        place: marriagePlace ? { original: marriagePlace } : undefined,
      });
    }

    const famId = family?.id || nanoid(8);

    if (isEdit) {
      dispatch({
        type: 'EDIT_FAMILY',
        payload: {
          id: famId,
          updates: {
            husbandId: husbandId || undefined,
            wifeId: wifeId || undefined,
            childrenIds,
            events: [...events, ...(family?.events.filter(e => e.type !== 'marriage') || [])],
          },
        },
      });
    } else {
      dispatch({
        type: 'ADD_FAMILY',
        payload: {
          id: famId,
          husbandId: husbandId || undefined,
          wifeId: wifeId || undefined,
          childrenIds,
          events,
        },
      });

      // Update person spouse references
      if (husbandId) {
        const husband = state.database.persons.get(husbandId);
        if (husband && !husband.familyAsSpouseIds.includes(famId)) {
          dispatch({
            type: 'EDIT_PERSON',
            payload: {
              id: husbandId,
              updates: { familyAsSpouseIds: [...husband.familyAsSpouseIds, famId] },
            },
          });
        }
      }
      if (wifeId) {
        const wife = state.database.persons.get(wifeId);
        if (wife && !wife.familyAsSpouseIds.includes(famId)) {
          dispatch({
            type: 'EDIT_PERSON',
            payload: {
              id: wifeId,
              updates: { familyAsSpouseIds: [...wife.familyAsSpouseIds, famId] },
            },
          });
        }
      }
      for (const childId of childrenIds) {
        dispatch({
          type: 'EDIT_PERSON',
          payload: { id: childId, updates: { familyAsChildId: famId } },
        });
      }
    }

    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>
          {isEdit ? t('common.edit') : t('common.add')} - {t('dashboard.totalFamilies')}
        </h3>

        <div className={styles.field}>
          <label className={styles.label}>{t('form.husband')}</label>
          <select className={styles.select} value={husbandId} onChange={(e) => setHusbandId(e.target.value)}>
            <option value="">{t('form.selectPerson')}</option>
            {males.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('form.wife')}</label>
          <select className={styles.select} value={wifeId} onChange={(e) => setWifeId(e.target.value)}>
            <option value="">{t('form.selectPerson')}</option>
            {females.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className={formStyles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>{t('person.married')} - {t('form.date')}</label>
            <input className={styles.input} value={marriageDate} onChange={(e) => setMarriageDate(e.target.value)} placeholder="28 OCT 1689" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('person.married')} - {t('form.place')}</label>
            <input className={styles.input} value={marriagePlace} onChange={(e) => setMarriagePlace(e.target.value)} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('person.children')}</label>
          <div className={formStyles.selectGroup}>
            <select className={styles.select} value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
              <option value="">{t('form.selectPerson')}</option>
              {personOptions.filter(p => !childrenIds.includes(p.id)).map(p =>
                <option key={p.id} value={p.id}>{p.name}</option>
              )}
            </select>
            <button className={formStyles.addBtn} onClick={handleAddChild}>{t('form.addChild')}</button>
          </div>
          <div className={formStyles.childList}>
            {childrenIds.map(id => {
              const child = state.database.persons.get(id);
              return (
                <div key={id} className={formStyles.childItem}>
                  <span>{child ? getDisplayName(child) : id}</span>
                  <button className={formStyles.removeBtn} onClick={() => handleRemoveChild(id)}>&times;</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className={styles.btnPrimary} onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
