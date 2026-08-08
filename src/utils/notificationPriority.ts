export type NotificationPriority = 'urgent' | 'normal' | 'promotional';

const URGENT_NOTIFICATION_TYPES = new Set([
  'survey_cancelled',
  'booking_cancelled',
  'maintenance_cancelled',
  'payment_issue',
  'survey_team_arriving_today',
  'immediate_action_required'
]);

const PROMOTIONAL_TYPE_MARKERS = ['promo', 'promotion', 'offer', 'discount', 'marketing'];

export const resolveNotificationPriority = ({
  priority
}: {
  priority?: string | null;
  type?: string | null;
}): NotificationPriority => {
  const normalizedPriority = String(priority ?? '').trim().toLowerCase();
  if (normalizedPriority === 'urgent' || normalizedPriority === 'normal' || normalizedPriority === 'promotional') {
    return normalizedPriority;
  }

  // The production notifications table has no priority column yet. Historical
  // rows must therefore remain normal rather than being promoted by old type data.
  return 'normal';
};

export const resolveLiveNotificationPriority = ({
  hasExplicitPriority,
  priority,
  type
}: {
  hasExplicitPriority?: boolean;
  priority?: string | null;
  type?: string | null;
}): NotificationPriority => {
  const explicitPriority = resolveNotificationPriority({ priority });
  const normalizedPriority = String(priority ?? '').trim().toLowerCase();
  const priorityIsValid = normalizedPriority === 'urgent' || normalizedPriority === 'normal' || normalizedPriority === 'promotional';
  if (hasExplicitPriority ?? priorityIsValid) return explicitPriority;

  const normalizedType = String(type ?? '').trim().toLowerCase();
  if (URGENT_NOTIFICATION_TYPES.has(normalizedType)) return 'urgent';
  if (PROMOTIONAL_TYPE_MARKERS.some((marker) => normalizedType.includes(marker))) return 'promotional';
  return 'normal';
};

export const selectLatestEligibleUrgentNotification = <T extends {
  id: string;
  type?: string | null;
  priority?: string | null;
  hasExplicitPriority?: boolean;
  isRead: boolean;
  dismissedAt?: string | null;
  createdAt: string;
}>(notifications: T[], excludedIds: Set<string>, allowTypeFallback = false): T | null => notifications
  .filter((notification) =>
    !notification.isRead &&
    !notification.dismissedAt &&
    !excludedIds.has(notification.id) &&
    (allowTypeFallback
      ? resolveLiveNotificationPriority(notification)
      : resolveNotificationPriority(notification)) === 'urgent'
  )
  .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0] ?? null;
