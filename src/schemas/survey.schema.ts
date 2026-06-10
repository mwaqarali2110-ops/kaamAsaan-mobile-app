import { z } from 'zod';

export const surveyBookingSchema = z.object({
  name: z.string().min(2, 'Enter your name'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  city: z.string().min(2, 'Enter your city'),
  address: z.string().min(5, 'Enter your address')
});

export type SurveyBookingForm = z.infer<typeof surveyBookingSchema>;
