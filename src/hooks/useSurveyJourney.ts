import { useQuery } from '@tanstack/react-query';
import { journeyApi } from '@/services/journey.api';

export const activeSurveyJourneyQueryKey = (userId?: string) => ['survey-bookings', 'active', userId] as const;

export const useActiveSurveyJourney = (userId?: string) =>
  useQuery({
    queryKey: activeSurveyJourneyQueryKey(userId),
    queryFn: () => journeyApi.getLatestActiveSurveyBooking(userId!),
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

