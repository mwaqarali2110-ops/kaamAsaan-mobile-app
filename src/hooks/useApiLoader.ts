import { useCallback } from 'react';
import { useApiLoaderStore } from '@/store/useApiLoaderStore';

// Wrap any one-off async call (Supabase call, manual fetch, auth action)
// that isn't already going through a react-query mutation, to surface the
// themed global loader while it's in flight.
export const useApiLoader = () => {
  const show = useApiLoaderStore((state) => state.show);
  const hide = useApiLoaderStore((state) => state.hide);

  const withApiLoader = useCallback(
    async <T,>(task: () => Promise<T>, label?: string): Promise<T> => {
      show(label);
      try {
        return await task();
      } finally {
        hide();
      }
    },
    [hide, show]
  );

  return { withApiLoader };
};
