import { useQuery } from '@tanstack/react-query';
import { recommendationApi } from '@/services/recommendation.api';

export const useRecommendationConfiguration = () => useQuery({
  queryKey: ['commercial-recommendation-configuration', 'v2'],
  queryFn: recommendationApi.getConfiguration,
  staleTime: 5 * 60 * 1000,
  retry: 1,
});
