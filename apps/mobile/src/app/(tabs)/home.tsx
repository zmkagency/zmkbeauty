import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  RefreshControl, Dimensions, FlatList, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { colors, radius, shadow } from "@/constants/theme";
import api from "@/lib/api";

const { width } = Dimensions.get("window");

interface HomeData {
  user: {
    firstName: string;
    loyaltyPoints?: number;
    loyaltyTier?: string;
  };
  upcomingAppointments: Array<{
    id: string;
    date: string;
    startTime: string;
    status: string;
    service: { name: string; duration: number };
    employee?: { firstName: string; lastName: string };
    tenant: { id: string; name: string; slug: string; city?: string };
  }>;
  featuredSalons: Array<{
    id: string;
    name: string;
    slug: string;
    logo?: string;
    coverImage?: string;
    city?: string;
    rating?: number;
    reviewCount?: number;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

const DEFAULT_CATEGORIES = [
  { id: "hair", name: "Saç", icon: "cut-outline" },
  { id: "nail", name: "Tırnak", icon: "hand-left-outline" },
  { id: "skin", name: "Cilt Bakım", icon: "water-outline" },
  { id: "makeup", name: "Makyaj", icon: "color-palette-outline" },
  { id: "massage", name: "Masaj", icon: "body-outline" },
  { id: "all", name: "Tümü", icon: "grid-outline" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery<HomeData>({
    queryKey: ["mobile-home"],
    queryFn: async () => {
      const { data } = await api.get("/mobile/home");
      return data;
    },
  });

  const loyaltyTier = data?.user?.loyaltyTier || "BRONZE";
  const loyaltyPoints = data?.user?.loyaltyPoints ?? 0;
  const categories = data?.categories?.length ? data.categories : DEFAULT_CATEGORIES;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>{data?.user.firstName || user?.firstName} 👋</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* Loyalty Card */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.brand, colors.brandDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.loyaltyCard, shadow.lg]}
          >
            <View style={styles.loyaltyTop}>
              <View>
                <Text style={styles.loyaltyLabel}>Sadakat Puanınız</Text>
                <Text style={styles.loyaltyPoints}>{loyaltyPoints.toLocaleString("tr-TR")}</Text>
              </View>
              <View style={styles.tierBadge}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.tierText}>{loyaltyTier}</Text>
              </View>
            </View>
            <View style={styles.loyaltyBottom}>
              <Text style={styles.loyaltyHint}>İndirim kodları için tıklayın</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="search"
            label="Salon Ara"
            onPress={() => router.push("/(tabs)/explore")}
          />
          <QuickAction
            icon="calendar-outline"
            label="Randevularım"
            onPress={() => router.push("/(tabs)/appointments")}
          />
          <QuickAction
            icon="gift-outline"
            label="Kampanyalar"
            onPress={() => router.push("/(tabs)/explore")}
          />
          <QuickAction
            icon="time-outline"
            label="Geçmiş"
            onPress={() => router.push("/(tabs)/appointments")}
          />
        </View>

