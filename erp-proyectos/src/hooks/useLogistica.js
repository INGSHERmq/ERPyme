import { useContext } from 'react';
import LogisticaContext from '../context/LogisticaContext';

const useLogistica = () => {
  const context = useContext(LogisticaContext);
  if (!context) throw new Error('useLogistica debe usarse dentro de LogisticaProvider');
  return context;
};

export default useLogistica;