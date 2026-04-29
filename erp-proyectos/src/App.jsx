import { useState } from 'react';
import Home from './Home';
import ProjectsView from './modules/projects/ProjectsView';
import MarketingView from './modules/marketing/MarketingView';
import FinanzasView from './modules/finanzas/FinanzasView';
import RRHHView from './modules/rrhh/RRHHView';
import LogisticaView from './modules/logistica/LogisticaView';
import { ProjectProvider } from './context/ProjectContext';
import { MarketingProvider } from './context/MarketingContext';
import { FinanzasProvider } from './context/FinanzasContext';
import { RRHHProvider } from './context/RRHHContext';
import { LogisticaProvider } from './context/LogisticaContext';

function App() {
  const [module, setModule] = useState('home');
  const back = () => setModule('home');

  return (
    <>
      {module === 'home' && <Home onNavigate={setModule} />}
      {module === 'projects' && <ProjectProvider><ProjectsView onBack={back} /></ProjectProvider>}
      {module === 'marketing' && <MarketingProvider><MarketingView onBack={back} /></MarketingProvider>}
      {module === 'finanzas' && <FinanzasProvider><FinanzasView onBack={back} /></FinanzasProvider>}
      {module === 'rrhh' && <RRHHProvider><RRHHView onBack={back} /></RRHHProvider>}
      {module === 'logistica' && <LogisticaProvider><LogisticaView onBack={back} /></LogisticaProvider>}
    </>
  );
}
export default App;