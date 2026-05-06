import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const ReportesGerencialesView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.reportes} onBack={onBack} />;

export default ReportesGerencialesView;
