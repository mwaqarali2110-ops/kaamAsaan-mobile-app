const asNumber = (value?: number | string | null) => {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
};

const normalize = (value?: string | null) => (value ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();

export const parseCapacityKw = (
  value?: number | string | null,
  unit?: string | null,
  productName?: string | null
) => {
  const numeric = asNumber(value);
  const normalizedUnit = normalize(unit);

  if (numeric != null) {
    if (normalizedUnit === 'w' || normalizedUnit === 'watt' || normalizedUnit === 'watts') return numeric / 1000;
    if (normalizedUnit === 'kw' || normalizedUnit === 'kilowatt' || normalizedUnit === 'kilowatts') return numeric;
  }

  const source = String(productName ?? value ?? '');
  const kwMatch = source.match(/(\d+(?:\.\d+)?)\s*k\s*w/i);
  if (kwMatch) return Number.parseFloat(kwMatch[1]);

  const wattMatch = source.match(/(\d+(?:\.\d+)?)\s*w(?:att|atts)?\b/i);
  if (wattMatch) return Number.parseFloat(wattMatch[1]) / 1000;

  return null;
};

export const parseCapacityWatt = (
  value?: number | string | null,
  unit?: string | null,
  productName?: string | null
) => {
  const numeric = asNumber(value);
  const normalizedUnit = normalize(unit);

  if (numeric != null) {
    if (normalizedUnit === 'w' || normalizedUnit === 'watt' || normalizedUnit === 'watts') return numeric;
    if (normalizedUnit === 'kw' || normalizedUnit === 'kilowatt' || normalizedUnit === 'kilowatts') return numeric * 1000;
  }

  const source = String(productName ?? value ?? '');
  const wattMatch = source.match(/(\d+(?:\.\d+)?)\s*w(?:att|atts)?\b/i);
  if (wattMatch) return Number.parseFloat(wattMatch[1]);

  const kwMatch = source.match(/(\d+(?:\.\d+)?)\s*k\s*w/i);
  if (kwMatch) return Number.parseFloat(kwMatch[1]) * 1000;

  return null;
};

export const parseCapacityKwh = (
  value?: number | string | null,
  unit?: string | null,
  productName?: string | null
) => {
  const numeric = asNumber(value);
  const normalizedUnit = normalize(unit);

  if (numeric != null && (normalizedUnit === 'kwh' || normalizedUnit === 'kw h')) return numeric;

  const source = String(productName ?? value ?? '');
  const match = source.match(/(\d+(?:\.\d+)?)\s*k\s*w\s*h/i);
  return match ? Number.parseFloat(match[1]) : null;
};

export const formatCapacityKw = (value: number) => `${Number(value || 0).toFixed(1).replace('.0', '')} kW`;
