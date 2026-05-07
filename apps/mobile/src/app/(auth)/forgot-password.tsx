import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { colors } from "@/constants/theme";
import api from "@/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Geçerli bir e-posta girin");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      // Güvenlik: kullanıcı varlığını ifşa etme — yine de başarılı göster
      setSent(true);
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

          {!sent ? (
            <>
              <View style={styles.iconWrap}>
                <Ionicons name="lock-closed" size={28} color={colors.brand} />
              </View>
              <Text style={styles.title}>Şifreni mi unuttun?</Text>
              <Text style={styles.subtitle}>
                E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Input
                label="E-posta"
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />

              <Button label="Sıfırlama Bağlantısı Gönder" onPress={handleSubmit} loading={loading} size="lg" />

              <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
                <Text style={styles.backLinkText}>Girişe dön</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successWrap}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </View>
              <Text style={styles.title}>E-posta gönderildi</Text>
              <Text style={styles.subtitle}>
                {email} adresine sıfırlama bağlantısı gönderdik. Gelen kutunu kontrol et.
              </Text>
              <View style={{ height: 24 }} />
              <Button label="Girişe dön" onPress={() => router.replace("/(auth)/login")} size="lg" />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24, paddingVertical: 20, flexGrow: 1 },
  back: { padding: 4, marginBottom: 20, alignSelf: "flex-start" },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 22 },
  errorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: colors.error, fontSize: 13 },
  backLink: { alignItems: "center", marginTop: 20 },
  backLinkText: { color: colors.brand, fontSize: 14, fontWeight: "500" },
  successWrap: { alignItems: "center", paddingTop: 40 },
  successIcon: { marginBottom: 20 },
});
