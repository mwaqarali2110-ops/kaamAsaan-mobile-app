import type { Product } from '../types/product.types';
import { normalizeBatteryCapacity } from './batteryCapacity';
import {
  buildBatteryConfigurations,
  getBatteryProductDisplayName,
  getBatteryRecommendationOptions,
} from './batteryRecommendation';

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

const battery = (
  id: string,
  brand: string,
  capacityKwh: number,
  values: Partial<Product> = {},
): Product => ({
  id,
  category: 'battery',
  rawCategory: 'battery',
  brand,
  brandName: brand,
  name: `${brand} ${capacityKwh}kWh Battery`,
  batteryCapacityKwh: capacityKwh,
  price: 100_000,
  specs: [],
  ...values,
});

export function runBatteryRecommendationTests() {
  const wh = normalizeBatteryCapacity({ capacity_value: 5000, capacity_unit: 'Wh' });
  assert(wh.capacityKwh === 5 && wh.sourceUnit === 'Wh', '5000 Wh did not normalize to 5 kWh.');

  const kwh = normalizeBatteryCapacity({ capacity_kwh: 5 });
  assert(kwh.capacityKwh === 5 && kwh.sourceUnit === 'kWh', '5 kWh did not remain 5 kWh.');

  const invalid = normalizeBatteryCapacity({ capacity_kwh: 5000 });
  assert(invalid.capacityKwh == null && invalid.status === 'implausible', 'Implausible 5000 kWh record was not rejected.');

  const configurations = buildBatteryConfigurations([
    battery('five', 'KSTAR', 5, { image: 'kstar.png' }),
    battery('sixteen', 'Livoltek', 16, { image: 'livoltek.png' }),
  ]);
  const insufficient = getBatteryRecommendationOptions(17.8, configurations);
  assert(insufficient.recommended == null, 'An undersized battery was recommended for 17.8 kWh.');
  assert(insufficient.options.every((option) => !option.coversRequirement), 'A 5 or 16 kWh battery was marked as full coverage for 17.8 kWh.');

  const covered = getBatteryRecommendationOptions(15, configurations);
  assert(covered.recommended?.capacityKwh === 16, '16 kWh was not selected for a 15 kWh nominal requirement.');
  assert(covered.recommended?.primaryProduct.image === 'livoltek.png', 'Selected product image did not change with the selected product.');

  const cleanName = getBatteryProductDisplayName(battery('kstar', 'KSTAR', 5));
  assert(cleanName === 'KSTAR 5 kWh Battery', `Unexpected clean battery name: ${cleanName}`);

  return 7;
}

runBatteryRecommendationTests();
console.log('Battery recommendation: 7 scenarios passed.');
