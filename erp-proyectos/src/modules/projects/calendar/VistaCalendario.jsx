import { useState, useMemo } from 'react';
import useProjects from '../../../hooks/useProjects';
import './VistaCalendario.css';

// Constantes definidas fuera para evitar re-creación en cada render
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const VistaCalendario = () => {
  const { proyectos } = useProjects();
  
  // Estado para controlar qué mes estamos viendo
  const [viewDate, setViewDate] = useState(new Date());

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Lógica principal del calendario
  const calendarData = useMemo(() => {
    // Primer día del mes
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    // Cantidad de días del mes actual
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    // Día de la semana en que empieza (0=Dom, 1=Lun...)
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Crear array con espacios vacíos al inicio (padding)
    const daysArray = Array.from({ length: startDayOfWeek }, () => null);

    // Llenar con los días reales
    for (let d = 1; d <= daysInMonth; d++) {
      daysArray.push(new Date(currentYear, currentMonth, d));
    }

    return daysArray;
  }, [currentYear, currentMonth]);

  // Función para obtener proyectos de un día específico
  const getProjectsForDay = (date) => {
    if (!date) return [];
    return proyectos.filter(p => {
      const start = new Date(p.inicio);
      const end = new Date(p.fin);
      // Ajustar horas para comparación exacta de fechas (ignorar horas)
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999); 
      return date >= start && date <= end;
    });
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  return (
    <div className="vista-calendario">
      {/* Cabecera del Calendario */}
      <div className="calendario-header">
        <div className="header-nav">
          <button onClick={handlePrevMonth} aria-label="Mes anterior">{'< Anterior'}</button>
          <button onClick={handleToday} className="btn-hoy">Hoy</button>
          <button onClick={handleNextMonth} aria-label="Mes siguiente">{'Siguiente >'}</button>
        </div>
        <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
      </div>

      {/* Grid del Calendario */}
      <div className="calendario-grid">
        {/* Nombres de los días */}
        {DAY_NAMES.map(day => (
          <div key={day} className="dia-semana">
            {day}
          </div>
        ))}

        {/* Celdas de los días */}
        {calendarData.map((date, index) => {
          const dayProjects = date ? getProjectsForDay(date) : [];
          const isToday = date && new Date().toDateString() === date.toDateString();

          return (
            <div 
              key={index} 
              className={`celda-calendario ${!date ? 'vacia' : ''} ${isToday ? 'hoy' : ''}`}
            >
              {date && (
                <>
                  <span className="numero-dia">{date.getDate()}</span>
                  <div className="eventos-dia">
                    {dayProjects.map(p => (
                      <div 
                        key={p.id} 
                        className={`evento priority-${p.prioridad.toLowerCase()}`}
                        title={p.nombre}
                      >
                        {p.nombre}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VistaCalendario;