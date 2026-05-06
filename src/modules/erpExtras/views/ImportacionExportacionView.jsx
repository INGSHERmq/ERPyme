import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const ImportacionExportacionView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.importacion} onBack={onBack} />;

export default ImportacionExportacionView;
