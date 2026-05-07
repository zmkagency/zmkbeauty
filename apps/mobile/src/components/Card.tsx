import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { colors, radius, shadow } from "@/constants/theme";

interface Props extends ViewProps {
  variant?: "default" | "elevated" | "bordered";
}

export function Card({ variant = "default", style, children, ...props }: Props) {
  return (
    <View
      {...props}
      style={[
        styles.base,
        variant === "elevated" && shadow.md,
        variant === "bordered" && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#FFF",
    borderRadius: radius.lg,
    padding: 16,
  },
});
