import { supabase } from '../../lib/supabase';
import {
  getStartOfTodayInAppTimeZone,
  getTodayInAppTimeZone,
  parseDateInAppTimeZone,
  toAppDateKey
} from '../../lib/dates';

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0
});

const daysBetween = (dateValue, reference = new Date()) => {
  if (!dateValue) return null;
  const date = parseDateInAppTimeZone(dateValue);
  const ref = reference ? parseDateInAppTimeZone(toAppDateKey(reference)) : getStartOfTodayInAppTimeZone();
  if (!date || !ref) return null;
  return Math.round((date - ref) / 86400000);
};

const hoursBetween = (dateValue, reference = new Date()) => {
  if (!dateValue) return null;
  const date = parseDateInAppTimeZone(dateValue, true);
  if (!date) return null;
  return Math.round((date - reference) / 3600000);
};

const numberValue = (value) => Number(value || 0);
const isPendingReceivable = (item) => (item.estado || '').toLowerCase() === 'pendiente';
const isUnpaidPurchaseInvoice = (item) => !['pagada', 'anulada', 'cancelada'].includes((item.estado || '').toLowerCase());

const isPastDue = (dateValue) => {
  if (!dateValue) return false;
  const str = String(dateValue);
  const hasTime = /T\d{2}:\d{2}/.test(str) || /\d{1,2}:\d{2}/.test(str);
  if (hasTime) {
    const dueDate = parseDateInAppTimeZone(dateValue);
    return dueDate !== null && dueDate < new Date();
  }
  const days = daysBetween(dateValue);
  return days !== null && days < 0;
};

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

export const scoreQuotationAcceptance = (quotation = {}, customer = {}, lead = {}, allQuotes = []) => {
  const status = (quotation.estado || '').toLowerCase();
  if (status === 'aprobada' || status === 'aceptada') return 100;
  if (status === 'rechazada' || status === 'vencida') return 0;

  const amount = numberValue(quotation.precio_total || quotation.monto);
  const industry = (lead.industria || customer.industria || '').toLowerCase();
  const quoteAge = quotation.fecha ? Math.max(0, -daysBetween(quotation.fecha)) : null;
  const validDays = Number.parseInt(String(quotation.validez || '').match(/\d+/)?.[0] || '30', 10);
  const daysUntilExpiry = quoteAge === null ? null : validDays - quoteAge;
  const customerQuotes = allQuotes.filter(item => (
    item.cliente_id && quotation.cliente_id && Number(item.cliente_id) === Number(quotation.cliente_id)
  ));
  const hasAcceptedBefore = customerQuotes.some(item => ['aprobada', 'aceptada'].includes((item.estado || '').toLowerCase()));

  let score = 42;
  if (hasAcceptedBefore) score += 12;
  if (amount >= 20000) score += 6;
  if (amount > 0 && amount < 1500) score -= 5;
  if (customer.email || lead.email) score += 4;
  if (customer.telefono || lead.telefono) score += 4;
  if (customer.dni_ruc || lead.dni_ruc) score += 6;
  if (industry.includes('mineria') || industry.includes('tecnologia') || industry.includes('servicio')) score += 5;
  if (quoteAge !== null && quoteAge <= 3) score += 8;
  if (quoteAge !== null && quoteAge > 14) score -= 10;
  if (daysUntilExpiry !== null && daysUntilExpiry < 0) score -= 18;
  if (daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 5) score -= 6;

  return Math.min(100, Math.max(0, Math.round(score)));
};

const buildProjectRisks = (projects = [], tasks = []) => {
  const today = getTodayInAppTimeZone();

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
      
      // Tareas retrasadas: no completadas y fecha_fin < hoy
      const delayedTasks = projectTasks.filter(task => {
        if (task.estado === 'Completado') return false;
        if (!task.fecha_fin) return false;
        return task.fecha_fin.slice(0, 10) < today;
      });

      const isRisky = (progress !== null && progress < 60 && daysToEnd !== null && daysToEnd <= 14)
        || activeTasks >= 5
        || project.prioridad === 'Alta'
        || delayedTasks.length > 0;

      return {
        id: project.id,
        nombre: project.nombre,
        progreso: progress ?? 0,
        dias: daysToEnd,
        tareasPendientes: activeTasks,
        delayedTasks: delayedTasks.map(t => ({
          id: t.id,
          titulo: t.titulo,
          estado: t.estado,
          prioridad: t.prioridad,
          fecha_fin: t.fecha_fin,
          duracion_horas: t.duracion_horas,
          empleado_nombre: t.empleado_nombre
        })),
        riesgo: isRisky
      };
    })
    .filter(project => project.riesgo)
    .sort((a, b) => {
      const aHasDelayed = a.delayedTasks.length > 0 ? 1 : 0;
      const bHasDelayed = b.delayedTasks.length > 0 ? 1 : 0;
      if (aHasDelayed !== bHasDelayed) return bHasDelayed - aHasDelayed;
      return (a.dias ?? 999) - (b.dias ?? 999);
    })
    .slice(0, 4);
};

