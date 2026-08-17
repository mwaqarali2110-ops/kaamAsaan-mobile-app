import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { BadgePercent, CheckCircle2, Tag, X } from 'lucide-react-native';
import type { PromoState } from '@/types/promo.types';
import { formatPkrCurrency } from '@/utils/promo';

type PromoCodeCardProps = {
  promo: PromoState;
  onChangeCode: (value: string) => void;
  onApply: () => void;
  onRemove: () => void;
};

export const PromoCodeCard = ({
  promo,
  onChangeCode,
  onApply,
  onRemove
}: PromoCodeCardProps) => {
  const { width } = useWindowDimensions();
  const isLoading = promo.status === 'loading';
  const isApplied = promo.status === 'applied';
  const canApply = Boolean(promo.enteredCode.trim()) && !isLoading && !isApplied;
  const compact = width <= 350;
  const targetLabel = promo.appliesTo === 'installation'
    ? 'Installation Charges'
    : promo.appliesTo === 'panels'
      ? 'Solar Panels'
      : promo.appliesTo === 'inverter'
        ? 'Inverter'
        : promo.appliesTo === 'battery'
          ? 'Battery'
          : null;

  return (
    <View style={[styles.card, isApplied && styles.cardApplied, promo.status === 'invalid' && styles.cardInvalid]}>
      <View style={styles.headerRow}>
        <View style={styles.tagBox}>
          <Tag color="#D99A00" size={24} strokeWidth={2.1} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Promo Code</Text>
          <Text style={styles.subtitle}>Apply a promo code to get discount</Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputShell, isApplied && styles.inputShellApplied]}>
          {isApplied ? <CheckCircle2 color="#15935A" size={18} strokeWidth={2.4} /> : null}
          <TextInput
            value={promo.enteredCode}
            onChangeText={onChangeCode}
            style={styles.input}
            placeholder="Enter promo code"
            placeholderTextColor="#9AA4B2"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={32}
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (canApply) onApply();
            }}
            accessibilityLabel="Promo code"
          />
        </View>
        <Pressable
          onPress={onApply}
          disabled={!canApply}
          accessibilityRole="button"
          accessibilityLabel="Apply promo code"
          accessibilityState={{ disabled: !canApply }}
          style={({ pressed }) => [
            styles.applyButton,
            compact && styles.applyButtonCompact,
            !canApply && styles.applyButtonDisabled,
            pressed && canApply && styles.applyButtonPressed
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.applyText}>{isApplied ? 'Applied' : 'Apply'}</Text>
          )}
        </Pressable>
      </View>

      {promo.message ? (
        <View
          style={styles.messageRow}
          accessibilityLiveRegion="polite"
          accessibilityRole={promo.status === 'invalid' ? 'alert' : undefined}
        >
          <Text style={[styles.message, isApplied && styles.successMessage, !isApplied && styles.errorMessage]}>
            {isApplied && targetLabel ? `${promo.message} Applied to ${targetLabel}.` : promo.message}
          </Text>
          {isApplied ? (
            <Pressable
              onPress={onRemove}
              hitSlop={10}
              style={styles.removeButton}
              accessibilityRole="button"
              accessibilityLabel={`Remove promo code ${promo.appliedCode ?? ''}`}
            >
              <X color="#64748B" size={16} strokeWidth={2.5} />
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.separator} />

      <View style={styles.priceRow}>
        <Text style={styles.subtotalLabel}>Subtotal</Text>
        <Text style={styles.subtotalValue}>{formatPkrCurrency(promo.originalTotal)}</Text>
      </View>

      <View style={[styles.priceRow, styles.discountRow]}>
        <View style={styles.discountLabel}>
          <BadgePercent color="#23A36D" size={18} strokeWidth={2.2} />
          <Text style={styles.discountText}>Discount</Text>
        </View>
        <Text style={styles.discountValue}>-{formatPkrCurrency(promo.discountAmount)}</Text>
      </View>

      <View style={[styles.priceRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>{formatPkrCurrency(promo.finalTotal)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0D999',
    backgroundColor: '#FFFDF7',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#6B5B43',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2
  },
  cardApplied: {
    borderColor: '#A9D9BE',
    backgroundColor: '#FFFEF9'
  },
  cardInvalid: {
    borderColor: '#F1C5BE'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tagBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF3CC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerCopy: {
    flex: 1,
    paddingLeft: 13
  },
  title: {
    color: '#10213A',
    fontSize: 18,
    lineHeight: 21,
    fontWeight: '900'
  },
  subtitle: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700'
  },
  inputRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  inputShell: {
    flex: 1,
    minWidth: 0,
    height: 51,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D5DAE1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8
  },
  inputShellApplied: {
    borderColor: '#8DCCAA',
    backgroundColor: '#F8FFFB'
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: '#10213A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.25,
    paddingVertical: 0
  },
  applyButton: {
    width: 104,
    height: 51,
    borderRadius: 15,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D28D00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2
  },
  applyButtonCompact: {
    width: 88
  },
  applyButtonDisabled: {
    backgroundColor: '#E8D9AB',
    shadowOpacity: 0,
    elevation: 0
  },
  applyButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }]
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900'
  },
  messageRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 7
  },
  message: {
    flex: 1,
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700'
  },
  successMessage: {
    color: '#15935A'
  },
  errorMessage: {
    color: '#B42318'
  },
  removeButton: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4
  },
  removeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900'
  },
  separator: {
    marginTop: 10,
    marginBottom: 10,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDD9D0'
  },
  priceRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  discountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  discountRow: {
    marginTop: 5
  },
  subtotalLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800'
  },
  subtotalValue: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right'
  },
  discountText: {
    color: '#15935A',
    fontSize: 13,
    fontWeight: '900'
  },
  discountValue: {
    color: '#15935A',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'right'
  },
  totalRow: {
    marginTop: 7
  },
  totalLabel: {
    color: '#10213A',
    fontSize: 15,
    fontWeight: '900'
  },
  totalValue: {
    color: '#10213A',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right'
  }
});
