import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ✅ Importar TODOS los providers
import { ProjectProvider } from './context/ProjectContext';
import { MarketingProvider } from './context/MarketingContext';
import { FinanzasProvider } from './context/FinanzasContext';
import { RRHHProvider } from './context/RRHHContext';
import { LogisticaProvider } from './context/LogisticaContext';
import AuthProvider from './context/auth/AuthProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ AuthProvider debe estar MÁS EXTERNO */}
    <AuthProvider>
      <ProjectProvider>
        <MarketingProvider>
          <FinanzasProvider>
            <RRHHProvider>
              <LogisticaProvider>
                <App />
              </LogisticaProvider>
            </RRHHProvider>
          </FinanzasProvider>
        </MarketingProvider>
      </ProjectProvider>
    </AuthProvider>
  </React.StrictMode>
);