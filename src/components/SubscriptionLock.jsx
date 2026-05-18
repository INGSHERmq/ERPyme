const DEFAULT_MESSAGE = 'Para disfrutar de este apartado o modulo, mejora tu suscripcion.';

const SubscriptionLock = ({ title = 'Contenido bloqueado', message = DEFAULT_MESSAGE }) => (
  <section className="subscription-lock" role="status">
    <span className="subscription-lock-badge">Bloqueado</span>
    <h2>{title}</h2>
    <p>{message}</p>
  </section>
);

export default SubscriptionLock;
