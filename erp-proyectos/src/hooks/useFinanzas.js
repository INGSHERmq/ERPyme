import { useContext } from 'react';
import FinanzasContext from '../context/FinanzasContext';

const useFinanzas = () => {
  const context = useContext(FinanzasContext);
  if (!context) {
    throw new Error('useFinanzas debe usarse dentro de FinanzasProvider');
  }
  return context;
};

export default useFinanzas;