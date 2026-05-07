import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radius, shadow } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
}

export function Button({
  label, onPress, variant = "primary", size = "md",
  loading, disabled, icon, fullWidth = true, haptic = true,
}: Props) {
  const handlePress = () => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const bgColor = {
    primary: colors.brand,
    secondary: colors.text,
    ghost: "transparent",
    outline: "transparent",
  }[variant];

  const textColor = {
    primary: "#fff",
    secondary: "#fff",
    ghost: colors.brand,
    outline: colors.text,
  }[variant];

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 15 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 16 },
  }[size];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          alignSelf: fullWidth ? "stretch" : "auto",
          opacity: disabled ? 0.5 : 1,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: variant === "outline" ? colors.border : "transparent",
        },
        variant === "primary" && shadow.md,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.text, { color: textColor, fontSize: sizeStyles.fontSize }]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
