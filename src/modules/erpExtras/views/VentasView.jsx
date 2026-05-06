import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const VentasView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.ventas} onBack={onBack} />;

export default VentasView;
