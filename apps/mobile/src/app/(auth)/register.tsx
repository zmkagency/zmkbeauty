import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Modal, FlatList, TextInput, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/lib/auth";
import { colors, radius } from "@/constants/theme";
import api from "@/lib/api";
import { registerForPushNotifications } from "@/lib/notifications";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    tenantId: "",
    tenantName: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [salonModalOpen, setSalonModalOpen] = useState(false);
  const [salonSearch, setSalonSearch] = useState("");

  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ["salons-public", salonSearch],
    queryFn: async () => {
      const { data } = await api.get("/tenants", {
        params: { isActive: "true", ...(salonSearch && { search: salonSearch }) },
      });
      return data as any[];
    },
    enabled: salonModalOpen,
  });

  const validate = () => {
    const e: any = {};
    if (!form.firstName) e.firstName = "Ad gerekli";
    if (!form.lastName) e.lastName = "Soyad gerekli";
    if (!form.email) e.email = "E-posta gerekli";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Geçerli e-posta girin";
    if (form.password.length < 6) e.password = "En az 6 karakter";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        tenantId: form.tenantId || undefined,
      });
      registerForPushNotifications().catch(() => {});
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setErrors({ general: err.response?.data?.message || "Kayıt başarısız" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Hesap oluştur</Text>
          <Text style={styles.subtitle}>Binlerce salonun gücüne katılın</Text>

          {errors.general && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Ad"
                value={form.firstName}
                onChangeText={(v) => setForm({ ...form, firstName: v })}
                placeholder="Ayşe"
                error={errors.firstName}
                icon="person-outline"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="Soyad"
                value={form.lastName}
                onChangeText={(v) => setForm({ ...form, lastName: v })}
                placeholder="Yılmaz"
                error={errors.lastName}
              />
            </View>
          </View>

          <Input
            label="E-posta"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Telefon (opsiyonel)"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            placeholder="05xx xxx xx xx"
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <Input
            label="Şifre"
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            placeholder="En az 6 karakter"
            isPassword
            icon="lock-closed-outline"
            error={errors.password}
          />

          {/* Salon seçici */}
          <Text style={styles.fieldLabel}>Favori salonunuz (opsiyonel)</Text>
          <TouchableOpacity
            onPress={() => setSalonModalOpen(true)}
            style={styles.salonPicker}
          >
            <Ionicons name="storefront-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.salonText, !form.tenantName && styles.salonPlaceholder]}>
              {form.tenantName || "Salon seç (atla)"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.helpText}>
            Salonu seçerseniz o salonun müşterisi olarak kaydolursunuz ve puanlarınızı toplamaya başlarsınız.
          </Text>

          <Button label="Kayıt Ol" onPress={handleRegister} loading={loading} size="lg" />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}> Giriş Yapın</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.legal}>
            Devam ederek {" "}
            <Text style={styles.legalLink}>Kullanım Şartları</Text> ve {" "}
            <Text style={styles.legalLink}>Gizlilik Politikası</Text>'nı kabul etmiş olursunuz.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Salon seçme modal */}
      <Modal visible={salonModalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Salon Seç</Text>
            <TouchableOpacity onPress={() => setSalonModalOpen(false)}>
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={salonSearch}
              onChangeText={setSalonSearch}
              placeholder="Salon adı veya şehir ara..."
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
            />
          </View>

          {salonsLoading ? (
            <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={salons}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListHeaderComponent={
                <TouchableOpacity
                  onPress={() => {
                    setForm({ ...form, tenantId: "", tenantName: "" });
                    setSalonModalOpen(false);
                  }}
                  style={styles.skipSalon}
                >
                  <Ionicons name="close-circle-outline" size={22} color={colors.textMuted} />
                  <Text style={styles.skipText}>Şimdi seçme, atla</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setForm({ ...form, tenantId: item.id, tenantName: item.name });
                    setSalonModalOpen(false);
                  }}
                  style={styles.salonItem}
                >
                  <View style={styles.salonLogo}>
                    {item.logo ? (
                      <View style={{ width: "100%", height: "100%", backgroundColor: colors.brandLight, borderRadius: 12 }} />
                    ) : (
                      <Ionicons name="storefront" size={20} color={colors.brand} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.salonName}>{item.name}</Text>
                    <Text style={styles.salonLocation}>
                      {item.city}{item.district ? `, ${item.district}` : ""}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Salon bulunamadı</Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24, paddingVertical: 20 },
  back: { padding: 4, marginBottom: 12, alignSelf: "flex-start" },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: 24 },
  errorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: colors.error, fontSize: 13 },
  row: { flexDirection: "row" },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: colors.text, marginBottom: 6 },
  salonPicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  salonText: { flex: 1, fontSize: 15, color: colors.text },
  salonPlaceholder: { color: colors.textLight },
  helpText: { fontSize: 12, color: colors.textMuted, marginTop: 6, marginBottom: 20, lineHeight: 18 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.brand, fontSize: 14, fontWeight: "600" },
  legal: { fontSize: 11, color: colors.textLight, textAlign: "center", marginTop: 16, lineHeight: 16 },
  legalLink: { color: colors.brand },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgSoft,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  skipSalon: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    marginBottom: 12,
    gap: 10,
  },
  skipText: { color: colors.textMuted, fontSize: 14 },
  salonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  salonLogo: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
  },
  salonName: { fontSize: 15, fontWeight: "600", color: colors.text },
  salonLocation: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  emptyText: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
});
