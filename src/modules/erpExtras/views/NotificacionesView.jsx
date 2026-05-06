import ErpFeatureModule from '../shared/ErpFeatureModule';
import { MODULE_CONFIG } from '../data/moduleData';

const NotificacionesView = ({ onBack }) => <ErpFeatureModule config={MODULE_CONFIG.notificaciones} onBack={onBack} />;

export default NotificacionesView;
