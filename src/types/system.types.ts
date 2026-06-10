import type { Product } from './product.types';

export type Appliance = {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  hours: number;
};

export type SystemSummary = {
  solarKw: number;
  panelWattage: number;
  selectedPanelBrand?: string | null;
  panelCount: number;
  roofAreaSqFt: number;
  inverter?: Product | null;
  battery?: Product | null;
  panels?: Product | null;
  accessories: Product[];
  packageName?: string;
};

export type BackupDecision = 'yes' | 'no' | null;
