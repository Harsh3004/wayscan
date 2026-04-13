import en from './locales/en.json';
import hi from './locales/hi.json';

export const dictionaries = {
  en,
  hi,
};

export type Locale = keyof typeof dictionaries;
export type Dictionary = typeof en;

/**
 * Type-safe path accessor for nested dictionary keys.
 * Handles paths like "dashboard.kpi.total_potholes".
 */
export function getNestedTranslation(obj: any, path: string, fallback: string): string {
  if (!path) return fallback;
  
  const properties = path.split('.');
  let currentObj = obj;
  
  for (const property of properties) {
    if (currentObj && typeof currentObj === 'object' && property in currentObj) {
      currentObj = currentObj[property];
    } else {
      return fallback;
    }
  }
  
  return typeof currentObj === 'string' ? currentObj : fallback;
}
