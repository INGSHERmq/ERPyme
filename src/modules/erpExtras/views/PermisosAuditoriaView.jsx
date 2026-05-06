import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const PermisosAuditoriaView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.auditoria} onBack={onBack} />;

export default PermisosAuditoriaView;
