import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const CajaBancosView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.caja} onBack={onBack} />;

export default CajaBancosView;
