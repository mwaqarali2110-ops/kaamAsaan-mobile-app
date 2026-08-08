import type { Appliance } from '@/types/system.types';

const PANEL_AREA_SQ_FT = 7.83 * 3.67;
export type PanelOrientation = 'landscape' | 'portrait';

export const DEFAULT_PANEL_LONG_FT = 7.5;
export const DEFAULT_PANEL_SHORT_FT = 3.75;
export const DEFAULT_PANEL_GAP_INCHES = 1;
export const DEFAULT_BACKUP_HOURS = 1;
export const DEFAULT_BATTERY_SAFETY_MARGIN_PERCENT = 15;

export type BackupApplianceBreakdown = {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  hours: number;
  energyKwh: number;
};

export type BackupRequirementSummary = {
  selectedAppliances: Appliance[];
  selectedAppliancesCount: number;
  runningLoadWatts: number;
  runningLoadKw: number;
  baseRequiredEnergyKwh: number;
  safetyMarginPercent: number;
  safetyMarginEnergyKwh: number;
  totalRequiredEnergyKwh: number;
  applianceBreakdown: BackupApplianceBreakdown[];
};

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

export type PanelLayoutInput = {
  panelCount: number;
  panelWidthFt?: number;
  panelHeightFt?: number;
  orientation: PanelOrientation;
  gapInches?: number;
  availableRoofWidthFt?: number;
  availableRoofHeightFt?: number;
};

export type PanelLayoutResult = {
  columns: number;
  rows: number;
  width: number;
  height: number;
  area: number;
  panelWidth: number;
  panelHeight: number;
  gapFt: number;
  fitsAvailableRoof: boolean;
};

export const calculatePanelLayout = ({
  panelCount,
  panelWidthFt = DEFAULT_PANEL_LONG_FT,
  panelHeightFt = DEFAULT_PANEL_SHORT_FT,
  orientation,
  gapInches = DEFAULT_PANEL_GAP_INCHES,
  availableRoofWidthFt,
  availableRoofHeightFt
}: PanelLayoutInput): PanelLayoutResult => {
  const normalizedPanelCount = Math.max(1, Math.ceil(panelCount || 1));
  const longSideFt = Math.max(panelWidthFt, panelHeightFt);
  const shortSideFt = Math.min(panelWidthFt, panelHeightFt);
  const effectivePanelWidthFt = orientation === 'landscape' ? longSideFt : shortSideFt;
  const effectivePanelHeightFt = orientation === 'landscape' ? shortSideFt : longSideFt;
  const gapFt = Math.max(0, gapInches) / 12;

  const getFootprint = (columns: number) => {
    const rows = Math.max(1, Math.ceil(normalizedPanelCount / columns));
    const width = columns * effectivePanelWidthFt + Math.max(0, columns - 1) * gapFt;
    const height = rows * effectivePanelHeightFt + Math.max(0, rows - 1) * gapFt;
    const fitsAvailableRoof = (
      !availableRoofWidthFt ||
      !availableRoofHeightFt ||
      (width <= availableRoofWidthFt && height <= availableRoofHeightFt)
    );

    return {
      columns,
      rows,
      width,
      height,
      area: Math.ceil(width * height),
      panelWidth: effectivePanelWidthFt,
      panelHeight: effectivePanelHeightFt,
      gapFt,
      fitsAvailableRoof
    };
  };

  const balancedColumns = Math.max(
    1,
    Math.ceil(Math.sqrt((normalizedPanelCount * effectivePanelHeightFt) / effectivePanelWidthFt))
  );
  if (!availableRoofWidthFt || !availableRoofHeightFt) {
    return getFootprint(balancedColumns);
  }

  const candidates = Array.from({ length: normalizedPanelCount }, (_, index) => getFootprint(index + 1));
  const fittingCandidates = candidates.filter((candidate) => candidate.fitsAvailableRoof);
  const preferredCandidates = fittingCandidates.length ? fittingCandidates : candidates;

  return preferredCandidates.reduce((best, candidate) => {
    if (candidate.area !== best.area) return candidate.area < best.area ? candidate : best;
    return Math.abs(candidate.columns - balancedColumns) < Math.abs(best.columns - balancedColumns) ? candidate : best;
  }, preferredCandidates[0]);
};

export const formatPanelDimensionFt = (value: number) => Number(value || 0).toFixed(1);

export const calculatePanelLayoutScale = ({
  layout,
  columns,
  rows,
  availableWidth,
  availableHeight,
  columnGapPx,
  rowGapPx
}: {
  layout: PanelLayoutResult;
  columns: number;
  rows: number;
  availableWidth: number;
  availableHeight: number;
  columnGapPx: number;
  rowGapPx: number;
}) => {
  const availablePanelWidth = Math.max(columns, availableWidth - Math.max(0, columns - 1) * columnGapPx);
  const availablePanelHeight = Math.max(rows, availableHeight - Math.max(0, rows - 1) * rowGapPx);
  return Math.max(
    0.1,
    Math.min(
      availablePanelWidth / (columns * layout.panelWidth),
      availablePanelHeight / (rows * layout.panelHeight)
    )
  );
};

export const calculateBackupRequirementSummary = (
  appliances: Appliance[],
  safetyMarginPercent = DEFAULT_BATTERY_SAFETY_MARGIN_PERCENT
): BackupRequirementSummary => {
  const selectedAppliances = appliances.filter((item) => Number(item.quantity) > 0);
  const runningLoadWatts = selectedAppliances.reduce(
    (sum, item) => sum + item.watts * Number(item.quantity),
    0
  );
  const applianceBreakdown = selectedAppliances.map((item) => {
    const quantity = Number(item.quantity) || 0;
    const hours = Number(item.hours ?? DEFAULT_BACKUP_HOURS) || DEFAULT_BACKUP_HOURS;
    return {
      id: item.id,
      name: item.name,
      watts: item.watts,
      quantity,
      hours,
      energyKwh: (item.watts * quantity * hours) / 1000
    };
  });
  const baseRequiredEnergyKwh = applianceBreakdown.reduce(
    (sum, item) => sum + item.energyKwh,
    0
  );
  const safetyMarginEnergyKwh = (baseRequiredEnergyKwh * safetyMarginPercent) / 100;

  return {
    selectedAppliances,
    selectedAppliancesCount: selectedAppliances.length,
    runningLoadWatts,
    runningLoadKw: runningLoadWatts / 1000,
    baseRequiredEnergyKwh,
    safetyMarginPercent,
    safetyMarginEnergyKwh,
    totalRequiredEnergyKwh: baseRequiredEnergyKwh + safetyMarginEnergyKwh,
    applianceBreakdown
  };
};

export const calculateBackupKwh = (appliances: Appliance[]) =>
  Math.ceil(calculateBackupRequirementSummary(appliances).totalRequiredEnergyKwh);
