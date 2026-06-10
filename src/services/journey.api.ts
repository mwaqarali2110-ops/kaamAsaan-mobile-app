import { supabase } from '@/lib/supabase';

export type SurveyBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'survey_scheduled'
  | 'survey_completed'
  | 'proposal_preparation'
  | 'quotation_shared'
  | 'installation_planning'
  | 'installation_completed'
  | 'cancelled'
  | 'completed';

export const activeSurveyBookingStatuses: SurveyBookingStatus[] = [
  'pending',
  'confirmed',
  'survey_scheduled',
  'survey_completed',
  'proposal_preparation',
  'quotation_shared',
  'installation_planning'
];

export type SurveyJourneyBooking = {
  id: string;
  reference_code?: string | null;
  user_id: string;
  full_name: string;
  phone: string;
  city: string;
  address: string;
  booking_type: string;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  status: SurveyBookingStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export const formatSurveyReference = (booking: Pick<SurveyJourneyBooking, 'id' | 'reference_code'>) =>
  booking.reference_code || `KA-${booking.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export const journeyApi = {
  getLatestActiveSurveyBooking: async (userId: string) => {
    const { data, error } = await supabase
      .from('survey_bookings')
      .select('*')
      .eq('user_id', userId)
      .in('status', activeSurveyBookingStatuses)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as SurveyJourneyBooking | null;
  },

  getSurveyBooking: async (bookingId: string) => {
    const { data, error } = await supabase
      .from('survey_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    return data as SurveyJourneyBooking;
  }
};
