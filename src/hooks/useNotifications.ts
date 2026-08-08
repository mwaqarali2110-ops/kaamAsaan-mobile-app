import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/notifications.api';
import { supabase } from '@/lib/supabase';

export const notificationsQueryKey = (userId?: string) => ['notifications', userId] as const;
export const unreadNotificationsQueryKey = (userId?: string) => ['notifications', 'unread-count', userId] as const;
export const latestWelcomeNotificationQueryKey = (userId?: string) => ['notifications', 'latest-welcome', userId] as const;

export const useNotifications = (userId?: string) =>
  useQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: () => notificationsApi.getNotifications(userId!),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

export const useUnreadNotificationsCount = (userId?: string) =>
  useQuery({
    queryKey: unreadNotificationsQueryKey(userId),
    queryFn: () => notificationsApi.getUnreadCount(userId!),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

export const useNotificationRealtime = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`customer-notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => {
          void Promise.all([
            queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) }),
            queryClient.invalidateQueries({ queryKey: unreadNotificationsQueryKey(userId) }),
            queryClient.invalidateQueries({ queryKey: latestWelcomeNotificationQueryKey(userId) })
          ]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);
};

export const useLatestUnreadWelcomeNotification = (userId?: string) =>
  useQuery({
    queryKey: latestWelcomeNotificationQueryKey(userId),
    queryFn: () => notificationsApi.getLatestUnreadSurveyWelcome(userId!),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });

export const useMarkNotificationRead = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) }),
        queryClient.invalidateQueries({ queryKey: unreadNotificationsQueryKey(userId) }),
        queryClient.invalidateQueries({ queryKey: latestWelcomeNotificationQueryKey(userId) }),
      ]);
    },
  });
};
