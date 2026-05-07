import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/lib/auth";
import { colors } from "@/constants/theme";
import { registerForPushNotifications } from "@/lib/notifications";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "E-posta gerekli";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Geçerli bir e-posta girin";
    if (!password) e.password = "Şifre gerekli";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      // Register push token after login
      registerForPushNotifications().catch(() => {});
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setErrors({ general: err.response?.data?.message || "Giriş başarısız" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logo}>
              <Ionicons name="sparkles" size={32} color={colors.brand} />
            </View>
            <Text style={styles.title}>Hoş geldiniz</Text>
            <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
          </View>

          {errors.general && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <Input
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            placeholder="ornek@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            isPassword
            icon="lock-closed-outline"
            error={errors.password}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            style={styles.forgotWrap}
          >
            <Text style={styles.forgotText}>Şifremi unuttum</Text>
          </TouchableOpacity>

          <Button label="Giriş Yap" onPress={handleLogin} loading={loading} size="lg" />

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabınız yok mu?</Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}> Kaydolun</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 24, paddingVertical: 24, flexGrow: 1, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 32 },
  logo: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textMuted },
  errorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { color: colors.error, fontSize: 13 },
  forgotWrap: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { color: colors.brand, fontSize: 14, fontWeight: "500" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 13, marginHorizontal: 12 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 8 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.brand, fontSize: 14, fontWeight: "600" },
});
