import type { SelectedPackageSnapshot } from '@/types/survey.types';
import type { RecommendedPackage } from '@/utils/packageBuilder';

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const productBrand = (product?: RecommendedPackage['panel'] | null) =>
  product?.brandName?.trim() || product?.brand?.trim() || 'Unknown brand';

const productModel = (product?: RecommendedPackage['panel'] | null) =>
  product?.model?.trim() || product?.name?.trim() || 'Model unavailable';

export const createSelectedPackageSnapshot = ({
  selectedPackage,
  grossTotal,
  discountAmount,
  finalTotal,
  promoCode
}: {
  selectedPackage: RecommendedPackage;
  grossTotal: number;
  discountAmount: number;
  finalTotal: number;
  promoCode?: string | null;
}): SelectedPackageSnapshot => {
  const panel = selectedPackage.panelProduct ?? selectedPackage.panel;
  const inverter = selectedPackage.inverterProduct ?? selectedPackage.inverter.product;
  const battery = selectedPackage.batteryProduct ?? selectedPackage.battery?.product ?? null;
  const panelQuantity = Math.max(0, Math.round(safeNumber(selectedPackage.panelQuantity)));
  const batteryQuantity = Math.max(0, Math.round(safeNumber(selectedPackage.batteryQuantity)));
  const panelWattage = safeNumber(
    panel.panelWattage ?? panel.capacityWatt ?? panel.capacity_watt ?? panel.wattage
  );
  const totalSolarKw = safeNumber(selectedPackage.totalSolarKw || selectedPackage.actualPanelKw);
  const totalBatteryKwh = safeNumber(
    selectedPackage.totalBatteryKwh || selectedPackage.totalBatteryCapacityKwh
  );

  return {
    packageId: selectedPackage.id || null,
    packageName: selectedPackage.packageName || selectedPackage.title || 'Selected Solar Package',
    packageBrand: selectedPackage.packageBrand || selectedPackage.brand || productBrand(inverter),
    isCustomized: Boolean(selectedPackage.isCustomized),
    systemSizeKw: totalSolarKw,
    panel: panelQuantity > 0 ? {
      productId: panel.id || null,
      brand: productBrand(panel),
      model: productModel(panel),
      wattage: panelWattage,
      quantity: panelQuantity,
      totalCapacityKw: totalSolarKw
    } : null,
    inverter: inverter ? {
      productId: inverter.id || null,
      brand: productBrand(inverter),
      model: productModel(inverter),
      capacityKw: safeNumber(selectedPackage.inverterSizeKw || inverter.capacityKw),
      quantity: Math.max(1, Math.round(safeNumber(selectedPackage.inverterQuantity) || 1))
    } : null,
    battery: battery && batteryQuantity > 0 ? {
      productId: battery.id || null,
      brand: productBrand(battery),
      model: productModel(battery),
      unitCapacityKwh: safeNumber(
        selectedPackage.batteryUnitCapacityKwh || selectedPackage.batterySizeKwh || battery.batteryCapacityKwh
      ),
      quantity: batteryQuantity,
      totalCapacityKwh: totalBatteryKwh
    } : null,
    grossTotal: safeNumber(grossTotal),
    discountAmount: safeNumber(discountAmount),
    finalTotal: safeNumber(finalTotal),
    promoCode: promoCode?.trim() || null
  };
};
