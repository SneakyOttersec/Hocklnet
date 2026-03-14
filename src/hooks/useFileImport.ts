import { useCallback } from 'react';
import { useGenealogy } from '../store/GenealogyContext';
import { parseGedcomFile } from '../parsers/gedcom';
import { parseGenwebFile } from '../parsers/geneweb';

export function useFileImport() {
  const { dispatch } = useGenealogy();

  const importFile = useCallback((file: File): Promise<{ persons: number; families: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const ext = file.name.toLowerCase().split('.').pop();
          let db;

          if (ext === 'ged') {
            db = parseGedcomFile(text);
          } else if (ext === 'gw') {
            db = parseGenwebFile(text);
          } else {
            throw new Error(`Unsupported file format: .${ext}`);
          }

          dispatch({ type: 'LOAD_DATABASE', payload: db });
          resolve({
            persons: db.persons.size,
            families: db.families.size,
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'utf-8');
    });
  }, [dispatch]);

  return { importFile };
}
