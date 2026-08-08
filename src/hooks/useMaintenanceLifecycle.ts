import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { maintenanceApi } from '@/services/maintenance.api';
import type { MaintenanceFeedbackInput } from '@/types/maintenance.types';

type LifecycleIdentity = { planId?: string | null; requestId?: string | null; visitId?: string | null; activeUserId?: string | null };
type LifecycleOptions = { realtime?: boolean };

export const maintenanceLifecycleQueryKey = (identity: LifecycleIdentity) => [
  'premium-care-lifecycle',
  identity.planId ?? null,
  identity.requestId ?? null,
  identity.visitId ?? null,
  identity.activeUserId ?? null
] as const;

export const useMaintenanceLifecycle = (identity: LifecycleIdentity, options: LifecycleOptions = {}) => {
  const client = useQueryClient();
  const planId = identity.planId?.trim() || null;
  const requestId = identity.requestId?.trim() || null;
  const visitId = identity.visitId?.trim() || null;
  const activeUserId = identity.activeUserId?.trim() || null;
  const realtimeEnabled = options.realtime ?? true;
  const normalizedIdentity = useMemo(
    () => ({ planId, requestId, visitId, activeUserId }),
    [activeUserId, planId, requestId, visitId]
  );
  const queryKey = useMemo(
    () => maintenanceLifecycleQueryKey(normalizedIdentity),
    [normalizedIdentity]
  );
  const query = useQuery({
    queryKey,
    queryFn: () => maintenanceApi.getLifecycle(normalizedIdentity),
    enabled: Boolean(planId || requestId || visitId || activeUserId),
    staleTime: 10_000
  });
  const resolvedPlanId = query.data?.plan.id?.trim() || planId;

  useEffect(() => {
    if (!realtimeEnabled || !resolvedPlanId) return;

    let isActive = true;
    const subscriptionId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const refreshLifecycle = () => {
      if (!isActive) return;
      void client.invalidateQueries({ queryKey, exact: true });
    };
    const reportStatus = (channel: 'plan' | 'visits') => (status: string, error?: Error) => {
      if (!__DEV__) return;
      const details = { channel, planId: resolvedPlanId, status, error: error?.message };
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn('[PremiumCare realtime]', details);
      } else {
        console.log('[PremiumCare realtime]', details);
      }
    };

    const planChannel = supabase
      .channel(`premium-care-plan-${resolvedPlanId}-${subscriptionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_plans', filter: `id=eq.${resolvedPlanId}` },
        refreshLifecycle
      )
      .subscribe(reportStatus('plan'));

    const visitsChannel = supabase
      .channel(`premium-care-visits-${resolvedPlanId}-${subscriptionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_visits', filter: `plan_id=eq.${resolvedPlanId}` },
        refreshLifecycle
      )
      .subscribe(reportStatus('visits'));

    return () => {
      isActive = false;
      void supabase.removeChannel(planChannel);
      void supabase.removeChannel(visitsChannel);
    };
  }, [client, queryKey, realtimeEnabled, resolvedPlanId]);

  return query;
};

export const useSubmitMaintenanceFeedback = (identity: LifecycleIdentity) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: MaintenanceFeedbackInput) => maintenanceApi.submitFeedback(input),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: maintenanceLifecycleQueryKey(identity) }),
        client.invalidateQueries({ queryKey: ['notifications'] })
      ]);
    }
  });
};
