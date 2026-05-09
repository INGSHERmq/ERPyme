import { useState } from 'react';
import SimpleCrudLogisticaView from './SimpleCrudLogisticaView';
import OrdenesCompraView from './OrdenesCompraView';
import MaterialesView from './MaterialesView';
import AsignacionesNombresView from './AsignacionesNombresView';
import './LogisticaView.css';

const LogisticaView = ({ onBack }) => {
  const [tab, setTab] = useState('proveedores');

  const renderTab = () => {
    switch (tab) {
      case 'proveedores':
        return <SimpleCrudLogisticaView title="Proveedores" table="proveedores" fields={[
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'ruc', label: 'RUC' },
          { name: 'contacto', label: 'Contacto' },
          { name: 'telefono', label: 'Telefono' },
          { name: 'estado', label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'], defaultValue: 'Activo' }
        ]} />;
      case 'ordenes':
        return <OrdenesCompraView />;
      case 'materiales':
        return <MaterialesView />;
      case 'inventario':
        return <SimpleCrudLogisticaView title="Inventario" table="inventario_objetos" fields={[
          { name: 'codigo', label: 'Codigo' },
          { name: 'nombre', label: 'Nombre', required: true },
          { name: 'tipo_inventario', label: 'Tipo inventario', type: 'select', options: ['consumible', 'herramienta', 'activo', 'equipo_serializado'], defaultValue: 'consumible' },
          { name: 'stock_actual', label: 'Stock', type: 'number', defaultValue: '0' },
          { name: 'costo_unitario', label: 'Costo unitario', type: 'number', defaultValue: '0' }
        ]} />;
      case 'asignaciones':
        return <AsignacionesNombresView />;
      case 'mantenimiento':
        return <SimpleCrudLogisticaView title="Mantenimiento" table="mantenimiento_objetos" fields={[
          { name: 'inventario_objeto_id', label: 'Objeto ID', type: 'number', required: true },
          { name: 'proveedor_id', label: 'Proveedor tecnico ID', type: 'number' },
          { name: 'fecha_inicio', label: 'Fecha inicio', type: 'date' },
          { name: 'fecha_fin', label: 'Fecha fin', type: 'date' },
          { name: 'costo', label: 'Costo', type: 'number', defaultValue: '0' }
        ]} />;
      case 'kardex':
        return <SimpleCrudLogisticaView title="Kardex / movimientos" table="kardex_movimientos" fields={[
          { name: 'inventario_objeto_id', label: 'Objeto ID', type: 'number', required: true },
          { name: 'tipo_movimiento', label: 'Tipo', type: 'select', options: ['ingreso', 'salida', 'transferencia', 'mantenimiento', 'perdida', 'devolucion'], defaultValue: 'ingreso' },
          { name: 'cantidad', label: 'Cantidad', type: 'number', required: true, defaultValue: '1' },
          { name: 'referencia_tipo', label: 'Referencia tipo' },
          { name: 'observacion', label: 'Observacion' }
        ]} />;
      default:
        return null;
    }
  };

  return (
    <div className="module-container">
      <section className="module-hero module-hero-logistica">
        <button onClick={onBack} className="module-hero-back">Volver al inicio</button>
        <h1>Logistica</h1>
        <p>Proveedores, ordenes, materiales, inventario, asignaciones, mantenimiento y kardex.</p>
      </section>
      <nav className="tabs-nav">
        <button className={tab === 'proveedores' ? 'active' : ''} onClick={() => setTab('proveedores')}>Proveedores</button>
        <button className={tab === 'ordenes' ? 'active' : ''} onClick={() => setTab('ordenes')}>Orden compra</button>
        <button className={tab === 'materiales' ? 'active' : ''} onClick={() => setTab('materiales')}>Materiales</button>
        <button className={tab === 'inventario' ? 'active' : ''} onClick={() => setTab('inventario')}>Inventario</button>
        <button className={tab === 'asignaciones' ? 'active' : ''} onClick={() => setTab('asignaciones')}>Asignaciones</button>
        <button className={tab === 'mantenimiento' ? 'active' : ''} onClick={() => setTab('mantenimiento')}>Mantenimiento</button>
        <button className={tab === 'kardex' ? 'active' : ''} onClick={() => setTab('kardex')}>Kardex</button>
      </nav>
      <main className="content-area">{renderTab()}</main>
    </div>
  );
};

export default LogisticaView;
