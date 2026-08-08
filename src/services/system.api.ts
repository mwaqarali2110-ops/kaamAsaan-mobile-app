import type { SystemSummary } from '@/types/system.types';
import { api } from './api';
import { supabase } from '@/lib/supabase';
import type { SurveyJourneyBooking } from './journey.api';
import type { PromoContext } from '@/types/promo.types';
import { promoApi } from './promo.api';
import type { SelectedPackageSnapshot } from '@/types/survey.types';

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
  idempotencyKey?: string | null;
  customerEmail?: string | null;
  serviceType: string;
  selectedPackageSnapshot?: SelectedPackageSnapshot | null;
  solarPackagePricing?: {
    context: PromoContext;
    promoCode: string;
  } | null;
};

export const systemApi = {
  submitSystemSummary: (summary: SystemSummary) => api.post({ ok: true, reference: `KA-${Date.now()}` }, summary),
  submitSurveyBooking: async (payload: SurveyBookingPayload) => {
    if (payload.solarPackagePricing?.promoCode) {
      const { data, error } = await supabase.rpc('create_survey_booking_with_promo', {
        p_full_name: payload.fullName,
        p_phone: payload.phone,
        p_city: payload.city,
        p_address: payload.address,
        p_preferred_date: payload.preferredDate,
        p_preferred_time_slot: payload.preferredTimeSlot,
        p_notes: payload.notes ?? null,
        p_system_design_id: payload.systemDesignId ?? null,
        p_promo_code: payload.solarPackagePricing.promoCode,
        p_package_context: promoApi.packageContextForRpc(payload.solarPackagePricing.context),
        p_idempotency_key: payload.idempotencyKey ?? null,
        p_customer_email: payload.customerEmail ?? null,
        p_service_type: payload.serviceType,
        p_selected_package_snapshot: payload.selectedPackageSnapshot ?? null
      });
      if (error) {
        const message = error.message?.replace(/^.*?:\s*/, '') ||
          'The promo could not be confirmed. Please review it and try again.';
        throw new Error(message);
      }
      const response = data as { booking?: SurveyJourneyBooking } | null;
      if (!response?.booking?.id) throw new Error('Booking could not be completed. Please try again.');
      return {
        ok: true,
        bookingId: response.booking.id,
        booking: response.booking
      };
    }

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
        current_milestone: 'request_received',
        customer_email: payload.customerEmail ?? null,
        service_type: payload.serviceType,
        selected_package_snapshot: payload.selectedPackageSnapshot ?? null,
        notes: payload.notes ?? null,
        system_design_id: payload.systemDesignId ?? null
      })
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, bookingId: data.id, booking: data as SurveyJourneyBooking };
  }
};
