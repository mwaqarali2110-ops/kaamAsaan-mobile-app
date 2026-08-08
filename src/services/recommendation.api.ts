import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION,
  type BatteryUpliftRule,
  type CommercialRecommendationConfiguration,
  type LoadSizingRule,
} from '@/utils/commercialRecommendation';

const numberOr = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nullableNumber = (value: unknown) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapLoadRule = (row: Record<string, unknown>): LoadSizingRule => ({
  id: String(row.id),
  minRunningLoadKw: numberOr(row.min_running_load_kw, 0),
  maxRunningLoadKw: nullableNumber(row.max_running_load_kw),
  baseInverterKw: nullableNumber(row.base_inverter_kw),
  basePvKwp: nullableNumber(row.base_pv_kwp),
  requiresExpertReview: row.requires_expert_review === true,
  label: String(row.label ?? 'Commercial load rule'),
  priority: numberOr(row.priority, 0),
});

const mapBatteryRule = (row: Record<string, unknown>): BatteryUpliftRule => ({
  id: String(row.id),
  minBatteryBankKwh: numberOr(row.min_battery_bank_kwh, 0),
  maxBatteryBankKwh: nullableNumber(row.max_battery_bank_kwh),
  minimumInverterKw: nullableNumber(row.minimum_inverter_kw),
  minimumPvKwp: nullableNumber(row.minimum_pv_kwp),
  requiresExpertReview: row.requires_expert_review === true,
  label: String(row.label ?? 'Commercial battery uplift rule'),
  priority: numberOr(row.priority, 0),
});

export const recommendationApi = {
  async getConfiguration(): Promise<CommercialRecommendationConfiguration> {
    const fallback = DEFAULT_COMMERCIAL_RECOMMENDATION_CONFIGURATION;
    if (!isSupabaseConfigured) return fallback;

    const [settingsResult, loadRulesResult, batteryRulesResult] = await Promise.all([
      supabase.from('recommendation_settings').select('id, battery_usable_factor, battery_safety_margin_percent, acceptable_battery_shortfall_percent, extended_backup_step_percent, minimum_budget_coverage_percent, expert_review_battery_threshold_kwh, configured_installation_cost, configured_structure_cost, configured_accessories_cost, preliminary_recommendation_disclaimer, is_active').eq('is_active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('load_sizing_rules').select('*').eq('is_active', true).order('priority'),
      supabase.from('battery_uplift_rules').select('*').eq('is_active', true).order('priority'),
    ]);

    if (settingsResult.error || loadRulesResult.error || batteryRulesResult.error) {
      if (__DEV__) {
        // A missing migration is handled by the local V1 configuration. Keep
        // this as a development diagnostic without opening Expo LogBox.
        console.info('Commercial recommendation rules unavailable; using the safe local V1 fallback.', {
          settings: settingsResult.error?.message,
          loadRules: loadRulesResult.error?.message,
          batteryRules: batteryRulesResult.error?.message,
        });
      }
      return fallback;
    }

    const settings = settingsResult.data as Record<string, unknown> | null;
    const loadSizingRules = (loadRulesResult.data ?? []).map((row) => mapLoadRule(row as Record<string, unknown>));
    const batteryUpliftRules = (batteryRulesResult.data ?? []).map((row) => mapBatteryRule(row as Record<string, unknown>));
    if (!settings || loadSizingRules.length === 0 || batteryUpliftRules.length === 0) return fallback;

    return {
      settings: {
        batteryUsableFactor: numberOr(settings.battery_usable_factor, fallback.settings.batteryUsableFactor),
        batterySafetyMarginPercent: numberOr(settings.battery_safety_margin_percent, fallback.settings.batterySafetyMarginPercent),
        acceptableBatteryShortfallPercent: numberOr(settings.acceptable_battery_shortfall_percent, fallback.settings.acceptableBatteryShortfallPercent),
        extendedBackupStepPercent: numberOr(settings.extended_backup_step_percent, fallback.settings.extendedBackupStepPercent),
        minimumBudgetCoveragePercent: numberOr(settings.minimum_budget_coverage_percent, fallback.settings.minimumBudgetCoveragePercent),
        expertReviewBatteryThresholdKwh: numberOr(settings.expert_review_battery_threshold_kwh, fallback.settings.expertReviewBatteryThresholdKwh),
        configuredInstallationCost: numberOr(settings.configured_installation_cost, fallback.settings.configuredInstallationCost),
        configuredStructureCost: numberOr(settings.configured_structure_cost, fallback.settings.configuredStructureCost),
        configuredAccessoriesCost: numberOr(settings.configured_accessories_cost, fallback.settings.configuredAccessoriesCost),
        preliminaryRecommendationDisclaimer: String(
          settings.preliminary_recommendation_disclaimer ?? fallback.settings.preliminaryRecommendationDisclaimer
        ),
      },
      loadSizingRules,
      batteryUpliftRules,
      source: 'supabase',
    };
  },
};
