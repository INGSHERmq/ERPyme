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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ✅ Anidar todos los providers para acceso global */}
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
  </React.StrictMode>
);