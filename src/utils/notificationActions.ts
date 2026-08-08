import type { CustomerNotification } from '@/services/notifications.api';
import { openSupportWhatsApp } from '@/services/notifications.api';

type ActionNotification = Pick<
  CustomerNotification,
  'type' | 'actionType' | 'actionValue' | 'surveyBookingId'
>;

export const performNotificationAction = async (notification: ActionNotification, navigation: any) => {
  const actionType = notification.actionType;

  if (actionType === 'open_project_progress') {
    const bookingId = notification.actionValue || notification.surveyBookingId;
    if (bookingId) navigation.navigate('MySolarJourney', { bookingId });
    return;
  }

  if (actionType === 'open_notifications') {
    navigation.navigate('Notifications');
    return;
  }

  if (actionType === 'open_maintenance_progress' && notification.actionValue) {
    navigation.navigate('PremiumCareProgress', { planId: notification.actionValue });
    return;
  }

  if (actionType === 'open_maintenance_feedback' && notification.actionValue) {
    navigation.navigate('PremiumCareProgress', { visitId: notification.actionValue });
    return;
  }

  if (actionType === 'open_screen' && notification.actionValue) {
    navigation.navigate(notification.actionValue);
    return;
  }

  if (actionType === 'whatsapp' || actionType === 'open_whatsapp') {
    await openSupportWhatsApp(notification.actionValue ?? undefined);
    return;
  }

  if (notification.type === 'survey_cancelled') {
    navigation.navigate('BookSurvey');
    return;
  }

  if (notification.surveyBookingId) {
    navigation.navigate('MySolarJourney', { bookingId: notification.surveyBookingId });
  }
};
