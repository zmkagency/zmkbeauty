import React, { useRef, useState } from "react";
import {
  View, Text, Image, Dimensions, FlatList, StyleSheet,
  TouchableOpacity, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/lib/auth";
import { colors, radius, shadow } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    title: "Güzellik artık\nceplerinizde",
    description: "Türkiye'nin en kapsamlı güzellik platformu. 7/24 randevu, online ödeme, sadakat puanları — hepsi tek uygulamada.",
    bg: ["#fff1f2", "#ffe4e6"] as const,
    icon: "sparkles",
  },
  {
    title: "Favori salonunuz\nhep yanınızda",
    description: "En sevdiğiniz salonları takip edin, randevu alın, puanlarınızı biriktirin. Hiç düşünmeden.",
    bg: ["#fdf4ff", "#fae8ff"] as const,
    icon: "heart",
  },
  {
    title: "Hemen başlayın,\nsiz de kazanın",
    description: "Her randevuda puan kazanın, paket indirimlerini yakalayın, hediye kartlarını kullanın.",
    bg: ["#eff6ff", "#dbeafe"] as const,
    icon: "rocket",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useAuthStore();
  const [index, setIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1 });
    } else {
      await completeOnboarding();
      router.replace("/(auth)/login");
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <LinearGradient
        colors={slides[index].bg}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <TouchableOpacity onPress={handleSkip} style={styles.skip}>
          <Text style={styles.skipText}>Geç</Text>
        </TouchableOpacity>

        <Animated.FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(idx);
          }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={72} color={colors.brand} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.description}</Text>
            </View>
          )}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={i}
                  style={[styles.dot, { width: dotWidth, opacity }]}
                />
              );
            })}
          </View>

          <Button
            label={index === slides.length - 1 ? "Başlayalım" : "Devam Et"}
            onPress={handleNext}
            size="lg"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  skip: {
    alignSelf: "flex-end",
    padding: 20,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "500",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 48,
    ...shadow.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    height: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginHorizontal: 4,
  },
});
