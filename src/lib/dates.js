export const APP_TIME_ZONE = 'America/Lima';
const LIMA_UTC_OFFSET = '-05:00';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export const getTodayInAppTimeZone = () => dateFormatter.format(new Date());

export const formatDateOnlyInAppTimeZone = (value) => {
  const date = parseDateInAppTimeZone(value);
  return date ? date.toLocaleDateString('es-PE', { timeZone: APP_TIME_ZONE }) : '-';
};

export const datePickerDateToInputDate = (value) => {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toAppDateKey = (value) => {
  if (!value) return null;
  const date = parseDateInAppTimeZone(value);
  if (!date) {
    return String(value).slice(0, 10);
  }
  return dateFormatter.format(date);
};

export const getStartOfTodayInAppTimeZone = () => {
  const today = getTodayInAppTimeZone();
  return new Date(`${today}T00:00:00${LIMA_UTC_OFFSET}`);
};

export const parseDateInAppTimeZone = (value, endOfDay = false) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T${endOfDay ? '23:59:59' : '00:00:00'}${LIMA_UTC_OFFSET}`);
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const datetimeLocalToAppIso = (value) => {
  if (!value) return null;
  const normalized = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${normalized}${LIMA_UTC_OFFSET}`);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

export const isoToDateTimeLocalInAppTimeZone = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}T${byType.hour}:${byType.minute}`;
};

export const formatDateTimeInAppTimeZone = (value) => {
  if (!value) return '-';
  const date = parseDateInAppTimeZone(value);
  if (!date) return value;

  return date.toLocaleString('es-PE', {
    timeZone: APP_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
