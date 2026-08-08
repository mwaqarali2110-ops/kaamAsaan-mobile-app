import { z } from 'zod';

const positiveDecimal = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).refine(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0,
    `${label} must be greater than 0.`
  );

export const installationDetailsSchema = z.object({
  panelWattage: positiveDecimal('Panel wattage'),
  numberOfPanels: z.string().trim().min(1, 'Number of panels is required.').regex(/^[1-9]\d*$/, 'Enter a positive whole number.'),
  inverterSize: positiveDecimal('Inverter size'),
  inverterBrand: z.string().trim().min(1, 'Inverter brand is required.'),
  batterySize: positiveDecimal('Battery size'),
  batteryBrand: z.string().trim().min(1, 'Battery brand is required.'),
  structureType: z.enum(['standard', 'elevated', 'ground_mounted', 'shed']).nullable().refine(
    (value) => value !== null,
    'Select a structure type.'
  )
});

export type InstallationDetailsForm = z.infer<typeof installationDetailsSchema>;
