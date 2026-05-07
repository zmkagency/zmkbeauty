import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet, TouchableOpacity, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/constants/theme";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function Input({ label, error, icon, isPassword, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrap,
          { borderColor: error ? colors.error : focused ? colors.brand : colors.border },
        ]}
      >
        {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.iconLeft} />}
        <TextInput
          {...props}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={colors.textLight}
          style={styles.input}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.eye}>
            <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    paddingHorizontal: 12,
  },
  iconLeft: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  eye: { padding: 4 },
  error: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});
