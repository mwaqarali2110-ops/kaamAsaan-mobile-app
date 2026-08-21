import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { journeyApi } from '@/services/journey.api';
import { supabase } from '@/lib/supabase';

export const activeSurveyJourneyQueryKey = (userId?: string) => ['survey-bookings', 'active', userId] as const;
export const latestSurveyJourneyQueryKey = (userId?: string) => ['survey-bookings', 'latest', userId] as const;

export const useActiveSurveyJourney = (userId?: string) =>
  useQuery({
    queryKey: activeSurveyJourneyQueryKey(userId),
    queryFn: () => journeyApi.getLatestActiveSurveyBooking(userId!),
    enabled: Boolean(userId),
    refetchInterval: 60_000,
    staleTime: 15_000
  });

export const useLatestSurveyJourney = (userId?: string) =>
  useQuery({
    queryKey: latestSurveyJourneyQueryKey(userId),
    queryFn: () => journeyApi.getLatestSurveyBooking(userId!),
    enabled: Boolean(userId),
    refetchInterval: 60_000,
    staleTime: 15_000
  });

export const useSurveyJourney = (bookingId?: string) =>
  useQuery({
    queryKey: ['survey-bookings', 'detail', bookingId],
    queryFn: () => journeyApi.getSurveyBooking(bookingId!),
    enabled: Boolean(bookingId),
    refetchInterval: 60_000,
    staleTime: 15_000
  });

export const useSurveyJourneyRealtime = (bookingId?: string, userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!bookingId || !userId) return;
    const invalidateJourney = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['survey-bookings', 'detail', bookingId] }),
        queryClient.invalidateQueries({ queryKey: activeSurveyJourneyQueryKey(userId) }),
        queryClient.invalidateQueries({ queryKey: latestSurveyJourneyQueryKey(userId) })
      ]);
    };
    const topic = `survey-journey-${bookingId}`;
    // supabase-js reuses an existing channel instance for a topic that's still
    // joined/joining rather than creating a fresh one, so calling .on() below
    // throws "cannot add postgres_changes callbacks ... after subscribe()" if a
    // prior instance of this effect (e.g. from a fast remount during a
    // navigation transition) hasn't finished its unmount cleanup yet. Removing
    // any stale channel for this topic first guarantees .channel() below always
    // returns a fresh, unsubscribed instance.
    supabase.getChannels().forEach((existing) => {
      if (existing.topic === `realtime:${topic}`) void supabase.removeChannel(existing);
    });
    const channel = supabase
      .channel(topic)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'survey_bookings', filter: `id=eq.${bookingId}` }, invalidateJourney)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_booking_status_history', filter: `booking_id=eq.${bookingId}` }, invalidateJourney)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient, userId]);
};
