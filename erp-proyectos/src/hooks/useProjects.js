import { useContext } from 'react';
import ProjectContext from '../context/ProjectContext';

const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects debe usarse dentro de ProjectProvider');
  }
  return context;
};

export default useProjects;