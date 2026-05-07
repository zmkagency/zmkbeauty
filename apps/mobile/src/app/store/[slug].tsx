import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Linking, Dimensions, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { colors, radius, shadow } from "@/constants/theme";
import { Button } from "@/components/Button";
import api from "@/lib/api";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 260;

export default function StoreDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const scrollY = new Animated.Value(0);
  const [activeTab, setActiveTab] = useState<"services" | "about" | "reviews">("services");

  const { data: store, isLoading } = useQuery({
    queryKey: ["store-public", slug],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/slug/${slug}`);
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading || !store) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button */}
      <SafeAreaView style={styles.backWrap} edges={["top"]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Sticky header overlay */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={["top"]}>
          <Text numberOfLines={1} style={styles.stickyTitle}>{store.name}</Text>
        </SafeAreaView>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Cover */}
        <View style={styles.cover}>
          {store.coverImage ? (
            <Image source={{ uri: store.coverImage }} style={styles.coverImg} />
          ) : (
            <LinearGradient colors={[colors.brandLight, "#FFB6C1"]} style={styles.coverImg} />
          )}
        </View>

        {/* Info block */}
        <View style={styles.infoBlock}>
          <View style={styles.logoWrap}>
            {store.logo ? (
              <Image source={{ uri: store.logo }} style={styles.logoImg} />
            ) : (
              <Ionicons name="storefront" size={28} color={colors.brand} />
            )}
          </View>

          <Text style={styles.name}>{store.name}</Text>

          {store.description && (
            <Text style={styles.description}>{store.description}</Text>
          )}

          <View style={styles.metaRow}>
            {store.rating && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text style={styles.metaText}>
                  {Number(store.rating).toFixed(1)}
                  <Text style={styles.metaSub}> ({store.reviewCount || 0})</Text>
                </Text>
              </View>
            )}
            {store.city && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {store.city}{store.district ? `, ${store.district}` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Contact actions */}
          <View style={styles.actionRow}>
            {store.phone && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`tel:${store.phone}`)}
              >
                <Ionicons name="call-outline" size={20} color={colors.brand} />
                <Text style={styles.actionText}>Ara</Text>
              </TouchableOpacity>
            )}
            {store.address && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  Linking.openURL(
                    `https://maps.google.com/?q=${encodeURIComponent(store.address)}`,
                  )
                }
              >
                <Ionicons name="navigate-outline" size={20} color={colors.brand} />
                <Text style={styles.actionText}>Yol Tarifi</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="heart-outline" size={20} color={colors.brand} />
              <Text style={styles.actionText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { id: "services", label: "Hizmetler" },
            { id: "about", label: "Hakkında" },
            { id: "reviews", label: "Yorumlar" },
          ].map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id as any)}
              style={[styles.tab, activeTab === t.id && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === "services" && (
            <ServicesList services={store.services || []} />
          )}
          {activeTab === "about" && (
            <AboutSection store={store} />
          )}
          {activeTab === "reviews" && (
            <ReviewsList reviews={[]} />
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <SafeAreaView edges={["bottom"]}>
          <Button
            label="Randevu Al"
            onPress={() => router.push(`/booking/${slug}`)}
            size="lg"
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

function ServicesList({ services }: { services: any[] }) {
  if (!services.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Henüz hizmet eklenmemiş</Text>
      </View>
    );
  }

  // Group by category
  const grouped = services.reduce((acc: Record<string, any[]>, svc) => {
    const cat = svc.category || "Genel";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

  return (
    <View>
      {Object.entries(grouped).map(([category, items]) => (
        <View key={category} style={{ marginBottom: 20 }}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {items.map((svc) => (
            <View key={svc.id} style={[styles.serviceCard, shadow.sm]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                {svc.description && (
                  <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
                )}
                <View style={styles.serviceMeta}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.serviceMetaText}>{svc.duration} dk</Text>
                </View>
              </View>
              <View style={styles.servicePrice}>
                <Text style={styles.priceValue}>
                  {Number(svc.price).toLocaleString("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    minimumFractionDigits: 0,
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function AboutSection({ store }: { store: any }) {
  return (
    <View>
      {store.description && (
        <View style={styles.aboutBlock}>
          <Text style={styles.aboutTitle}>Hakkımızda</Text>
          <Text style={styles.aboutText}>{store.description}</Text>
        </View>
      )}

      {store.address && (
        <View style={styles.aboutBlock}>
          <Text style={styles.aboutTitle}>Adres</Text>
          <View style={styles.aboutRow}>
            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
            <Text style={styles.aboutText}>{store.address}</Text>
          </View>
        </View>
      )}

      {store.phone && (
        <View style={styles.aboutBlock}>
          <Text style={styles.aboutTitle}>İletişim</Text>
          <View style={styles.aboutRow}>
            <Ionicons name="call-outline" size={16} color={colors.textMuted} />
            <Text style={styles.aboutText}>{store.phone}</Text>
          </View>
          {store.email && (
            <View style={styles.aboutRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <Text style={styles.aboutText}>{store.email}</Text>
            </View>
          )}
        </View>
      )}

      {store.businessHours && (
        <View style={styles.aboutBlock}>
          <Text style={styles.aboutTitle}>Çalışma Saatleri</Text>
          {Object.entries(store.businessHours as Record<string, any>).map(([day, hours]: any) => (
            <View key={day} style={styles.hoursRow}>
              <Text style={styles.dayText}>{formatDay(day)}</Text>
              <Text style={styles.hoursText}>
                {hours.closed ? "Kapalı" : `${hours.open} - ${hours.close}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ReviewsList({ reviews }: { reviews: any[] }) {
  if (!reviews.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="chatbubbles-outline" size={40} color={colors.textLight} />
        <Text style={styles.emptyText}>Henüz yorum yok</Text>
        <Text style={styles.emptySub}>İlk yorumu yapan siz olun</Text>
      </View>
    );
  }

  return (
    <View>
      {reviews.map((r) => (
        <View key={r.id} style={[styles.reviewCard, shadow.sm]}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewAvatar}>
              <Text style={styles.reviewInitial}>
                {r.user?.firstName?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewName}>
                {r.user?.firstName} {r.user?.lastName?.[0]}.
              </Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= r.rating ? "star" : "star-outline"}
                    size={12}
                    color={colors.warning}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.reviewDate}>
              {new Date(r.createdAt).toLocaleDateString("tr-TR")}
            </Text>
          </View>
          <Text style={styles.reviewText}>{r.comment}</Text>
        </View>
      ))}
    </View>
  );
}

function formatDay(day: string) {
  const days: Record<string, string> = {
    monday: "Pazartesi",
    tuesday: "Salı",
    wednesday: "Çarşamba",
    thursday: "Perşembe",
    friday: "Cuma",
    saturday: "Cumartesi",
    sunday: "Pazar",
  };
  return days[day.toLowerCase()] || day;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSoft },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },

  backWrap: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center", justifyContent: "center",
    ...shadow.sm,
  },

  stickyHeader: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    backgroundColor: colors.bg,
    zIndex: 5,
    paddingHorizontal: 60,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stickyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    paddingVertical: 4,
  },

  cover: { width, height: HEADER_HEIGHT, backgroundColor: colors.brandLight },
  coverImg: { width: "100%", height: "100%" },

  infoBlock: {
    backgroundColor: colors.bg,
    marginTop: -30,
    marginHorizontal: 16,
    borderRadius: radius.xl,
    padding: 20,
    ...shadow.md,
  },
  logoWrap: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
    marginTop: -48,
    borderWidth: 4, borderColor: colors.bg,
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  name: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 12 },
  description: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 20 },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: colors.text, fontWeight: "500" },
  metaSub: { color: colors.textMuted, fontWeight: "400" },

  actionRow: { flexDirection: "row", marginTop: 20, gap: 10 },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    gap: 4,
  },
  actionText: { fontSize: 12, color: colors.text, fontWeight: "600" },

  tabs: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: radius.md,
    padding: 4,
    ...shadow.sm,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.brand },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: "#fff" },

  tabContent: { padding: 16 },

  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    marginBottom: 10,
    gap: 12,
  },
  serviceName: { fontSize: 14, fontWeight: "600", color: colors.text },
  serviceDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  serviceMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  serviceMetaText: { fontSize: 11, color: colors.textMuted },
  servicePrice: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.brandLight,
  },
  priceValue: { fontSize: 14, fontWeight: "700", color: colors.brand },

  aboutBlock: { marginBottom: 20 },
  aboutTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 8 },
  aboutText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  aboutRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayText: { fontSize: 13, color: colors.text, fontWeight: "500" },
  hoursText: { fontSize: 13, color: colors.textMuted },

  reviewCard: {
    backgroundColor: colors.bg,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
  },
  reviewInitial: { fontSize: 14, fontWeight: "700", color: colors.brand },
  reviewName: { fontSize: 14, fontWeight: "600", color: colors.text },
  reviewStars: { flexDirection: "row", marginTop: 2, gap: 1 },
  reviewDate: { fontSize: 11, color: colors.textLight },
  reviewText: { fontSize: 13, color: colors.text, lineHeight: 20 },

  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, fontWeight: "500" },
  emptySub: { fontSize: 12, color: colors.textLight },

  bottomCta: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
