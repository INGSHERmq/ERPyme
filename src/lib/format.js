export const formatCurrency = (value, decimals = 0) => {
  const num = Number(value || 0);
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
