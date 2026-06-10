import type { Appliance } from '@/types/system.types';

const PANEL_AREA_SQ_FT = 7.83 * 3.67;

export const calculateLoadKw = (appliances: Appliance[]) =>
  appliances.reduce((sum, item) => sum + item.watts * item.quantity, 0) / 1000;

export const calculateEnergyKwh = (appliances: Appliance[]) =>
  appliances.reduce((sum, item) => sum + (item.watts * item.quantity * item.hours) / 1000, 0);

export const recommendSolarKw = (appliances: Appliance[]) => {
  const loadKw = calculateLoadKw(appliances);
  return Math.max(3, Math.ceil(loadKw * 1.5));
};

export const calculatePanelCount = (solarKw: number, panelWattage: number) =>
  Math.max(1, Math.ceil((solarKw * 1000) / panelWattage));

export const calculateRoofSpace = (panelCount: number) => ({
  areaSqFt: Math.round(panelCount * PANEL_AREA_SQ_FT),
  panelAreaSqFt: PANEL_AREA_SQ_FT
});

export const calculateBackupKwh = (appliances: Appliance[]) =>
  Math.ceil(calculateEnergyKwh(appliances) * 1.25);
