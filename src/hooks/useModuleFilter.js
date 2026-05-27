import { useMemo } from 'react';

export const useModuleFilter = (modules, searchTerm) => {
  return useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return modules;

    return modules.filter((mod) => {
      const searchableText = `${mod.title} ${mod.desc} ${mod.status}`.toLowerCase();
      return searchableText.includes(query);
    });
  }, [modules, searchTerm]);
};