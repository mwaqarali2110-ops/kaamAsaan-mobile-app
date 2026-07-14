import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image as RNImage,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronDown,
  FileText,
  Hash,
  Home,
  Image as ImageIcon,
  Images,
  Phone,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { ComplaintType, submitComplaint, uploadComplaintAttachment } from '@/services/complaints.api';
import { useAuthStore } from '@/store/useAuthStore';

const complaintTypes: Array<{ label: string; value: ComplaintType }> = [
  { label: 'System Issue', value: 'system_issue' },
  { label: 'Preventive Maintenance Feedback', value: 'preventive_maintenance_feedback' },
  { label: 'Installation Complaint', value: 'installation_complaint' },
  { label: 'Electrical Work Complaint', value: 'electrical_work_complaint' },
  { label: 'Cleaning Complaint', value: 'cleaning_complaint' },
  { label: 'Net Billing Complaint', value: 'net_billing_complaint' },
  { label: 'Other', value: 'other' },
];

type FormErrors = {
  complaintType?: string;
  subject?: string;
  details?: string;
  contactNumber?: string;
};

type AttachedPhoto = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.fieldBlock}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export const ComplaintScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const [complaintType, setComplaintType] = useState<ComplaintType | ''>('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintReference, setComplaintReference] = useState('');
  const [photoOptionsOpen, setPhotoOptionsOpen] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<AttachedPhoto | null>(null);

  useEffect(() => {
    setContactNumber(profile?.phone ?? '');
  }, [profile?.phone]);

  const selectedTypeLabel = useMemo(
    () => complaintTypes.find((item) => item.value === complaintType)?.label,
    [complaintType]
  );

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!complaintType) nextErrors.complaintType = 'Please select complaint type.';
    if (!subject.trim()) nextErrors.subject = 'Please enter complaint subject.';
    if (!details.trim()) nextErrors.details = 'Please describe your complaint.';
    if (!contactNumber.trim()) nextErrors.contactNumber = 'Please enter contact number.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const imageUrl = attachedPhoto
        ? await uploadComplaintAttachment({
            uri: attachedPhoto.uri,
            mimeType: attachedPhoto.mimeType,
            userId: session?.user.id ?? null,
          })
        : null;
      const result = await submitComplaint({
        user_id: session?.user.id ?? null,
        complaint_type: complaintType as ComplaintType,
        subject,
        details,
        reference_number: referenceNumber,
        contact_number: contactNumber,
        image_url: imageUrl,
      });
      setComplaintReference(result.reference);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showPermissionAlert = () => {
    Alert.alert('Permission required', 'Please allow access to attach a photo.');
  };

  const handlePickedImage = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    setAttachedPhoto({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    });
  };

  const chooseFromGallery = async () => {
    setPhotoOptionsOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showPermissionAlert();
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.78,
      });
      handlePickedImage(result);
    } catch (error) {
      Alert.alert('Unable to open gallery', 'Please try again.');
    }
  };

  const takePhoto = async () => {
    setPhotoOptionsOpen(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showPermissionAlert();
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.78,
      });
      handlePickedImage(result);
    } catch (error) {
      Alert.alert('Unable to open camera', 'Please try again.');
    }
  };

  const backToHome = () => {
    setComplaintReference('');
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color="#0F172A" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Complaint</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(34, insets.bottom + 26) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <ShieldCheck size={24} color="#D99A00" strokeWidth={2.4} />
            </View>
            <View style={styles.introTextWrap}>
              <Text style={styles.title}>Complaint</Text>
              <Text style={styles.subtitle}>
                Tell us what went wrong. Our support team will review and contact you.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Field label="Complaint Type" error={errors.complaintType}>
              <View style={styles.typeGrid}>
                {complaintTypes.map((item) => {
                  const selected = item.value === complaintType;
                  return (
                    <Pressable
                      key={item.value}
                      style={[styles.typePill, selected && styles.typePillSelected]}
                      onPress={() => {
                        setComplaintType(item.value);
                        setErrors((current) => ({ ...current, complaintType: undefined }));
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.typeText, selected && styles.typeTextSelected]} numberOfLines={2}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.selectedTypeRow}>
                <Text style={styles.selectedTypeText}>
                  {selectedTypeLabel ? `Selected: ${selectedTypeLabel}` : 'Select one complaint category'}
                </Text>
                <ChevronDown size={16} color="#B08900" />
              </View>
            </Field>

            <Field label="Subject" error={errors.subject}>
              <View style={[styles.inputWrap, errors.subject && styles.inputWrapError]}>
                <FileText size={19} color="#D99A00" strokeWidth={2.2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter complaint subject"
                  placeholderTextColor="#94A3B8"
                  value={subject}
                  onChangeText={(value) => {
                    setSubject(value);
                    setErrors((current) => ({ ...current, subject: undefined }));
                  }}
                />
              </View>
            </Field>

            <Field label="Complaint Details" error={errors.details}>
              <View style={[styles.detailsWrap, errors.details && styles.inputWrapError]}>
                <TextInput
                  style={styles.detailsInput}
                  placeholder="Describe your issue in detail"
                  placeholderTextColor="#94A3B8"
                  value={details}
                  onChangeText={(value) => {
                    setDetails(value);
                    setErrors((current) => ({ ...current, details: undefined }));
                  }}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </Field>

            <Field label="Reference Number / Project ID optional">
              <View style={styles.inputWrap}>
                <Hash size={19} color="#D99A00" strokeWidth={2.2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter booking or project reference if available"
                  placeholderTextColor="#94A3B8"
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                />
              </View>
            </Field>

            <Field label="Contact Number" error={errors.contactNumber}>
              <View style={[styles.inputWrap, errors.contactNumber && styles.inputWrapError]}>
                <Phone size={19} color="#D99A00" strokeWidth={2.2} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter contact number"
                  placeholderTextColor="#94A3B8"
                  value={contactNumber}
                  onChangeText={(value) => {
                    setContactNumber(value);
                    setErrors((current) => ({ ...current, contactNumber: undefined }));
                  }}
                  keyboardType="phone-pad"
                />
              </View>
            </Field>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Attach Photo optional</Text>
              <Pressable
                style={styles.attachBox}
                onPress={() => setPhotoOptionsOpen(true)}
                accessibilityRole="button"
              >
                <View style={styles.attachIcon}>
                  <ImageIcon size={21} color="#D99A00" strokeWidth={2.2} />
                </View>
                <View style={styles.attachTextWrap}>
                  <Text style={styles.attachTitle}>{attachedPhoto ? 'Change attached photo' : 'Attach photo'}</Text>
                  <Text style={styles.attachHint}>Choose from gallery or take a photo.</Text>
                </View>
              </Pressable>
              {attachedPhoto ? (
                <View style={styles.previewCard}>
                  <RNImage source={{ uri: attachedPhoto.uri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.previewTextWrap}>
                    <Text style={styles.previewTitle} numberOfLines={1}>
                      {attachedPhoto.fileName || 'Complaint photo attached'}
                    </Text>
                    <Text style={styles.previewHint}>This image will be included with your complaint.</Text>
                  </View>
                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => setAttachedPhoto(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove attached photo"
                  >
                    <X size={18} color="#0F172A" strokeWidth={2.5} />
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isSubmitting && styles.buttonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <>
                  <Send size={20} color="#0F172A" strokeWidth={2.4} />
                  <Text style={styles.submitText}>Submit Complaint</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={Boolean(complaintReference)} transparent animationType="fade" onRequestClose={backToHome}>
        <View style={styles.successBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <CheckCircle2 size={42} color="#0F172A" strokeWidth={2.3} />
            </View>
            <Text style={styles.successTitle}>Complaint Submitted</Text>
            <Text style={styles.successMessage}>
              Your complaint has been received. Our support team will review it and contact you shortly.
            </Text>
            <View style={styles.referenceBox}>
              <Text style={styles.referenceLabel}>Complaint ID</Text>
              <Text style={styles.referenceValue}>{complaintReference}</Text>
            </View>
            <Pressable style={styles.homeButton} onPress={backToHome} accessibilityRole="button">
              <Home size={20} color="#0F172A" strokeWidth={2.4} />
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={photoOptionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoOptionsOpen(false)}
      >
        <Pressable style={styles.photoSheetBackdrop} onPress={() => setPhotoOptionsOpen(false)}>
          <Pressable style={[styles.photoSheet, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
            <View style={styles.photoSheetHandle} />
            <Text style={styles.photoSheetTitle}>Attach Photo</Text>
            <Text style={styles.photoSheetSubtitle}>Add a clear photo to help us understand the issue.</Text>

            <Pressable style={styles.photoOption} onPress={chooseFromGallery} accessibilityRole="button">
              <View style={styles.photoOptionIcon}>
                <Images size={21} color="#D99A00" strokeWidth={2.4} />
              </View>
              <Text style={styles.photoOptionText}>Choose from Gallery</Text>
            </Pressable>

            <Pressable style={styles.photoOption} onPress={takePhoto} accessibilityRole="button">
              <View style={styles.photoOptionIcon}>
                <Camera size={21} color="#D99A00" strokeWidth={2.4} />
              </View>
              <Text style={styles.photoOptionText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={styles.photoCancel}
              onPress={() => setPhotoOptionsOpen(false)}
              accessibilityRole="button"
            >
              <Text style={styles.photoCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBF2',
  },
  keyboard: {
    flex: 1,
  },
  header: {
    height: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#0F172A',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 42,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DED0',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  introTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#0F172A',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  formCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DED0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  fieldBlock: {
    marginBottom: 15,
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    maxWidth: '100%',
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFBF2',
    borderWidth: 1,
    borderColor: '#E8DED0',
    justifyContent: 'center',
  },
  typePillSelected: {
    backgroundColor: '#FFF2C7',
    borderColor: '#F5B400',
  },
  typeText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  typeTextSelected: {
    color: '#B77900',
  },
  selectedTypeRow: {
    marginTop: 10,
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTypeText: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  inputWrap: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFEFB',
    borderWidth: 1,
    borderColor: '#E8DED0',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  detailsWrap: {
    minHeight: 112,
    borderRadius: 16,
    backgroundColor: '#FFFEFB',
    borderWidth: 1,
    borderColor: '#E8DED0',
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  detailsInput: {
    minHeight: 88,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 6,
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  attachBox: {
    minHeight: 64,
    borderRadius: 17,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F3D27A',
    backgroundColor: '#FFF8E6',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  attachTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  attachTitle: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  attachHint: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  previewCard: {
    marginTop: 10,
    minHeight: 70,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: '#FFF4D6',
  },
  previewTextWrap: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  previewTitle: {
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  previewHint: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  removePhotoButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  submitButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#D99A00',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.995 }],
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  submitText: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.34)',
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFBF2',
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DED0',
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#F5B400',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'center',
  },
  successMessage: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    textAlign: 'center',
  },
  referenceBox: {
    marginTop: 18,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    padding: 14,
    alignItems: 'center',
  },
  referenceLabel: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  referenceValue: {
    marginTop: 4,
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  homeButton: {
    marginTop: 18,
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F5B400',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  homeButtonText: {
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  photoSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    justifyContent: 'flex-end',
  },
  photoSheet: {
    backgroundColor: '#FFFBF2',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#E8DED0',
  },
  photoSheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E8DED0',
    marginBottom: 14,
  },
  photoSheetTitle: {
    color: '#0F172A',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  photoSheetSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  photoOption: {
    height: 56,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED0',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  photoOptionText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  photoCancel: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  photoCancelText: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
});
