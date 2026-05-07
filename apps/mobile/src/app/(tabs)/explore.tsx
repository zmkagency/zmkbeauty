import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  TextInput, FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { colors, radius, shadow } from "@/constants/theme";
import api from "@/lib/api";

const FILTERS = [
  { id: "all", label: "Tümü" },
  { id: "hair", label: "Saç" },
  { id: "nail", label: "Tırnak" },
  { id: "skin", label: "Cilt" },
  { id: "makeup", label: "Makyaj" },
  { id: "massage", label: "Masaj" },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: salons = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["explore-salons", search, activeFilter],
    queryFn: async () => {
      const params: any = { isActive: "true" };
      if (search) params.search = search;
      if (activeFilter !== "all") params.category = activeFilter;
      const { data } = await api.get("/tenants", { params });
      return data as any[];
    },
  });

  const filtered = useMemo(() => salons, [salons]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Keşfet</Text>
        <Text style={styles.subtitle}>Yanındaki en iyi salonları bul</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Salon, hizmet veya şehir ara..."
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setActiveFilter(f.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />
          }
          renderItem={({ item }) => (
            <SalonListItem
              salon={item}
              onPress={() => router.push(`/store/${item.slug}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>Salon bulunamadı</Text>
              <Text style={styles.emptyText}>
                {search ? "Aramanıza uygun salon yok" : "Yakında yeni salonlar eklenecek"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SalonListItem({ salon, onPress }: { salon: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.salonItem, shadow.sm]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.salonCover}>
        {salon.coverImage ? (
          <Image source={{ uri: salon.coverImage }} style={styles.coverImg} />
        ) : (
          <LinearGradient colors={[colors.brandLight, "#FFB6C1"]} style={styles.coverImg} />
        )}
        {salon.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={styles.featuredText}>ÖNE ÇIKAN</Text>
          </View>
        )}
      </View>
      <View style={styles.salonBody}>
        <View style={styles.salonLogo}>
          {salon.logo ? (
            <Image source={{ uri: salon.logo }} style={styles.logoImg} />
          ) : (
            <Ionicons name="storefront" size={18} color={colors.brand} />
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.salonName} numberOfLines={1}>{salon.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {salon.city || "Türkiye"}{salon.district ? `, ${salon.district}` : ""}
            </Text>
          </View>
          <View style={styles.metaRow}>
            {salon.rating ? (
              <>
                <Ionicons name="star" size={12} color={colors.warning} />
                <Text style={styles.ratingText}>
                  {Number(salon.rating).toFixed(1)} ({salon.reviewCount || 0})
                </Text>
              </>
            ) : (
              <Text style={styles.newBadge}>Yeni</Text>
            )}
            {salon.priceRange && (
              <Text style={[styles.metaText, { marginLeft: 8 }]}>{salon.priceRange}</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSoft },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: 10,
    ...shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },

  filters: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.bg,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: colors.brand },
  filterText: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "600" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  salonItem: { backgroundColor: colors.bg, borderRadius: radius.lg, marginBottom: 14, overflow: "hidden" },
  salonCover: { width: "100%", height: 140, position: "relative" },
  coverImg: { width: "100%", height: "100%" },
  featuredBadge: {
    position: "absolute",
    top: 10, left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  featuredText: { color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },

  salonBody: { flexDirection: "row", alignItems: "center", padding: 14 },
  salonLogo: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  salonName: { fontSize: 15, fontWeight: "700", color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, color: colors.textMuted, flexShrink: 1 },
  ratingText: { fontSize: 12, color: colors.text, fontWeight: "500" },
  newBadge: { fontSize: 11, color: colors.success, fontWeight: "600" },

  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
});
