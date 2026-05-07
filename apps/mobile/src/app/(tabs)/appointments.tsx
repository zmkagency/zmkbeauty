import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, radius, shadow } from "@/constants/theme";
import api from "@/lib/api";

type Tab = "upcoming" | "past";

export default function AppointmentsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("upcoming");

  const { data: appointments = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-appointments", tab],
    queryFn: async () => {
      const { data } = await api.get("/mobile/appointments", {
        params: { filter: tab },
      });
      return data as any[];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
  });

  const handleCancel = (id: string) => {
    Alert.alert(
      "Randevuyu İptal Et",
      "Bu randevuyu iptal etmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "İptal Et",
          style: "destructive",
          onPress: () => cancelMutation.mutate(id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Randevularım</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab("upcoming")}
          style={[styles.tab, tab === "upcoming" && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === "upcoming" && styles.tabTextActive]}>
            Yaklaşan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("past")}
          style={[styles.tab, tab === "past" && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === "past" && styles.tabTextActive]}>
            Geçmiş
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brand} />
          }
          renderItem={({ item }) => (
            <AppointmentItem
              appointment={item}
              onCancel={tab === "upcoming" ? () => handleCancel(item.id) : undefined}
              onPress={() => router.push(`/store/${item.tenant?.slug}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyTitle}>
                {tab === "upcoming" ? "Yaklaşan randevunuz yok" : "Geçmiş randevunuz yok"}
              </Text>
              <Text style={styles.emptyText}>
                Yeni bir randevu almak için salonları keşfedin
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push("/(tabs)/explore")}
              >
                <Text style={styles.exploreBtnText}>Salonları Keşfet</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function AppointmentItem({
  appointment,
  onCancel,
  onPress,
}: {
  appointment: any;
  onCancel?: () => void;
  onPress?: () => void;
}) {
  const date = new Date(appointment.date);
  const dateStr = date.toLocaleDateString("tr-TR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = appointment.startTime || "";

  const statusColor = {
    PENDING_PAYMENT: colors.warning,
    CONFIRMED: colors.success,
    IN_PROGRESS: colors.brand,
    CANCELLED: colors.error,
    COMPLETED: colors.textMuted,
    NO_SHOW: colors.error,
  }[appointment.status as string] || colors.textMuted;

  const statusLabel = {
    PENDING_PAYMENT: "Ödeme Bekleniyor",
    CONFIRMED: "Onaylandı",
    IN_PROGRESS: "Devam Ediyor",
    CANCELLED: "İptal",
    COMPLETED: "Tamamlandı",
    NO_SHOW: "Gelinmedi",
  }[appointment.status as string] || appointment.status;

  const totalPrice = appointment.totalPrice ?? appointment.service?.price;

  return (
    <TouchableOpacity
      style={[styles.card, shadow.sm]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.cardHeader}>
        <View style={styles.tenantRow}>
          <View style={styles.tenantLogo}>
            <Ionicons name="storefront" size={16} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tenantName} numberOfLines={1}>
              {appointment.tenant?.name}
            </Text>
            <Text style={styles.tenantLocation} numberOfLines={1}>
              {appointment.tenant?.city || "Türkiye"}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.serviceRow}>
        <Ionicons name="cut-outline" size={16} color={colors.textMuted} />
        <Text style={styles.serviceText}>
          {appointment.service?.name}
          {appointment.service?.duration && ` • ${appointment.service.duration} dk`}
        </Text>
      </View>

      <View style={styles.serviceRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.serviceText}>{dateStr}</Text>
      </View>

      <View style={styles.serviceRow}>
        <Ionicons name="time-outline" size={16} color={colors.textMuted} />
        <Text style={styles.serviceText}>{timeStr}</Text>
      </View>

      {appointment.employee && (
        <View style={styles.serviceRow}>
          <Ionicons name="person-outline" size={16} color={colors.textMuted} />
          <Text style={styles.serviceText}>
            {appointment.employee.firstName} {appointment.employee.lastName}
          </Text>
        </View>
      )}

      {totalPrice != null && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Tutar</Text>
          <Text style={styles.priceValue}>
            {Number(totalPrice).toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
              minimumFractionDigits: 0,
            })}
          </Text>
        </View>
      )}

      {onCancel && appointment.status !== "CANCELLED" && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Ionicons name="close-circle-outline" size={16} color={colors.error} />
          <Text style={styles.cancelText}>İptal Et</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSoft },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    marginHorizontal: 20,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 12,
    ...shadow.sm,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.brand },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: "#fff" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  tenantRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  tenantLogo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
  },
  tenantName: { fontSize: 15, fontWeight: "700", color: colors.text },
  tenantLocation: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },

  serviceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  serviceText: { fontSize: 13, color: colors.text },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceLabel: { fontSize: 13, color: colors.textMuted },
  priceValue: { fontSize: 16, fontWeight: "700", color: colors.text },

  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.error + "40",
  },
  cancelText: { color: colors.error, fontSize: 13, fontWeight: "600" },

  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginBottom: 20 },
  exploreBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    marginTop: 12,
  },
  exploreBtnText: { color: "#fff", fontWeight: "600" },
});
