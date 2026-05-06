import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const ComprasView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.compras} onBack={onBack} />;

export default ComprasView;
