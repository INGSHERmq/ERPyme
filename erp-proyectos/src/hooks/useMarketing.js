import { useContext } from 'react';
import MarketingContext from '../context/MarketingContext';

const useMarketing = () => {
  const context = useContext(MarketingContext);
  if (!context) {
    throw new Error('useMarketing debe usarse dentro de MarketingProvider');
  }
  return context;
};

export default useMarketing;