export const generateExecutiveSummary = async (userId) => {
  if (!userId) throw new Error('Usuario no autenticado');

  // Obtenemos el perfil para saber su empresa y filtrar correctamente
  const { data: profile } = await supabase
    .from('profiles')
    .select('empresa_actual_id')
    .eq('id', userId)
    .single();

  const empresaId = profile?.empresa_actual_id;

  if (!empresaId) {
    console.warn('No se encontro empresa_actual_id para el usuario:', userId);
  }

  const [cobrosRes, projectsRes, tasksRes, quotesRes, clientesRes, purchaseInvoicesRes] = await Promise.all([
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
      .from('v_tareas_completas')
      .select('id,proyecto_id,titulo,estado,prioridad,fecha_inicio,fecha_fin,duracion_horas,empleado_nombre')
      .eq('user_id', userId),
    supabase
      .from('v_cotizaciones_completas')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('clientes')
      .select('id,nombre,email,telefono,industria,dni_ruc')
      .eq('user_id', userId),
    supabase
      .from('facturas_compra')
      .select('id,numero,total,estado,fecha_emision,fecha_vencimiento,proyecto_id,ordenes_compra(numero,nombre_compra,fecha_vencimiento,proyecto_id)')
      .eq('empresa_id', empresaId)
      .order('fecha_emision', { ascending: false })
  ]);

  const firstError = [cobrosRes, projectsRes, tasksRes, quotesRes, clientesRes, purchaseInvoicesRes].find(result => result.error);
  if (firstError?.error) throw firstError.error;

  const today = getTodayInAppTimeZone();
  const cobros = cobrosRes.data || [];
  const purchaseInvoices = purchaseInvoicesRes.data || [];
  const purchaseInvoicesWithDue = purchaseInvoices.map(item => ({
    ...item,
    monto: item.total,
    concepto: `Factura de compra ${item.numero || ''}`.trim(),
    tipo: 'compra',
    fecha_vencimiento: item.fecha_vencimiento || item.ordenes_compra?.fecha_vencimiento
  }));
  const receivablesDueToday = cobros.filter(item => isPendingReceivable(item) && toAppDateKey(item.fecha_vencimiento) === today && !isPastDue(item.fecha_vencimiento));
  const purchasesDueToday = purchaseInvoicesWithDue.filter(item => (
    isUnpaidPurchaseInvoice(item) && toAppDateKey(item.fecha_vencimiento) === today && !isPastDue(item.fecha_vencimiento)
  ));
  const dueToday = [...receivablesDueToday, ...purchasesDueToday];
  const receivablesOverdue = cobros.filter(item => isPendingReceivable(item) && isPastDue(item.fecha_vencimiento));
  const purchasesOverdue = purchaseInvoicesWithDue.filter(item => (
    isUnpaidPurchaseInvoice(item) && isPastDue(item.fecha_vencimiento)
  ));
  const overdue = [...receivablesOverdue, ...purchasesOverdue];
  const projectRisks = buildProjectRisks(projectsRes.data || [], tasksRes.data || []);
  const clientesById = Object.fromEntries((clientesRes.data || []).map(cliente => [cliente.id, cliente]));
  const leads = clientesRes.data || [];
  const quotes = quotesRes.data || [];
  const findLeadForCustomer = (customer = {}) => leads.find(lead => (
    (lead.email && customer.email && lead.email.toLowerCase() === customer.email.toLowerCase())
    || (lead.nombre && customer.nombre && lead.nombre.toLowerCase() === customer.nombre.toLowerCase())
  )) || {};
  const topOpportunities = quotes
    .filter(item => !['aprobada', 'aceptada', 'rechazada', 'vencida'].includes((item.estado || '').toLowerCase()))
    .map(item => ({
      ...item,
      probabilidad: scoreQuotationAcceptance(item, clientesById[item.cliente_id], findLeadForCustomer(clientesById[item.cliente_id]), quotes)
    }))
    .sort((a, b) => b.probabilidad - a.probabilidad)
    .slice(0, 3);

  const totalDueToday = dueToday.reduce((sum, item) => sum + numberValue(item.monto), 0);
  const totalOverdue = overdue.reduce((sum, item) => sum + numberValue(item.monto), 0);
  const purchaseDueSoon = purchaseInvoicesWithDue.filter(item => {
    const hours = hoursBetween(item.fecha_vencimiento);
    return isUnpaidPurchaseInvoice(item) && hours !== null && hours >= 0 && hours <= 168;
  });
  const highlights = [];
  const actions = [];

  if (dueToday.length) {
    highlights.push(`${dueToday.length} factura${dueToday.length === 1 ? '' : 's'} vencen hoy por ${currencyFormatter.format(totalDueToday)}.`);
    actions.push('Revisar las facturas pendientes que vencen hoy.');
  }
  if (overdue.length) {
    highlights.push(`${overdue.length} cobranza${overdue.length === 1 ? '' : 's'} ya vencida${overdue.length === 1 ? '' : 's'} suman ${currencyFormatter.format(totalOverdue)}.`);
    actions.push('Priorizar seguimiento de cobranzas vencidas antes de nuevas ventas.');
  }
  if (projectRisks.length) {
    projectRisks.forEach((project, index) => {
      if (index > 1) return; // Máximo 2 alertas de proyecto
      if (project.delayedTasks && project.delayedTasks.length > 0) {
        const primaryDelayed = project.delayedTasks[0];
        const daysOverdue = Math.ceil((new Date(today) - new Date(primaryDelayed.fecha_fin.slice(0, 10))) / (1000 * 60 * 60 * 24));
        highlights.push(
          `Riesgo en "${project.nombre}": la tarea "${primaryDelayed.titulo}" de ${primaryDelayed.empleado_nombre || 'sin asignar'} está retrasada ${daysOverdue} día${daysOverdue > 1 ? 's' : ''}.`
        );
        actions.push(
          `IA: Asistir a ${primaryDelayed.empleado_nombre || 'el responsable'} para desbloquear "${primaryDelayed.titulo}" en el proyecto "${project.nombre}".`
        );
      } else {
        highlights.push(`El proyecto "${project.nombre}" muestra riesgo: ${project.progreso}% de avance y ${project.tareasPendientes} tarea${project.tareasPendientes === 1 ? '' : 's'} pendiente${project.tareasPendientes === 1 ? '' : 's'}.`);
        actions.push(`Revisar alcance y carga del proyecto "${project.nombre}".`);
      }
    });
  }
  if (topOpportunities[0]) {
    highlights.push(`La cotizacion con mejor probabilidad es "${topOpportunities[0].titulo}" con ${topOpportunities[0].probabilidad}% de aceptacion.`);
    actions.push('Contactar primero las cotizaciones pendientes con probabilidad alta.');
  }
  if (purchaseDueSoon.length) {
    const totalPurchasesDue = purchaseDueSoon.reduce((sum, item) => sum + numberValue(item.total), 0);
    highlights.push(`${purchaseDueSoon.length} factura${purchaseDueSoon.length === 1 ? '' : 's'} de compra vencen en los proximos 7 dias por ${currencyFormatter.format(totalPurchasesDue)}.`);
    actions.push('Revisar vencimientos de ordenes de compra antes del cierre contable.');
  }
  if (!highlights.length) {
    highlights.push('No encontré urgencias críticas para hoy. El negocio luce estable con los datos disponibles.');
    actions.push('Actualizar avances de proyectos y próximas fechas de cobro para mejorar el análisis.');
  }

  return {
    fecha: today,
    summary: `Hola, este es tu resumen ejecutivo de hoy: ${highlights.join(' ')}`,
    highlights,
    actions,
    dueToday,
    overdue,
    projectRisks,
    topOpportunities,
    purchaseDueSoon,
    quotesMeta: {
      total: quotes.length,
      activeCount: quotes.filter(item => !['aprobada', 'aceptada', 'rechazada', 'vencida'].includes((item.estado || '').toLowerCase())).length,
      wonCount: quotes.filter(item => ['aprobada', 'aceptada'].includes((item.estado || '').toLowerCase())).length
    }
  };
};
