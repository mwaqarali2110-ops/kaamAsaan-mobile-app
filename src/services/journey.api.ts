import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SurveyBookingStatus =
  | 'survey_requested'
  | 'survey_booked'
  | 'survey_pending'
  | 'survey_confirmed'
  | 'site_visit_scheduled'
  | 'site_survey_scheduled'
  | 'assigned'
  | 'scheduled'
  | 'survey_in_progress'
  | 'pending'
  | 'confirmed'
  | 'survey_scheduled'
  | 'survey_completed'
  | 'design_in_progress'
  | 'proposal_preparation'
  | 'quotation_pending'
  | 'quotation_ready'
  | 'quotation_shared'
  | 'installation_scheduled'
  | 'installation_pending'
  | 'installation_planning'
  | 'installation_started'
  | 'installation_in_progress'
  | 'installation_completed'
  | 'project_in_progress'
  | 'project_completed'
  | 'installed'
  | 'system_active'
  | 'cancelled'
  | 'completed';

export const activeSurveyBookingStatuses: SurveyBookingStatus[] = [
  'pending',
  'confirmed',
  'assigned',
  'scheduled',
  'survey_in_progress',
  'survey_completed',
  'design_in_progress',
  'quotation_ready',
  'installation_scheduled',
  'installation_in_progress',
];

export const completedSurveyBookingStatuses: SurveyBookingStatus[] = [
  'installed',
  'completed',
  'system_active',
  'installation_completed',
  'project_completed'
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
  cancellation_reason?: string | null;
  cancellation_note?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type CancelSurveyBookingResult =
  | {
      success: true;
      booking: SurveyJourneyBooking;
    }
  | {
      success: false;
      booking: null;
      message: string;
      code?: string;
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
    if (isActiveLocalBooking(booking, userId)) return booking;
    await AsyncStorage.removeItem(localActiveSurveyKey(userId));
    return null;
  } catch {
    await AsyncStorage.removeItem(localActiveSurveyKey(userId));
    return null;
  }
};

export const saveLocalActiveSurveyBooking = async (booking: SurveyJourneyBooking) => {
  if (!isActiveLocalBooking(booking)) return;
  await AsyncStorage.setItem(localActiveSurveyKey(booking.user_id), JSON.stringify(booking));
};

export const removeLocalActiveSurveyBooking = async (userId: string) => {
  await AsyncStorage.removeItem(localActiveSurveyKey(userId));
};

export const verifyCancellationSchema = async () => {
  const { error } = await supabase
    .from('survey_bookings')
    .select('id,cancellation_reason,cancellation_note,cancelled_at,cancelled_by')
    .limit(1);

  if (__DEV__) {
    console.log('Cancellation schema verification:', {
      success: !error,
      code: error?.code,
      message: error?.message,
    });
  }
};

export const journeyApi = {
  getLatestSurveyBooking: async (userId: string) => {
    const { data, error } = await supabase
      .from('survey_bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      const localBooking = await getLocalActiveSurveyBooking(userId);
      if (localBooking) return localBooking;
      throw error;
    }

    return data ? (data as SurveyJourneyBooking) : getLocalActiveSurveyBooking(userId);
  },

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
  },

  cancelSurveyBooking: async ({
    bookingId,
    userId,
    cancellationReason,
    cancellationNote
  }: {
    bookingId: string;
    userId: string;
    cancellationReason: string;
    cancellationNote?: string | null;
  }): Promise<CancelSurveyBookingResult> => {
    if (!bookingId) {
      return {
        success: false,
        booking: null,
        message: 'Survey booking information is unavailable. Please refresh and try again.'
      };
    }

    if (!userId) {
      return {
        success: false,
        booking: null,
        message: 'Your session has expired. Please sign in again.'
      };
    }

    const reason = cancellationReason.trim();
    const note = cancellationNote?.trim() || null;

    if (!reason) {
      return {
        success: false,
        booking: null,
        message: 'Please select a cancellation reason.'
      };
    }

    const cancellationPayload = {
      status: 'cancelled',
      cancellation_reason: reason,
      cancellation_note: reason === 'Other' ? note : null,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'customer',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('survey_bookings')
      .update(cancellationPayload)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      if (__DEV__) {
        console.log('Supabase cancellation response', {
          success: false,
          code: error.code,
          message: error.message,
        });
      }
      return {
        success: false,
        booking: null,
        message: error.message,
        code: error.code,
      };
    }

    if (!data) {
      if (__DEV__) {
        console.log('Supabase cancellation returned zero rows', {
          bookingId,
          userId,
        });
      }
      return {
        success: false,
        booking: null,
        message: 'No survey booking was updated. Check the booking ID, ownership column, or RLS policy.',
      };
    }

    const booking = data as SurveyJourneyBooking;
    await removeLocalActiveSurveyBooking(booking.user_id);
    return {
      success: true,
      booking,
    };
  }
};
