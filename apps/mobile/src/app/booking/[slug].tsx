import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { colors, radius, shadow } from "@/constants/theme";
import { Button } from "@/components/Button";
import api from "@/lib/api";

type Step = "service" | "staff" | "datetime" | "confirm";

export default function BookingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: store } = useQuery({
    queryKey: ["store-booking", slug],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/slug/${slug}`);
      return data;
    },
    enabled: !!slug,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: [
      "booking-slots",
      store?.id,
      selectedService?.id,
      selectedStaff?.id,
      selectedDate.toISOString().split("T")[0],
    ],
    queryFn: async () => {
      const { data } = await api.get(`/tenants/${store.id}/slots`, {
        params: {
          serviceId: selectedService.id,
          employeeId: selectedStaff.id,
          date: selectedDate.toISOString().split("T")[0],
        },
      });
      // API returns TimeSlot[] with { startTime, endTime }
      return (data as Array<{ startTime: string; endTime: string }>).map((s) => s.startTime);
    },
    enabled: !!store?.id && !!selectedService && !!selectedStaff && step === "datetime",
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const dateStr = selectedDate.toISOString().split("T")[0];

      const { data } = await api.post("/appointments", {
        tenantId: store.id,
        employeeId: selectedStaff.id,
        serviceId: selectedService.id,
        date: dateStr,
        startTime: selectedTime!,
        notes: notes || undefined,
      });
      return data;
    },
    onSuccess: () => {
      Alert.alert(
        "Randevu Oluşturuldu!",
        "Randevunuz başarıyla oluşturuldu. Randevularım sekmesinden takip edebilirsiniz.",
        [
          {
            text: "Tamam",
            onPress: () => router.replace("/(tabs)/appointments"),
          },
        ],
      );
    },
    onError: (err: any) => {
      Alert.alert("Hata", err.response?.data?.message || "Randevu oluşturulamadı");
    },
  });

  const next7Days = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  if (!store) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} />
      </SafeAreaView>
    );
  }

  const canContinue = () => {
    if (step === "service") return !!selectedService;
    if (step === "staff") return !!selectedStaff;
    if (step === "datetime") return !!selectedTime;
    return true;
  };

  const handleNext = () => {
    if (!canContinue()) return;
    if (step === "service") setStep("staff");
    else if (step === "staff") setStep("datetime");
    else if (step === "datetime") setStep("confirm");
    else if (step === "confirm") bookMutation.mutate();
  };

  const handleBack = () => {
    if (step === "staff") setStep("service");
    else if (step === "datetime") setStep("staff");
    else if (step === "confirm") setStep("datetime");
    else router.back();
  };

  const stepIndex = { service: 0, staff: 1, datetime: 2, confirm: 3 }[step];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{store.name}</Text>
          <Text style={styles.headerSub}>Randevu Al</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {["Hizmet", "Personel", "Tarih", "Onay"].map((label, i) => (
          <React.Fragment key={label}>
            <View style={styles.stepWrap}>
              <View
                style={[
                  styles.stepDot,
                  i <= stepIndex && styles.stepDotActive,
                ]}
              >
                {i < stepIndex ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[
                    styles.stepNum,
                    i <= stepIndex && { color: "#fff" },
                  ]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i <= stepIndex && styles.stepLabelActive]}>
                {label}
              </Text>
            </View>
            {i < 3 && <View style={[styles.stepLine, i < stepIndex && styles.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {step === "service" && (
          <ServiceSelection
            services={store.services || []}
            selected={selectedService}
            onSelect={setSelectedService}
          />
        )}

        {step === "staff" && (
          <StaffSelection
            staff={store.employees || []}
            selected={selectedStaff}
            onSelect={setSelectedStaff}
          />
        )}

        {step === "datetime" && (
          <DateTimeSelection
            days={next7Days}
            selectedDate={selectedDate}
            onSelectDate={(d: Date) => {
              setSelectedDate(d);
              setSelectedTime(null);
            }}
            slots={slots}
            slotsLoading={slotsLoading}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
          />
        )}

        {step === "confirm" && (
          <ConfirmSection
            store={store}
            service={selectedService}
            staff={selectedStaff}
            date={selectedDate}
            time={selectedTime!}
            notes={notes}
            onChangeNotes={setNotes}
          />
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <SafeAreaView edges={["bottom"]}>
          <Button
            label={step === "confirm" ? "Randevuyu Onayla" : "Devam Et"}
            onPress={handleNext}
            loading={bookMutation.isPending}
            disabled={!canContinue()}
            size="lg"
          />
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
}

function ServiceSelection({
  services,
  selected,
  onSelect,
}: { services: any[]; selected: any; onSelect: (s: any) => void }) {
  if (!services.length) {
    return <Text style={styles.emptyText}>Henüz hizmet yok</Text>;
  }
  return (
    <View>
      <Text style={styles.sectionTitle}>Hangi hizmeti istiyorsunuz?</Text>
      {services.map((svc) => {
        const active = selected?.id === svc.id;
        return (
          <TouchableOpacity
            key={svc.id}
            onPress={() => onSelect(svc)}
            style={[
              styles.optionCard,
              shadow.sm,
              active && styles.optionCardActive,
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{svc.name}</Text>
              {svc.description && (
                <Text style={styles.optionSub} numberOfLines={2}>{svc.description}</Text>
              )}
              <View style={styles.optionMeta}>
                <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                <Text style={styles.optionMetaText}>{svc.duration} dk</Text>
              </View>
            </View>
            <View>
              <Text style={styles.optionPrice}>
                {Number(svc.price).toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                  minimumFractionDigits: 0,
                })}
              </Text>
              {active && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.brand}
                  style={{ marginTop: 6, alignSelf: "flex-end" }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StaffSelection({
  staff,
  selected,
  onSelect,
}: { staff: any[]; selected: any; onSelect: (s: any) => void }) {
  if (!staff.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="people-outline" size={40} color={colors.textLight} />
        <Text style={styles.emptyText}>Personel bulunamadı</Text>
      </View>
    );
  }
  return (
    <View>
      <Text style={styles.sectionTitle}>Personel seçin</Text>
      <Text style={styles.sectionSub}>Randevunuz için bir personel seçin</Text>

      {staff.map((s) => {
        const active = selected?.id === s.id;
        return (
          <TouchableOpacity
            key={s.id}
            onPress={() => onSelect(s)}
            style={[
              styles.optionCard,
              shadow.sm,
              active && styles.optionCardActive,
            ]}
          >
            <View style={styles.staffAvatar}>
              {s.avatar ? (
                <Text style={styles.staffInitial}>
                  {s.firstName?.[0]?.toUpperCase()}
                </Text>
              ) : (
                <Text style={styles.staffInitial}>
                  {s.firstName?.[0]?.toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.optionTitle}>{s.firstName} {s.lastName}</Text>
              {s.title && <Text style={styles.optionSub}>{s.title}</Text>}
            </View>
            {active && (
              <Ionicons name="checkmark-circle" size={22} color={colors.brand} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function DateTimeSelection({
  days,
  selectedDate,
  onSelectDate,
  slots,
  slotsLoading,
  selectedTime,
  onSelectTime,
}: any) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Tarih seçin</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
      >
        {days.map((day: Date) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          return (
            <TouchableOpacity
              key={day.toISOString()}
              onPress={() => onSelectDate(day)}
              style={[styles.dayCard, shadow.sm, isSelected && styles.dayCardActive]}
            >
              <Text style={[styles.dayName, isSelected && { color: "#fff" }]}>
                {day.toLocaleDateString("tr-TR", { weekday: "short" })}
              </Text>
              <Text style={[styles.dayNum, isSelected && { color: "#fff" }]}>
                {day.getDate()}
              </Text>
              <Text style={[styles.dayMonth, isSelected && { color: "#fff" }]}>
                {day.toLocaleDateString("tr-TR", { month: "short" })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Saat seçin</Text>

      {slotsLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 20 }} />
      ) : slots.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={40} color={colors.textLight} />
          <Text style={styles.emptyText}>Bu tarihte uygun slot yok</Text>
          <Text style={styles.emptySub}>Başka bir tarih seçmeyi deneyin</Text>
        </View>
      ) : (
        <View style={styles.slotsGrid}>
          {slots.map((time: string) => {
            const active = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                onPress={() => onSelectTime(time)}
                style={[
                  styles.slot,
                  shadow.sm,
                  active && styles.slotActive,
                ]}
              >
                <Text style={[styles.slotText, active && { color: "#fff" }]}>{time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ConfirmSection({
  store,
  service,
  staff,
  date,
  time,
  notes,
  onChangeNotes,
}: any) {
  const dateStr = date.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <View>
      <Text style={styles.sectionTitle}>Randevu Özeti</Text>

      <View style={[styles.summaryCard, shadow.md]}>
        <View style={styles.summaryRow}>
          <Ionicons name="storefront-outline" size={18} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Salon</Text>
            <Text style={styles.summaryValue}>{store.name}</Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Ionicons name="cut-outline" size={18} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Hizmet</Text>
            <Text style={styles.summaryValue}>{service.name}</Text>
            <Text style={styles.summarySub}>{service.duration} dk</Text>
          </View>
          <Text style={styles.summaryPrice}>
            {Number(service.price).toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
              minimumFractionDigits: 0,
            })}
          </Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Ionicons name="person-outline" size={18} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Personel</Text>
            <Text style={styles.summaryValue}>
              {staff.firstName} {staff.lastName}
            </Text>
          </View>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Tarih & Saat</Text>
            <Text style={styles.summaryValue}>{dateStr}</Text>
            <Text style={styles.summarySub}>{time}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Notlarınız (opsiyonel)</Text>
      <TextInput
        value={notes}
        onChangeText={onChangeNotes}
        placeholder="Eklemek istediğiniz bir şey var mı?"
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
        style={styles.notesInput}
      />

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Toplam Tutar</Text>
        <Text style={styles.totalValue}>
          {Number(service.price).toLocaleString("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 0,
          })}
        </Text>
      </View>

      <Text style={styles.policy}>
        Randevunuzu en az 2 saat önceden iptal edebilirsiniz.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgSoft },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  headerSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  progress: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepWrap: { alignItems: "center" },
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.bgSoft,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  stepNum: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  stepLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4, fontWeight: "500" },
  stepLabelActive: { color: colors.brand, fontWeight: "700" },
  stepLine: {
    flex: 1, height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  stepLineActive: { backgroundColor: colors.brand },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 8 },
  sectionSub: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },

  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardActive: { borderColor: colors.brand, backgroundColor: colors.brandLight + "40" },
  optionTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  optionSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  optionMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  optionMetaText: { fontSize: 11, color: colors.textMuted },
  optionPrice: { fontSize: 15, fontWeight: "700", color: colors.brand },

  staffAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brandLight,
    alignItems: "center", justifyContent: "center",
  },
  staffInitial: { fontSize: 16, fontWeight: "700", color: colors.brand },

  dayCard: {
    width: 64,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: radius.md,
  },
  dayCardActive: { backgroundColor: colors.brand },
  dayName: { fontSize: 11, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase" },
  dayNum: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 2 },
  dayMonth: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  slot: {
    width: "23%",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  slotActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  slotText: { fontSize: 13, fontWeight: "600", color: colors.text },

  summaryCard: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  summaryDivider: { height: 1, backgroundColor: colors.border },
  summaryLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: 14, color: colors.text, fontWeight: "600", marginTop: 2 },
  summarySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  summaryPrice: { fontSize: 15, fontWeight: "700", color: colors.brand },

  notesInput: {
    backgroundColor: colors.bg,
    padding: 14,
    borderRadius: radius.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.brandLight + "60",
    borderRadius: radius.md,
    marginTop: 20,
  },
  totalLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  totalValue: { fontSize: 20, fontWeight: "700", color: colors.brand },
  policy: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16,
  },

  empty: { alignItems: "center", paddingVertical: 40, gap: 6 },
  emptyText: { fontSize: 14, color: colors.textMuted, fontWeight: "500" },
  emptySub: { fontSize: 12, color: colors.textLight },

  bottom: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
