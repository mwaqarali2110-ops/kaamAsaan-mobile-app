import { Alert, Linking, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SUPPORT_WHATSAPP_NUMBER } from '@/constants/support';
import type { SurveyJourneyBooking } from './journey.api';
import type { MaintenanceBooking } from '@/types/maintenance.types';
import { resolveNotificationPriority, type NotificationPriority } from '@/utils/notificationPriority';

export const WELCOME_NOTIFICATION_TITLE = 'Welcome to KaamAsaan!';
export const WELCOME_NOTIFICATION_MESSAGE = 'Thank you for choosing KaamAsaan for the installation of your solar system. We look forward to providing you with one of the best service experiences. In case of any query, please contact our representative.';
export const WELCOME_NOTIFICATION_CTA = 'Contact Our Representative';
export const WELCOME_WHATSAPP_MESSAGE = 'Assalam-o-Alaikum, I have booked a solar site survey through the KaamAsaan app. I would like to speak with a representative regarding my booking.';
export const CANCELLATION_NOTIFICATION_TITLE = 'Survey Booking Cancelled';
export const CANCELLATION_NOTIFICATION_MESSAGE = 'Your solar site survey booking has been cancelled successfully. You can book a new survey whenever you are ready.';
export const MAINTENANCE_CANCELLATION_NOTIFICATION_TITLE = 'Maintenance request cancelled';

export type CustomerNotification = {
  id: string;
  userId: string;
  surveyBookingId: string | null;
  notificationKey: string;
  dedupeKey: string;
  type: 'survey_welcome' | string;
  priority: NotificationPriority;
  hasExplicitPriority: boolean;
  title: string;
  message: string;
  actionType: 'whatsapp' | string | null;
  actionValue: string | null;
  isRead: boolean;
  seenAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
  surveyBookingCreatedAt: string | null;
  surveyPreferredDate: string | null;
  surveyPreferredTimeSlot: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  survey_booking_id: string | null;
  notification_key: string;
  dedupe_key?: string | null;
  type: string;
  priority?: string | null;
  title: string;
  message: string;
  action_type: string | null;
  action_value: string | null;
  is_read: boolean;
  seen_at?: string | null;
  read_at?: string | null;
  dismissed_at?: string | null;
  created_at: string;
  survey_booking?: {
    created_at?: string | null;
    preferred_date?: string | null;
    preferred_time_slot?: string | null;
  } | null;
};

const mapNotification = (row: NotificationRow): CustomerNotification => ({
  id: row.id,
  userId: row.user_id,
  surveyBookingId: row.survey_booking_id,
  notificationKey: row.notification_key,
  dedupeKey: row.dedupe_key ?? row.notification_key ?? row.id,
  type: row.type,
  priority: resolveNotificationPriority({ priority: row.priority, type: row.type }),
  hasExplicitPriority: ['urgent', 'normal', 'promotional'].includes(String(row.priority ?? '').trim().toLowerCase()),
  title: row.title,
  message: row.message,
  actionType: row.action_type,
  actionValue: row.action_value,
  isRead: row.is_read,
  seenAt: row.seen_at ?? null,
  readAt: row.read_at ?? null,
  dismissedAt: row.dismissed_at ?? null,
  createdAt: row.created_at,
  surveyBookingCreatedAt: row.survey_booking?.created_at ?? null,
  surveyPreferredDate: row.survey_booking?.preferred_date ?? null,
  surveyPreferredTimeSlot: row.survey_booking?.preferred_time_slot ?? null,
});

const dedupeNotifications = (notifications: CustomerNotification[]) => {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  return notifications.filter((notification) => {
    if (seenIds.has(notification.id) || seenKeys.has(notification.dedupeKey)) return false;
    seenIds.add(notification.id);
    seenKeys.add(notification.dedupeKey);
    return true;
  });
};

export const surveyWelcomeNotificationKey = (userId: string, bookingId: string) =>
  `survey_welcome_${userId}_${bookingId}`;

export const surveyCancellationNotificationKey = (userId: string, bookingId: string) =>
  `survey_cancelled_${userId}_${bookingId}`;

