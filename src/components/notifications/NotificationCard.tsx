import React, { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarClock, ClipboardCheck, MessageCircle } from 'lucide-react-native';

type NotificationType =
  | 'survey_welcome'
  | 'survey_cancelled'
  | string;

export type NotificationItem = {
  id: string;
  notification_key?: string | null;
  survey_booking_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  action_type?: string | null;
  action_value?: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationCardProps = {
  notification: NotificationItem;
  cartImage: number;
  onActionPress: (notification: NotificationItem) => void;
};

function getNotificationAction(notification: NotificationItem) {
  if (notification.type === 'survey_cancelled') {
    return {
      label: 'Book a New Survey',
      icon: ClipboardCheck,
      variant: 'cancelled' as const,
    };
  }

  if (notification.action_type === 'open_project_progress') {
    return {
      label: 'View Project Progress',
      icon: ClipboardCheck,
      variant: 'project' as const,
    };
  }

  if (notification.type === 'survey_welcome' || notification.action_type === 'whatsapp') {
    return {
      label: 'Contact Our Representative',
      icon: MessageCircle,
      variant: 'whatsapp' as const,
    };
  }

  return null;
}

function getDateLabel(notification: NotificationItem) {
  const formattedDate = new Date(notification.created_at).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (notification.type === 'survey_cancelled') {
    return `Survey cancelled: ${formattedDate}`;
  }

  if (notification.type === 'survey_welcome') {
    return `Survey booked: ${formattedDate}`;
  }

  return formattedDate;
}

function NotificationCardComponent({
  notification,
  cartImage,
  onActionPress,
}: NotificationCardProps) {
  const action = getNotificationAction(notification);
  const ActionIcon = action?.icon;
  const isWhatsappAction = action?.variant === 'whatsapp';
  const actionIconColor = isWhatsappAction ? '#FFFFFF' : '#10233F';
  const [ctaPressed, setCtaPressed] = useState(false);

  return (
    <View style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}>
      <View style={styles.notificationHeader}>
        <View style={styles.iconContainer}>
          <Image source={cartImage} style={styles.iconImage} resizeMode="contain" />
        </View>

        <View style={styles.headingContainer}>
          <Text style={styles.notificationTitle}>
            {notification.title}
          </Text>

          <View style={styles.dateRow}>
            <CalendarClock size={16} color="#9A7610" strokeWidth={2} />
            <Text style={styles.dateText}>{getDateLabel(notification)}</Text>
          </View>
        </View>

        {!notification.is_read ? <View style={styles.unreadDot} /> : null}
      </View>

      <Text style={styles.notificationMessage}>{notification.message}</Text>

      {action && ActionIcon ? (
        <Pressable
          onPress={() => onActionPress(notification)}
          onPressIn={() => setCtaPressed(true)}
          onPressOut={() => setCtaPressed(false)}
          style={[
            styles.notificationCTA,
            isWhatsappAction ? styles.notificationCTAWhatsapp : styles.notificationCTACancelled,
            ctaPressed && styles.notificationCTAPressed,
          ]}
          accessibilityRole="button"
        >
          <ActionIcon size={20} color={actionIconColor} strokeWidth={2.3} />
          <Text
            style={[
              styles.notificationCTAText,
              isWhatsappAction ? styles.notificationCTATextLight : styles.notificationCTATextDark,
            ]}
            numberOfLines={2}
          >
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const NotificationCard = memo(NotificationCardComponent);

const styles = StyleSheet.create({
  notificationCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8D9B6',
    padding: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 7,
  },

  unreadCard: {
    borderColor: '#EAC859',
  },

  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#FFF5CF',
    borderWidth: 1,
    borderColor: '#E7C548',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  iconImage: {
    width: 40,
    height: 40,
  },

  headingContainer: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    paddingRight: 8,
  },

  notificationTitle: {
    color: '#10233F',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    flexShrink: 1,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  dateText: {
    flex: 1,
    marginLeft: 6,
    color: '#806B41',
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '600',
    flexShrink: 1,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F7B801',
    marginTop: 4,
    flexShrink: 0,
  },

  notificationMessage: {
    marginTop: 12,
    color: '#48576A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    flexShrink: 1,
  },

  notificationCTA: {
    width: '100%',
    minHeight: 44,
    marginTop: 13,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationCTACancelled: {
    backgroundColor: '#F7B801',
  },

  notificationCTAWhatsapp: {
    backgroundColor: '#25D366',
  },

  notificationCTAPressed: {
    opacity: 0.86,
  },

  notificationCTAText: {
    marginLeft: 8,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
  },

  notificationCTATextDark: {
    color: '#10233F',
  },

  notificationCTATextLight: {
    color: '#FFFFFF',
  },
});
