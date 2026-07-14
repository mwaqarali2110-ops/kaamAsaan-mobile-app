import { AppButton } from "@/components/ui/AppButton";
import { colors } from "@/constants/colors";
import { languages } from "@/i18n";
import { useAppLanguage } from "@/i18n/I18nProvider";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Building2,
  CheckCircle2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ProfileForm = {
  fullName: string;
  phone: string;
  city: string;
};

export const ProfileScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { language, restartRequired, rtl, setLanguage } = useAppLanguage();
  const session = useAuthStore((state) => state.session);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const signOut = useAuthStore((state) => state.signOut);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const rootNavigation = navigation.getParent();
  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    phone: "",
    city: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      fullName: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
    });
  }, [profile]);

  const initials = useMemo(() => {
    const source =
      form.fullName || session?.user.email || t("profile.customerAccount");
    return source
      .split(/[.\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [form.fullName, session?.user.email]);

  const saveProfile = async () => {
    setError("");
    setMessage("");
    if (form.fullName.trim().length < 2) {
      setError(t("auth.errors.fullName"));
      return;
    }
    if (form.phone.trim().length < 10) {
      setError(t("auth.errors.phone"));
      return;
    }
    if (form.city.trim().length < 2) {
      setError(t("auth.errors.city"));
      return;
    }

    try {
      await updateProfile({
        full_name: form.fullName,
        phone: form.phone,
        city: form.city,
      });
      setMessage(t("profile.updated"));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t("profile.updateFailed"),
      );
    }
  };

  const updateLanguage = async (nextLanguage: typeof language) => {
    setError("");
    setMessage("");
    await setLanguage(nextLanguage);
    setMessage(t("profile.languageChanged"));
  };

  const handleSignOut = async () => {
    setError("");
    try {
      await signOut();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t("errors.logoutFailed"),
      );
    } finally {
      rootNavigation?.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.guestContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guestHero}>
            <View style={styles.guestAvatar}>
              <UserRound color="#172031" size={36} strokeWidth={2.2} />
            </View>
            <Text style={[styles.guestTitle, rtl && styles.rtlText]}>
              {t("profile.guestTitle")}
            </Text>
            <Text style={[styles.guestSubtitle, rtl && styles.rtlText]}>
              {t("profile.guestSubtitle")}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={[styles.cardTitle, rtl && styles.rtlText]}>
              {t("profile.customerAccount")}
            </Text>
            <Text style={[styles.cardText, rtl && styles.rtlText]}>
              {t("profile.guestCardText")}
            </Text>
            <View style={styles.guestActions}>
              <AppButton
                title={t("auth.login.signIn")}
                onPress={() => rootNavigation?.navigate("Login")}
              />
              <AppButton
                title={t("auth.signup.createAccount")}
                tone="secondary"
                onPress={() => rootNavigation?.navigate("Signup")}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        enabled={Platform.OS === "ios"}
        behavior="padding"
        style={styles.fill}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topRow}>
            <View>
              <Text style={[styles.eyebrow, rtl && styles.rtlText]}>
                {t("profile.eyebrow")}
              </Text>
              <Text style={[styles.title, rtl && styles.rtlText]}>
                {t("profile.title")}
              </Text>
            </View>
            <Pressable
              disabled={loading}
              onPress={() => void handleSignOut()}
              style={styles.logoutIcon}
              accessibilityLabel={t("profile.logout")}
            >
              <LogOut color="#8A6A16" size={19} strokeWidth={2.3} />
            </Pressable>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || "K"}</Text>
              </View>
            </View>
            <View style={styles.heroCopy}>
              <Text style={[styles.name, rtl && styles.rtlText]}>
                {form.fullName || t("profile.customerAccount")}
              </Text>
              <Text style={[styles.email, rtl && styles.rtlText]}>
                {session.user.email || t("profile.customerAccount")}
              </Text>
              <View style={styles.statusPill}>
                <ShieldCheck color="#128A3E" size={12} strokeWidth={2.4} />
                <Text style={styles.statusText}>{t("profile.verified")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>
                {t("profile.basicDetails")}
              </Text>
              <CheckCircle2 color="#F5A400" size={18} strokeWidth={2.4} />
            </View>

            <ProfileInput
              label={t("profile.fullName")}
              value={form.fullName}
              onChangeText={(fullName) =>
                setForm((next) => ({ ...next, fullName }))
              }
              placeholder={t("profile.fullNamePlaceholder")}
              Icon={User}
              rtl={rtl}
            />
            <ProfileInput
              label={t("profile.email")}
              value={session.user.email ?? ""}
              editable={false}
              placeholder={t("auth.signup.emailPlaceholder")}
              Icon={Mail}
              rtl={rtl}
            />
            <ProfileInput
              label={t("profile.phone")}
              value={form.phone}
              onChangeText={(phone) => setForm((next) => ({ ...next, phone }))}
              placeholder={t("profile.phonePlaceholder")}
              keyboardType="phone-pad"
              Icon={Phone}
              rtl={rtl}
            />
            <ProfileInput
              label={t("profile.city")}
              value={form.city}
              onChangeText={(city) => setForm((next) => ({ ...next, city }))}
              placeholder={t("profile.cityPlaceholder")}
              Icon={Building2}
              rtl={rtl}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {message ? <Text style={styles.successText}>{message}</Text> : null}

            <Pressable
              disabled={loading}
              onPress={saveProfile}
              style={[styles.saveButton, loading && styles.disabledButton]}
            >
              <Text style={styles.saveText}>
                {loading ? t("common.saving") : t("common.saveChanges")}
              </Text>
            </Pressable>
          </View>

          <View style={styles.languageCard}>
            <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>
              {t("profile.language")}
            </Text>
            <Text style={[styles.languageSubtitle, rtl && styles.rtlText]}>
              {t("profile.languageSubtitle")}
            </Text>
            <View style={styles.languageOptions}>
              {languages.map((item) => {
                const selected = item.code === language;
                return (
                  <Pressable
                    key={item.code}
                    onPress={() => void updateLanguage(item.code)}
                    style={[
                      styles.languageOption,
                      selected && styles.languageOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        selected && styles.languageTextActive,
                      ]}
                    >
                      {item.nativeLabel}
                    </Text>
                    {selected ? (
                      <CheckCircle2
                        color="#128A3E"
                        size={16}
                        strokeWidth={2.4}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {restartRequired ? (
              <Text style={[styles.restartText, rtl && styles.rtlText]}>
                {t("profile.restartRequired")}
              </Text>
            ) : null}
          </View>

          <View style={styles.supportCard}>
            <Text style={[styles.supportTitle, rtl && styles.rtlText]}>
              {t("profile.supportTitle")}
            </Text>
            <Text style={[styles.supportText, rtl && styles.rtlText]}>
              {t("profile.supportText")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ProfileInput = ({
  label,
  Icon,
  rtl,
  editable = true,
  ...props
}: {
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  rtl?: boolean;
} & React.ComponentProps<typeof TextInput>) => (
  <View style={styles.inputBlock}>
    <Text style={[styles.inputLabel, rtl && styles.rtlText]}>{label}</Text>
    <View style={[styles.inputWrap, !editable && styles.inputWrapDisabled]}>
      <Icon color="#9A6C00" size={16} strokeWidth={2.2} />
      <TextInput
        {...props}
        editable={editable}
        placeholderTextColor="#9CA3AF"
        style={[
          styles.input,
          rtl && styles.rtlText,
          !editable && styles.inputDisabled,
        ]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FBF8F1",
  },
  fill: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  guestContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  topRow: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: "#9A6C00",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    marginTop: 3,
    color: "#10213A",
    fontSize: 28,
    fontWeight: "900",
  },
  logoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8DED2",
    backgroundColor: "#FFFFFF",
  },
  heroCard: {
    minHeight: 142,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F0DDAE",
    backgroundColor: "#FFF6DD",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    shadowColor: "#8A6A16",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 3,
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F6D66F",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#172031",
  },
  avatarText: {
    color: "#F8C642",
    fontSize: 26,
    fontWeight: "900",
  },
  heroCopy: {
    flex: 1,
  },
  name: {
    color: "#172031",
    fontSize: 20,
    fontWeight: "900",
  },
  email: {
    marginTop: 5,
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
  },
  statusPill: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "900",
  },
  formCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9DEC9",
    backgroundColor: "#FFFFFF",
    padding: 16,
    shadowColor: "#6B5B43",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#10213A",
    fontSize: 16,
    fontWeight: "900",
  },
  inputBlock: {
    marginBottom: 12,
  },
  inputLabel: {
    marginBottom: 7,
    color: "#334155",
    fontSize: 12,
    fontWeight: "900",
  },
  inputWrap: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E5DED3",
    backgroundColor: "#FFFEFB",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  inputWrapDisabled: {
    backgroundColor: "#F8F5EF",
  },
  input: {
    flex: 1,
    color: "#10213A",
    fontSize: 14,
    fontWeight: "800",
  },
  inputDisabled: {
    color: "#64748B",
  },
  errorText: {
    marginTop: 2,
    color: "#C2413B",
    fontSize: 12,
    fontWeight: "800",
  },
  successText: {
    marginTop: 2,
    color: colors.green,
    fontSize: 12,
    fontWeight: "900",
  },
  saveButton: {
    height: 52,
    marginTop: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5B700",
    shadowColor: "#D79300",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveText: {
    color: "#10213A",
    fontSize: 15,
    fontWeight: "900",
  },
  supportCard: {
    marginTop: 16,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#DCE8D8",
    backgroundColor: "#F3FBF0",
    padding: 15,
  },
  supportTitle: {
    color: "#173B25",
    fontSize: 14,
    fontWeight: "900",
  },
  supportText: {
    marginTop: 6,
    color: "#4F6B58",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  languageCard: {
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9DEC9",
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  languageSubtitle: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  languageOptions: {
    marginTop: 13,
    gap: 9,
  },
  languageOption: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E5DED3",
    backgroundColor: "#FFFEFB",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  languageOptionActive: {
    borderColor: "#F5B700",
    backgroundColor: "#FFF8E5",
  },
  languageText: {
    color: "#10213A",
    fontSize: 14,
    fontWeight: "900",
  },
  languageTextActive: {
    color: "#7A5600",
  },
  restartText: {
    marginTop: 10,
    color: "#9A6C00",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  guestHero: {
    alignItems: "center",
    marginBottom: 18,
  },
  guestAvatar: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0BF",
    borderWidth: 1,
    borderColor: "#F3D26D",
  },
  guestTitle: {
    marginTop: 16,
    color: "#10213A",
    fontSize: 28,
    fontWeight: "900",
  },
  guestSubtitle: {
    marginTop: 8,
    maxWidth: 310,
    color: "#64748B",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E9DEC9",
    backgroundColor: "#FFFFFF",
    padding: 17,
  },
  cardTitle: {
    color: "#10213A",
    fontSize: 18,
    fontWeight: "900",
  },
  cardText: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  guestActions: {
    marginTop: 15,
    gap: 10,
  },
});
