import { z } from 'zod';

export const applianceSelectionSchema = z.object({
  appliances: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(0),
    hours: z.number().min(0).max(24)
  })).min(1)
});

export const batteryBackupSchema = z.object({
  decision: z.enum(['yes', 'no']),
  backupHours: z.number().min(1).max(24).optional()
});

export const systemConfigurationSchema = z.object({
  solarKw: z.number().min(1),
  panelWattage: z.number().min(300),
  panelCount: z.number().min(1)
});
