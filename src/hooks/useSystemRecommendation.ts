import { useMemo } from 'react';
import { useSystemStore } from '@/store/useSystemStore';
import { calculatePanelCount, calculateRoofSpace, recommendSolarKw } from '@/utils/calculations';

export const useSystemRecommendation = () => {
  const appliances = useSystemStore((state) => state.appliances);
  const panelWattage = useSystemStore((state) => state.panelWattage);

  return useMemo(() => {
    const solarKw = recommendSolarKw(appliances);
    const panelCount = calculatePanelCount(solarKw, panelWattage);
    return {
      solarKw,
      panelCount,
      panelWattage,
      roofAreaSqFt: calculateRoofSpace(panelCount).areaSqFt
    };
  }, [appliances, panelWattage]);
};
