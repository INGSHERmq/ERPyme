import { supabase } from '../../lib/supabase';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0
});

const todayISO = () => new Date().toISOString().split('T')[0];

const daysBetween = (dateValue, reference = new Date()) => {
  if (!dateValue) return null;
  const date = new Date(`${dateValue}T00:00:00`);
  const ref = new Date(reference.toISOString().split('T')[0]);
  return Math.round((date - ref) / 86400000);
};

const numberValue = (value) => Number(value || 0);

export const scoreOpportunity = (opportunity = {}, lead = {}) => {
  const amount = numberValue(opportunity.monto_estimado);
  const stage = opportunity.etapa || '';
  const leadStatus = lead.estado || opportunity.lead_estado || '';
  const responseHours = numberValue(opportunity.tiempo_respuesta_horas ?? lead.tiempo_respuesta_horas);
  const source = (lead.origen || opportunity.origen || '').toLowerCase();
  const industry = (lead.industria || opportunity.industria || '').toLowerCase();
  const daysToClose = daysBetween(opportunity.fecha_cierre_estimada);

  let score = 38;
  if (['Ganada', 'Negociacion', 'Negociando'].includes(stage)) score += 24;
  if (['Propuesta'].includes(stage)) score += 16;
  if (['Calificacion', 'Interesado'].includes(stage)) score += 10;
  if (['Perdida'].includes(stage)) score -= 45;
  if (['Calificado', 'Contactado'].includes(leadStatus)) score += 10;
  if (amount >= 20000) score += 8;
  if (amount > 0 && amount < 1500) score -= 4;
  if (responseHours > 0 && responseHours <= 4) score += 12;
  if (responseHours > 24) score -= 10;
  if (source.includes('refer') || source.includes('recomend')) score += 12;
  if (source.includes('web') || source.includes('inbound')) score += 5;
  if (industry.includes('mineria') || industry.includes('tecnologia') || industry.includes('servicio')) score += 5;
  if (daysToClose !== null && daysToClose <= 14 && daysToClose >= 0) score += 8;
  if (daysToClose !== null && daysToClose < 0) score -= 12;

  return Math.min(100, Math.max(0, Math.round(score)));
};

export const classifyOpportunity = (score) => {
  if (score >= 75) return 'Alta';
  if (score >= 45) return 'Media';
  return 'Baja';
};

const buildProjectRisks = (projects = [], tasks = []) => {
  const taskGroups = tasks.reduce((acc, task) => {
    const key = task.proyecto_id;
    if (!key) return acc;
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});

  return projects
    .map((project) => {
      const projectTasks = taskGroups[project.id] || [];
      const completed = projectTasks.filter(task => task.estado === 'Completado').length;
      const taskProgress = projectTasks.length ? Math.round((completed / projectTasks.length) * 100) : null;
      const declaredProgress = Number(project.progreso);
      const progress = Number.isFinite(declaredProgress) && declaredProgress > 0 ? declaredProgress : taskProgress;
      const daysToEnd = daysBetween(project.fin || project.fecha_fin || project.fecha_fin_plan);
      const activeTasks = projectTasks.filter(task => task.estado !== 'Completado').length;
      const isRisky = (progress !== null && progress < 60 && daysToEnd !== null && daysToEnd <= 14)
        || activeTasks >= 5
        || project.prioridad === 'Alta';

      return {
        id: project.id,
        nombre: project.nombre,
        progreso: progress ?? 0,
        dias: daysToEnd,
        tareasPendientes: activeTasks,
        riesgo: isRisky
      };
    })
    .filter(project => project.riesgo)
    .sort((a, b) => (a.dias ?? 999) - (b.dias ?? 999))
    .slice(0, 4);
};

