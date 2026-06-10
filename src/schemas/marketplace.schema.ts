import { z } from 'zod';

export const productConfigurationSchema = z.object({
  productId: z.string().min(1),
  mode: z.enum(['add-to-system', 'order-product']),
  quantity: z.number().min(1).default(1)
});

export const customerContactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  message: z.string().min(5)
});
