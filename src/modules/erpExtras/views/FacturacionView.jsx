import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const FacturacionView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.facturacion} onBack={onBack} />;

export default FacturacionView;
