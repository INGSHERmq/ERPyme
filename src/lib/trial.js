export const TRIAL_DURATION_DAYS = 14;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const isTrialCompany = (company) => company?.plan === 'demo_trial' || Boolean(company?.trial_ends_at);

export const getTrialEndsAt = (company) => {
  if (!company?.trial_ends_at) return null;
  const endDate = new Date(company.trial_ends_at);
  return Number.isNaN(endDate.getTime()) ? null : endDate;
};

export const getTrialStatus = (company, now = new Date()) => {
  const endsAt = getTrialEndsAt(company);

  if (!isTrialCompany(company) || !endsAt) {
    return {
      isTrial: false,
      isExpired: false,
      daysLeft: null,
      endsAt: null
    };
  }

  const msLeft = endsAt.getTime() - now.getTime();
  const isExpired = msLeft <= 0 || company?.estado === 'Suspendida';

  return {
    isTrial: true,
    isExpired,
    daysLeft: Math.max(0, Math.ceil(msLeft / MS_PER_DAY)),
    endsAt
  };
};

export const formatTrialDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};
