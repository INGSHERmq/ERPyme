import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const DocumentosAdjuntosView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.documentos} onBack={onBack} />;

export default DocumentosAdjuntosView;
