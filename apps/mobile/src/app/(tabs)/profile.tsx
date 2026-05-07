import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/lib/auth";
import { colors, radius, shadow } from "@/constants/theme";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  subtitle?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Hesap",
      items: [
        {
          icon: "person-outline",
          label: "Kişisel Bilgiler",
          onPress: () => Alert.alert("Yakında", "Bu özellik yakında gelecek"),
        },
        {
          icon: "lock-closed-outline",
          label: "Şifre Değiştir",
          onPress: () => Alert.alert("Yakında", "Bu özellik yakında gelecek"),
        },
        {
          icon: "notifications-outline",
          label: "Bildirimler",
          onPress: () => Alert.alert("Yakında", "Bu özellik yakında gelecek"),
        },
      ],
    },
    {
      title: "Sadakat",
      items: [
        {
          icon: "star-outline",
          label: "Puanlarım",
          subtitle: "İndirim kodlarını görüntüle",
          onPress: () => Alert.alert("Yakında", "Bu özellik yakında gelecek"),
        },
        {
          icon: "gift-outline",
          label: "Kampanyalar",
          onPress: () => router.push("/(tabs)/explore"),
        },
        {
          icon: "ribbon-outline",
          label: "Özel Tekliflerim",
          onPress: () => Alert.alert("Yakında", "Bu özellik yakında gelecek"),
        },
      ],
    },
    {
      title: "Destek",
      items: [
        {
          icon: "help-circle-outline",
          label: "Yardım ve Destek",
          onPress: () => Linking.openURL("mailto:destek@zmkbeauty.com"),
        },
        {
          icon: "document-text-outline",
          label: "Kullanım Şartları",
          onPress: () => Linking.openURL("https://zmkbeauty.com/terms"),
        },
        {
          icon: "shield-checkmark-outline",
          label: "Gizlilik Politikası",
          onPress: () => Linking.openURL("https://zmkbeauty.com/privacy"),
        },
      ],
    },
    {
      title: "",
      items: [
        {
          icon: "log-out-outline",
          label: "Çıkış Yap",
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();
  const loyaltyPoints = (user as any)?.loyaltyPoints ?? 0;
  const loyaltyTier = (user as any)?.loyaltyTier || "BRONZE";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={[colors.brand, colors.brandDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || "U"}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {user?.tenant && (
            <View style={styles.tenantChip}>
              <Ionicons name="storefront" size={12} color="#fff" />
              <Text style={styles.tenantText}>{user.tenant.name}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsWrap}>
          <View style={[styles.statCard, shadow.sm]}>
            <Text style={styles.statValue}>{loyaltyPoints.toLocaleString("tr-TR")}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
          <View style={[styles.statCard, shadow.sm]}>
            <Text style={styles.statValue}>{loyaltyTier}</Text>
            <Text style={styles.statLabel}>Seviye</Text>
          </View>
          <View style={[styles.statCard, shadow.sm]}>
            <Ionicons name="gift" size={20} color={colors.brand} />
            <Text style={styles.statLabel}>Ödüller</Text>
          </View>
        </View>

        {/* Menu */}
        {menuSections.map((section, i) => (
          <View key={i} style={styles.section}>
            {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
            <View style={[styles.menuCard, shadow.sm]}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.menuItem,
                    idx !== section.items.length - 1 && styles.menuDivider,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuIcon,
                      item.danger && { backgroundColor: colors.error + "15" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.danger ? colors.error : colors.brand}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.menuLabel,
                        item.danger && { color: colors.error },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.subtitle && (
                      <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                  {!item.danger && (
                    <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.version}>ZMKBeauty v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSoft },

  profileHeader: {
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarWrap: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 12,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: colors.brand },
  userName: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 2 },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  tenantChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 10,
  },
  tenantText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  statsWrap: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -24,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 18, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },

  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
  },
  menuLabel: { fontSize: 14, color: colors.text, fontWeight: "500" },
  menuSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  version: {
    textAlign: "center",
    color: colors.textLight,
    fontSize: 11,
    marginTop: 20,
  },
});
