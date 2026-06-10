import type { SystemSummary } from '@/types/system.types';
import { api } from './api';
import { supabase } from '@/lib/supabase';

export type SurveyBookingPayload = {
  userId: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string | null;
  systemDesignId?: string | null;
};

export const systemApi = {
  submitSystemSummary: (summary: SystemSummary) => api.post({ ok: true, reference: `KA-${Date.now()}` }, summary),
  submitSurveyBooking: async (payload: SurveyBookingPayload) => {
    const { data, error } = await supabase
      .from('survey_bookings')
      .insert({
        user_id: payload.userId,
        full_name: payload.fullName,
        phone: payload.phone,
        city: payload.city,
        address: payload.address,
        booking_type: 'solar_survey',
        preferred_date: payload.preferredDate,
        preferred_time_slot: payload.preferredTimeSlot,
        status: 'pending',
        notes: payload.notes ?? null,
        system_design_id: payload.systemDesignId ?? null
      })
      .select('id')
      .single();
    if (error) throw error;
    return { ok: true, bookingId: data.id };
  }
};
