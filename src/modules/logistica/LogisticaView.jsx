import { useState } from 'react';
import { useAuth } from '../../context/auth/useAuth';
import SimpleCrudLogisticaView from './SimpleCrudLogisticaView';
import OrdenesCompraView from './OrdenesCompraView';
import MaterialesView from './MaterialesView';
import AsignacionesNombresView from './AsignacionesNombresView';
import SubscriptionLock from '../../components/SubscriptionLock';
import './LogisticaView.css';

const LogisticaView = ({ onBack, initialTab }) => {
  const { canAccessFeature } = useAuth();
  const [tab, setTab] = useState(initialTab || 'proveedores');
  const tabs = [
    { id: 'proveedores', feature: 'logistica.suppliers', label: 'Proveedores' },
    { id: 'ordenes', feature: 'logistica.purchaseOrders', label: 'Orden de compra' },
    { id: 'materiales', feature: 'logistica.materials', label: 'Materiales' },
    { id: 'inventario', feature: 'logistica.inventory', label: 'Inventario' },
    { id: 'asignaciones', feature: 'logistica.assignments', label: 'Asignaciones' },
    { id: 'mantenimiento', feature: 'logistica.maintenance', label: 'Mantenimiento' },
    { id: 'kardex', feature: 'logistica.kardex', label: 'Kardex' }
  ].map((item) => ({ ...item, locked: !canAccessFeature(item.feature) }));
  const activeTab = tabs.some((item) => item.id === tab) ? tab : tabs[0]?.id;
  const activeTabConfig = tabs.find((item) => item.id === activeTab);

  const renderTab = () => {
    if (activeTabConfig?.locked) {
      return <SubscriptionLock title={`${activeTabConfig.label} está bloqueado`} />;
    }

    switch (activeTab) {
      case 'proveedores':
        return <SimpleCrudLogisticaView title="Proveedores" table="proveedores" fields={[
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'ruc', label: 'RUC' },
          { name: 'contacto', label: 'Contacto' },
          { name: 'telefono', label: 'Teléfono' },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'], defaultValue: 'Activo' }
        ]} />;
      case 'ordenes':
        return <OrdenesCompraView />;
      case 'materiales':
        return <MaterialesView />;
      case 'inventario':
        return <SimpleCrudLogisticaView title="Inventario" table="inventario_objetos" fields={[
          { name: 'codigo', label: 'Código' },
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'proyecto_id', label: 'Proyecto', type: 'project' },
          { name: 'tipo_inventario', label: 'Tipo inventario', type: 'select', options: ['consumible', 'herramienta', 'activo', 'equipo_serializado'], defaultValue: 'consumible' },
          { name: 'stock_actual', label: 'Stock', type: 'number', defaultValue: '0' },
          { name: 'costo_unitario', label: 'Costo unitario', type: 'number', defaultValue: '0' }
        ]} />;
      case 'asignaciones':
        return <AsignacionesNombresView />;
      case 'mantenimiento':
        return <SimpleCrudLogisticaView title="Mantenimiento" table="mantenimiento_objetos" fields={[
          { name: 'inventario_objeto_id', label: 'Objeto ID', type: 'number', required: true },
          { name: 'proveedor_id', label: 'Proveedor técnico ID', type: 'number' },
          { name: 'fecha_inicio', label: 'Fecha inicio', type: 'date' },
          { name: 'fecha_fin', label: 'Fecha fin', type: 'date' },
          { name: 'costo', label: 'Costo', type: 'number', defaultValue: '0' }
        ]} />;
      case 'kardex':
        return <SimpleCrudLogisticaView title="Kardex / movimientos" table="kardex_movimientos" fields={[
          { name: 'inventario_objeto_id', label: 'Objeto ID', type: 'number', required: true },
          { name: 'tipo_movimiento', label: 'Tipo', type: 'select', options: ['ingreso', 'salida', 'transferencia', 'mantenimiento', 'pérdida', 'devolución'], defaultValue: 'ingreso' },
          { name: 'cantidad', label: 'Cantidad', type: 'number', required: true, defaultValue: '1' },
          { name: 'referencia_tipo', label: 'Referencia tipo' },
          { name: 'observacion', label: 'Observación' }
        ]} />;
      default:
        return null;
    }
  };

  return (
    <div className="module-container">
      <section className="module-hero module-hero-logistica">
        <button onClick={onBack} className="module-hero-back">Volver al inicio</button>
        <h1>Logística</h1>
        <p>Proveedores, órdenes, materiales, inventario, asignaciones, mantenimiento y kardex.</p>
      </section>
      <nav className="tabs-nav">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`${activeTab === item.id ? 'active' : ''} ${item.locked ? 'locked' : ''}`}
            aria-disabled={item.locked}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main className="content-area">
        {renderTab()}
      </main>
    </div>
  );
};

export default LogisticaView;
