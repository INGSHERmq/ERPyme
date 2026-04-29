import { useContext } from 'react';
import RRHHContext from '../context/RRHHContext';

const useRRHH = () => {
  const context = useContext(RRHHContext);
  if (!context) throw new Error('useRRHH debe usarse dentro de RRHHProvider');
  return context;
};

export default useRRHH;