export const generateExecutiveBriefing = async (userId) => {
  if (!userId) throw new Error('Usuario no autenticado');

  const [cobrosRes, projectsRes, tasksRes, leadsRes, opportunitiesRes] = await Promise.all([
    supabase
      .from('cuentas_por_cobrar')
      .select('id,concepto,monto,fecha_vencimiento,estado,cliente_id')
      .eq('user_id', userId)
      .order('fecha_vencimiento', { ascending: true }),
    supabase
      .from('v_proyectos_completos')
      .select('id,nombre,progreso,estado,prioridad,fin')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('tareas')
      .select('id,proyecto_id,titulo,estado,prioridad,fecha_fin')
      .eq('user_id', userId),
    supabase
      .from('leads')
      .select('id,nombre,origen,estado,industria,tiempo_respuesta_horas')
      .eq('user_id', userId),
    supabase
      .from('oportunidades')
      .select('*')
      .eq('user_id', userId)
  ]);

  const firstError = [cobrosRes, projectsRes, tasksRes, leadsRes, opportunitiesRes].find(result => result.error);
  if (firstError?.error) throw firstError.error;

  const today = todayISO();
  const cobros = cobrosRes.data || [];
  const dueToday = cobros.filter(item => item.estado === 'Pendiente' && item.fecha_vencimiento === today);
  const overdue = cobros.filter(item => item.estado === 'Pendiente' && daysBetween(item.fecha_vencimiento) < 0);
  const projectRisks = buildProjectRisks(projectsRes.data || [], tasksRes.data || []);
  const leadsById = Object.fromEntries((leadsRes.data || []).map(lead => [lead.id, lead]));
  const topOpportunities = (opportunitiesRes.data || [])
    .filter(item => !['Ganada', 'Perdida'].includes(item.etapa))
    .map(item => ({
      ...item,
      probabilidad: scoreOpportunity(item, leadsById[item.lead_id])
    }))
    .sort((a, b) => b.probabilidad - a.probabilidad)
    .slice(0, 3);

  const totalDueToday = dueToday.reduce((sum, item) => sum + numberValue(item.monto), 0);
  const totalOverdue = overdue.reduce((sum, item) => sum + numberValue(item.monto), 0);
  const highlights = [];
  const actions = [];

  if (dueToday.length) {
    highlights.push(`${dueToday.length} cuenta${dueToday.length === 1 ? '' : 's'} por cobrar vencen hoy por ${currencyFormatter.format(totalDueToday)}.`);
    actions.push('Enviar recordatorios de pago a los clientes que vencen hoy.');
  }
  if (overdue.length) {
    highlights.push(`${overdue.length} cobranza${overdue.length === 1 ? '' : 's'} ya vencida${overdue.length === 1 ? '' : 's'} suman ${currencyFormatter.format(totalOverdue)}.`);
    actions.push('Priorizar seguimiento de cobranzas vencidas antes de nuevas ventas.');
  }
  if (projectRisks.length) {
    const project = projectRisks[0];
    highlights.push(`El proyecto "${project.nombre}" muestra riesgo: ${project.progreso}% de avance y ${project.tareasPendientes} tarea${project.tareasPendientes === 1 ? '' : 's'} pendiente${project.tareasPendientes === 1 ? '' : 's'}.`);
    actions.push(`Revisar alcance y carga del proyecto "${project.nombre}".`);
  }
  if (topOpportunities[0]) {
    highlights.push(`La oportunidad con mejor probabilidad es "${topOpportunities[0].titulo}" con ${topOpportunities[0].probabilidad}% de cierre.`);
    actions.push('Contactar primero las oportunidades con probabilidad alta.');
  }
  if (!highlights.length) {
    highlights.push('No encontré urgencias críticas para hoy. El negocio luce estable con los datos disponibles.');
    actions.push('Actualizar avances de proyectos y próximas fechas de cobro para mejorar el análisis.');
  }

  return {
    fecha: today,
    summary: `Hola, este es tu briefing ejecutivo de hoy: ${highlights.join(' ')}`,
    highlights,
    actions,
    dueToday,
    overdue,
    projectRisks,
    topOpportunities
  };
};
