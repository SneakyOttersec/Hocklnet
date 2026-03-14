import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenealogy } from '../../store/GenealogyContext';
import { nanoid } from 'nanoid';
import type { Person, GeneEvent, Sex } from '../../types/genealogy';
import { parseGedcomDate } from '../../parsers/date-parser';
import styles from '../modals/Modal.module.css';
import formStyles from './Forms.module.css';

interface Props {
  person?: Person;
  onClose: () => void;
}

export function PersonForm({ person, onClose }: Props) {
  const { t } = useTranslation();
  const { dispatch } = useGenealogy();
  const isEdit = !!person;

  const [given, setGiven] = useState(person?.name.given || '');
  const [surname, setSurname] = useState(person?.name.surname || '');
  const [birthName, setBirthName] = useState(person?.name.birthName || '');
  const [sex, setSex] = useState<Sex>(person?.sex || 'U');
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [deathDate, setDeathDate] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [occupation, setOccupation] = useState(person?.occupation || '');
  const [notes, setNotes] = useState(person?.notes || '');

  // Pre-fill dates from existing events
  useState(() => {
    if (person) {
      const birth = person.events.find(e => e.type === 'birth');
      if (birth?.date?.raw) setBirthDate(birth.date.raw);
      if (birth?.place?.original) setBirthPlace(birth.place.original);
      const death = person.events.find(e => e.type === 'death');
      if (death?.date?.raw) setDeathDate(death.date.raw);
      if (death?.place?.original) setDeathPlace(death.place.original);
    }
  });

  const handleSave = () => {
    const events: GeneEvent[] = [];

    if (birthDate || birthPlace) {
      events.push({
        type: 'birth',
        date: birthDate ? parseGedcomDate(birthDate) : undefined,
        place: birthPlace ? { original: birthPlace } : undefined,
      });
    }

    if (deathDate || deathPlace) {
      events.push({
        type: 'death',
        date: deathDate ? parseGedcomDate(deathDate) : undefined,
        place: deathPlace ? { original: deathPlace } : undefined,
      });
    }

    if (isEdit) {
      dispatch({
        type: 'EDIT_PERSON',
        payload: {
          id: person!.id,
          updates: {
            name: { given, surname, birthName: birthName || undefined },
            sex,
            events: [...events, ...person!.events.filter(e => e.type !== 'birth' && e.type !== 'death')],
            occupation: occupation || undefined,
            notes: notes || undefined,
          },
        },
      });
    } else {
      dispatch({
        type: 'ADD_PERSON',
        payload: {
          id: nanoid(8),
          name: { given, surname, birthName: birthName || undefined },
          sex,
          events,
          occupation: occupation || undefined,
          notes: notes || undefined,
          media: [],
          familyAsSpouseIds: [],
        },
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (person && window.confirm(t('settings.clearConfirm'))) {
      dispatch({ type: 'DELETE_PERSON', payload: person.id });
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>
          {isEdit ? t('common.edit') : t('common.add')} - {t('dashboard.totalPersons')}
        </h3>

        <div className={formStyles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>{t('form.givenName')}</label>
            <input className={styles.input} value={given} onChange={(e) => setGiven(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('form.surname')}</label>
            <input className={styles.input} value={surname} onChange={(e) => setSurname(e.target.value)} />
          </div>
        </div>

        <div className={formStyles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>{t('form.birthName')}</label>
            <input className={styles.input} value={birthName} onChange={(e) => setBirthName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('form.sex')}</label>
            <select className={styles.select} value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              <option value="M">{t('form.male')}</option>
              <option value="F">{t('form.female')}</option>
              <option value="U">{t('form.unknown')}</option>
            </select>
          </div>
        </div>

        <div className={formStyles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>{t('person.born')} - {t('form.date')}</label>
            <input className={styles.input} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} placeholder="15 JUN 1961" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('person.born')} - {t('form.place')}</label>
            <input className={styles.input} value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
          </div>
        </div>

        <div className={formStyles.grid}>
          <div className={styles.field}>
            <label className={styles.label}>{t('person.died')} - {t('form.date')}</label>
            <input className={styles.input} value={deathDate} onChange={(e) => setDeathDate(e.target.value)} placeholder="ABT 2001" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('person.died')} - {t('form.place')}</label>
            <input className={styles.input} value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('person.occupation')}</label>
          <input className={styles.input} value={occupation} onChange={(e) => setOccupation(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('person.notes')}</label>
          <textarea className={formStyles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <div className={styles.actions}>
          {isEdit && (
            <button className={styles.btnDanger} onClick={handleDelete}>
              {t('common.delete')}
            </button>
          )}
          <div style={{ flex: 1 }} />
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
