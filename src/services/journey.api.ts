import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const LOCAL_ACTIVE_SURVEY_PREFIX = 'kaamasaan.active-survey-booking.';
const LOCAL_BOOKING_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const localActiveSurveyKey = (userId: string) => `${LOCAL_ACTIVE_SURVEY_PREFIX}${userId}`;

const isActiveLocalBooking = (booking: SurveyJourneyBooking | null | undefined, userId?: string) => {
  if (!booking || (userId && booking.user_id !== userId)) return false;
  if (!activeSurveyBookingStatuses.includes(booking.status)) return false;

  const updatedAt = new Date(booking.updated_at || booking.created_at).getTime();
  return Number.isFinite(updatedAt) && Date.now() - updatedAt < LOCAL_BOOKING_MAX_AGE_MS;
};

const getLocalActiveSurveyBooking = async (userId: string) => {
  const cached = await AsyncStorage.getItem(localActiveSurveyKey(userId));
  if (!cached) return null;

  try {
    const booking = JSON.parse(cached) as SurveyJourneyBooking;
    return isActiveLocalBooking(booking, userId) ? booking : null;
  } catch {
    await AsyncStorage.removeItem(localActiveSurveyKey(userId));
    return null;
  }
};

export const saveLocalActiveSurveyBooking = async (booking: SurveyJourneyBooking) => {
  if (!isActiveLocalBooking(booking)) return;
  await AsyncStorage.setItem(localActiveSurveyKey(booking.user_id), JSON.stringify(booking));
};

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

    if (error) {
      const localBooking = await getLocalActiveSurveyBooking(userId);
      if (localBooking) return localBooking;
      throw error;
    }

    if (data) {
      const booking = data as SurveyJourneyBooking;
      await saveLocalActiveSurveyBooking(booking);
      return booking;
    }

    return getLocalActiveSurveyBooking(userId);
  },

  getSurveyBooking: async (bookingId: string) => {
    const { data, error } = await supabase
      .from('survey_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) {
      const keys = await AsyncStorage.getAllKeys();
      const localKeys = keys.filter((key) => key.startsWith(LOCAL_ACTIVE_SURVEY_PREFIX));
      if (localKeys.length) {
        const entries = await AsyncStorage.multiGet(localKeys);
        for (const [, value] of entries) {
          if (!value) continue;
          try {
            const booking = JSON.parse(value) as SurveyJourneyBooking;
            if (booking.id === bookingId && isActiveLocalBooking(booking)) return booking;
          } catch {
            // Ignore malformed local fallback records.
          }
        }
      }
      throw error;
    }
    return data as SurveyJourneyBooking;
  }
};
