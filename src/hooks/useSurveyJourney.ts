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
    const channel = supabase
      .channel(`survey-journey-${bookingId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'survey_bookings', filter: `id=eq.${bookingId}` }, invalidateJourney)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'survey_booking_status_history', filter: `booking_id=eq.${bookingId}` }, invalidateJourney)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId, queryClient, userId]);
};
