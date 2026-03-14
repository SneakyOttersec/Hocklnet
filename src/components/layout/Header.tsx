import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenealogy } from '../../store/GenealogyContext';
import { getDisplayName } from '../../types/genealogy';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

export function Header() {
  const { t } = useTranslation();
  const { state, dispatch } = useGenealogy();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const results: { id: string; name: string }[] = [];
    for (const person of state.database.persons.values()) {
      const name = getDisplayName(person).toLowerCase();
      if (name.includes(query)) {
        results.push({ id: person.id, name: getDisplayName(person) });
      }
      if (results.length >= 10) break;
    }
    return results;
  }, [searchQuery, state.database.persons]);

  const handleSelectPerson = (id: string) => {
    dispatch({ type: 'SET_ROOT_PERSON', payload: id });
    dispatch({ type: 'SELECT_PERSON', payload: id });
    setSearchQuery('');
    setShowResults(false);
    navigate('/tree');
  };

  return (
    <header className={styles.header}>
      <div className={styles.searchContainer}>
        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t('common.search')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {showResults && searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((r) => (
              <button
                key={r.id}
                className={styles.searchResultItem}
                onMouseDown={() => handleSelectPerson(r.id)}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
