import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sun } from 'lucide-react-native';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

export const AuthShell = ({ title, subtitle, onBack, children }: { title: string; subtitle: string; onBack?: () => void; children: React.ReactNode }) => (
  <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          {onBack ? (
            <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Back">
              <ArrowLeft size={21} color="#10213A" strokeWidth={2.5} />
            </Pressable>
          ) : <View style={styles.backSpacer} />}
          <View style={styles.brandMark}><Sun size={20} color="#F5A400" strokeWidth={2.5} /></View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

export const AuthField = <T extends FieldValues>({
  control,
  name,
  label,
  Icon,
  ...props
}: TextInputProps & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrap, error && styles.inputWrapError]}>
          <Icon size={17} color="#8A6A16" strokeWidth={2.1} />
          <TextInput
            {...props}
            style={styles.input}
            value={typeof value === 'string' ? value : ''}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        {error ? <Text style={styles.error}>{error.message}</Text> : null}
      </View>
    )}
  />
);

export const AuthMessage = ({ text, tone = 'error' }: { text?: string | null; tone?: 'error' | 'success' }) => (
  text ? <Text style={[styles.message, tone === 'success' && styles.messageSuccess]}>{text}</Text> : null
);

export const AuthSubmit = ({ title, loading, onPress }: { title: string; loading?: boolean; onPress: () => void }) => (
  <Pressable style={[styles.submit, loading && styles.submitDisabled]} disabled={loading} onPress={onPress}>
    <Text style={styles.submitText}>{loading ? 'Please wait...' : title}</Text>
  </Pressable>
);

export const AuthLink = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <Pressable onPress={onPress}>
    <Text style={styles.link}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF8F1' },
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 22 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  backSpacer: { width: 42 },
  brandMark: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: '#F1D99C', backgroundColor: '#FFF9E9', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#10213A', fontSize: 27, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { marginTop: 6, marginBottom: 18, color: '#64748B', fontSize: 13.5, lineHeight: 19, fontWeight: '600' },
  card: { gap: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E8DED2', backgroundColor: '#FFFFFF', padding: 16, elevation: 2 },
  fieldBlock: { gap: 6 },
  label: { color: '#10213A', fontSize: 12.5, fontWeight: '900' },
  inputWrap: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, borderWidth: 1, borderColor: '#E5DED3', backgroundColor: '#FFFEFB', paddingHorizontal: 12 },
  inputWrapError: { borderColor: '#D9534F' },
  input: { flex: 1, color: '#10213A', fontSize: 13.5, fontWeight: '600' },
  error: { color: '#C2413B', fontSize: 10.5, fontWeight: '700' },
  message: { borderRadius: 11, backgroundColor: '#FEF2F2', padding: 10, color: '#B42318', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  messageSuccess: { backgroundColor: '#ECFDF3', color: '#027A48' },
  submit: { height: 48, marginTop: 3, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7B500' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#10213A', fontSize: 14, fontWeight: '900' },
  link: { color: '#9A6C00', textAlign: 'center', fontSize: 12.5, fontWeight: '800' }
});

export const authStyles = styles;