export const maintenanceCancellationNotificationKey = (userId: string, requestId: string) =>
  `maintenance_cancelled_${userId}_${requestId}`;

const whatsappUrl = (baseUrl: string, message: string) =>
  `${baseUrl}${encodeURIComponent(message)}`;

export const openSupportWhatsApp = async (message = WELCOME_WHATSAPP_MESSAGE) => {
  const encodedMessage = encodeURIComponent(message);
  const directUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodedMessage}`;
  const fallbackUrl = Platform.OS === 'web'
    ? `https://web.whatsapp.com/send?phone=${SUPPORT_WHATSAPP_NUMBER}&text=${encodedMessage}`
    : whatsappUrl(`https://api.whatsapp.com/send?phone=${SUPPORT_WHATSAPP_NUMBER}&text=`, message);

  try {
    await Linking.openURL(directUrl);
    return true;
  } catch {
    try {
      await Linking.openURL(fallbackUrl);
      return true;
    } catch {
      Alert.alert('Unable to open WhatsApp', 'Unable to open WhatsApp. Please contact our support representative directly.');
      return false;
    }
  }
};

export const notificationsApi = {
  createMaintenanceCancellationNotificationOnce: async (booking: MaintenanceBooking) => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!authData.user) return null;
    const notificationKey = maintenanceCancellationNotificationKey(authData.user.id, booking.id);
    const { data, error } = await supabase
      .from('notifications')
      .upsert({
        user_id: authData.user.id,
        survey_booking_id: null,
        notification_key: notificationKey,
        type: 'maintenance_cancelled',
        title: MAINTENANCE_CANCELLATION_NOTIFICATION_TITLE,
        message: `Your ${booking.plan.title} request ${booking.referenceNumber} has been cancelled.`,
        action_type: null,
        action_value: null,
        is_read: false,
      }, {
        onConflict: 'notification_key',
        ignoreDuplicates: true,
      })
      .select('id')
      .maybeSingle();
    if (error) throw error;
    return data?.id ?? null;
  },

  createSurveyWelcomeNotificationOnce: async (booking: SurveyJourneyBooking) => {
    const notificationKey = surveyWelcomeNotificationKey(booking.user_id, booking.id);
    const { data, error } = await supabase
      .from('notifications')
      .upsert({
        user_id: booking.user_id,
        survey_booking_id: booking.id,
        notification_key: notificationKey,
        type: 'survey_welcome',
        title: WELCOME_NOTIFICATION_TITLE,
        message: WELCOME_NOTIFICATION_MESSAGE,
        action_type: 'open_project_progress',
        action_value: booking.id,
        is_read: false,
      }, {
        onConflict: 'notification_key',
        ignoreDuplicates: true,
      })
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
  },

  createSurveyCancellationNotificationOnce: async (booking: SurveyJourneyBooking) => {
    const notificationKey = surveyCancellationNotificationKey(booking.user_id, booking.id);
    const { data, error } = await supabase
      .from('notifications')
      .upsert({
        user_id: booking.user_id,
        survey_booking_id: booking.id,
        notification_key: notificationKey,
        type: 'survey_cancelled',
        title: CANCELLATION_NOTIFICATION_TITLE,
        message: CANCELLATION_NOTIFICATION_MESSAGE,
        action_type: null,
        action_value: null,
        is_read: false,
      }, {
        onConflict: 'notification_key',
        ignoreDuplicates: true,
      })
      .select('id')
      .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
  },

  getNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, survey_booking:survey_bookings(created_at, preferred_date, preferred_time_slot)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return dedupeNotifications(((data ?? []) as unknown as NotificationRow[]).map(mapNotification));
  },

  getUnreadCount: async (userId: string) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  },

  getLatestUnreadSurveyWelcome: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, survey_booking:survey_bookings(created_at, preferred_date, preferred_time_slot)')
      .eq('user_id', userId)
      .eq('type', 'survey_welcome')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? mapNotification(data as unknown as NotificationRow) : null;
  },

  markAsRead: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },
};
