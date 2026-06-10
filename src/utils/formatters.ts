export const formatPkr = (value?: number | null) => {
  if (!value || value <= 0) return 'Price on request';
  return `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;
};

export const formatKw = (value: number) => `${Number(value || 0).toFixed(1).replace('.0', '')} kW`;