        {/* Upcoming Appointment */}
        {data?.upcomingAppointments?.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yaklaşan Randevu</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/appointments")}>
                <Text style={styles.sectionLink}>Tümü</Text>
              </TouchableOpacity>
            </View>
            <AppointmentCard
              appointment={data.upcomingAppointments[0]}
              onPress={() => router.push("/(tabs)/appointments")}
            />
          </View>
        ) : null}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>
          <View style={styles.categories}>
            {categories.slice(0, 6).map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryItem}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={cat.icon as any} size={22} color={colors.brand} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Salons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popüler Salonlar</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
              <Text style={styles.sectionLink}>Tümü</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={data?.featuredSalons || []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => (
              <SalonCard
                salon={item}
                onPress={() => router.push(`/store/${item.slug}`)}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Henüz öne çıkan salon yok</Text>
            }
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: any; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.qaItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.qaIcon}>
        <Ionicons name={icon} size={22} color={colors.brand} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function AppointmentCard({ appointment, onPress }: { appointment: any; onPress?: () => void }) {
  const date = new Date(appointment.date);
  const timeStr = appointment.startTime || "";

  return (
    <TouchableOpacity style={[styles.appointmentCard, shadow.sm]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.appointmentDate}>
        <Text style={styles.appointmentDay}>{date.getDate()}</Text>
        <Text style={styles.appointmentMonth}>
          {date.toLocaleDateString("tr-TR", { month: "short" })}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.appointmentService}>{appointment.service?.name}</Text>
        <Text style={styles.appointmentTenant}>{appointment.tenant?.name}</Text>
        <View style={styles.appointmentMeta}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.appointmentMetaText}>{timeStr}</Text>
          {appointment.employee && (
            <>
              <Ionicons name="person-outline" size={13} color={colors.textMuted} style={{ marginLeft: 8 }} />
              <Text style={styles.appointmentMetaText}>
                {appointment.employee.firstName} {appointment.employee.lastName}
              </Text>
            </>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

function SalonCard({ salon, onPress }: { salon: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.salonCard, shadow.sm]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.salonCover}>
        {salon.coverImage ? (
          <Image source={{ uri: salon.coverImage }} style={styles.salonCoverImg} />
        ) : (
          <LinearGradient
            colors={[colors.brandLight, "#FFB6C1"]}
            style={styles.salonCoverImg}
          />
        )}
        <View style={styles.salonLogoWrap}>
          {salon.logo ? (
            <Image source={{ uri: salon.logo }} style={styles.salonLogoImg} />
          ) : (
            <Ionicons name="storefront" size={20} color={colors.brand} />
          )}
        </View>
      </View>
      <View style={styles.salonInfo}>
        <Text numberOfLines={1} style={styles.salonName}>{salon.name}</Text>
        <View style={styles.salonMeta}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.salonLocation} numberOfLines={1}>{salon.city || "Türkiye"}</Text>
        </View>
        {salon.rating && (
          <View style={styles.salonRating}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.ratingText}>
              {Number(salon.rating).toFixed(1)} ({salon.reviewCount || 0})
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSoft },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingTop: 8 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greeting: { fontSize: 14, color: colors.textMuted },
  userName: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 2 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
    ...shadow.sm,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },

  loyaltyCard: {
    marginHorizontal: 20,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 20,
  },
  loyaltyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  loyaltyLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 4 },
  loyaltyPoints: { color: "#fff", fontSize: 32, fontWeight: "700" },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tierText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  loyaltyBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  loyaltyHint: { color: "rgba(255,255,255,0.9)", fontSize: 12 },

  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  qaItem: { flex: 1, alignItems: "center" },
  qaIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
    ...shadow.sm,
  },
  qaLabel: { fontSize: 11, color: colors.text, fontWeight: "500", textAlign: "center" },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.text, paddingHorizontal: 20 },
  sectionLink: { color: colors.brand, fontSize: 13, fontWeight: "600" },

  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: radius.lg,
    gap: 14,
  },
  appointmentDate: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
  },
  appointmentDay: { fontSize: 18, fontWeight: "700", color: colors.brand, lineHeight: 20 },
  appointmentMonth: { fontSize: 10, color: colors.brand, fontWeight: "600", textTransform: "uppercase" },
  appointmentService: { fontSize: 15, fontWeight: "600", color: colors.text },
  appointmentTenant: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  appointmentMeta: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 },
  appointmentMetaText: { fontSize: 12, color: colors.textMuted },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryItem: { width: (width - 40 - 24) / 3, alignItems: "center" },
  categoryIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
    ...shadow.sm,
  },
  categoryName: { fontSize: 12, color: colors.text, fontWeight: "500", textAlign: "center" },

  salonCard: {
    width: 220,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  salonCover: { width: "100%", height: 110, backgroundColor: colors.brandLight, position: "relative" },
  salonCoverImg: { width: "100%", height: "100%" },
  salonLogoWrap: {
    position: "absolute",
    bottom: -16,
    left: 12,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.bg,
    ...shadow.sm,
  },
  salonLogoImg: { width: "100%", height: "100%", borderRadius: 10 },
  salonInfo: { padding: 14, paddingTop: 22 },
  salonName: { fontSize: 14, fontWeight: "700", color: colors.text },
  salonMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  salonLocation: { fontSize: 12, color: colors.textMuted },
  salonRating: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  ratingText: { fontSize: 12, color: colors.text, fontWeight: "500" },

  emptyText: { color: colors.textMuted, fontSize: 13, paddingHorizontal: 20 },
});
