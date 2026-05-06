import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const InventarioOperativoView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.inventario} onBack={onBack} />;

export default InventarioOperativoView;
