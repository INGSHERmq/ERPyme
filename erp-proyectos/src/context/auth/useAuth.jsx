import { useContext } from 'react';
import { AuthContext } from './context';

// ✅ Solo exportamos el hook (este archivo NO tiene componentes → Fast Refresh OK)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default useAuth;