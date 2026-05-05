import { useState, useMemo } from 'react';
import useProjects from '../../../hooks/useProjects';
import './Calendario.css';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const Calendario = ({ proyectoId }) => {
  const { proyectos } = useProjects();
  const [viewDate, setViewDate] = useState(new Date());

  // Filtrar solo ESTE proyecto
  const proyecto = useMemo(() => {
    return proyectos.find(p => p.id === proyectoId);
  }, [proyectos, proyectoId]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startDayOfWeek = firstDay.getDay();

    const dias = Array.from({ length: startDayOfWeek }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      dias.push(new Date(currentYear, currentMonth, d));
    }
    return dias;
  }, [currentYear, currentMonth]);

  const getEventForDay = (date) => {
    if (!date || !proyecto) return null;
    
    const inicio = new Date(proyecto.inicio);
    const fin = new Date(proyecto.fin);
    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);
    
    if (date >= inicio && date <= fin) {
      return proyecto;
    }
    return null;
  };

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
  const handleToday = () => setViewDate(new Date());

  if (!proyecto) {
    return <div className="empty-state">No hay calendario para este proyecto</div>;
  }

  return (
    <div className="calendario-proyecto">
      <div className="calendario-header">
        <div className="nav-buttons">
          <button onClick={handlePrevMonth}>‹ Anterior</button>
          <button onClick={handleToday}>Hoy</button>
          <button onClick={handleNextMonth}>Siguiente ›</button>
        </div>
        <h3>{MONTH_NAMES[currentMonth]} {currentYear}</h3>
      </div>

      <div className="calendario-grid">
        {DAY_NAMES.map(day => (
          <div key={day} className="day-header">{day}</div>
        ))}

        {calendarData.map((date, index) => {
          const event = date ? getEventForDay(date) : null;
          const isToday = date && new Date().toDateString() === date.toDateString();

          return (
            <div 
              key={index} 
              className={`calendar-cell ${!date ? 'empty' : ''} ${isToday ? 'today' : ''}`}
            >
              {date && (
                <>
                  <span className="cell-number">{date.getDate()}</span>
                  {event && (
                    <div className="calendar-event">
                      <span className="event-title">{event.nombre}</span>
                      <span className="event-badge">{event.estado}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="proyecto-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#0052cc' }}></span>
          <span>{proyecto.nombre} ({proyecto.inicio} - {proyecto.fin})</span>
        </div>
      </div>
    </div>
  );
};

export default Calendario;