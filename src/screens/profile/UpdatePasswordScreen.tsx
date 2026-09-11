import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Text from "../../components/Text";
import Button from "../../components/Button";
import TextInput from "../../components/TextInput";
import { useAppTheme } from "../../theme/ThemeProvider";
import { useTranslations } from "../../localization/LocalizationProvider";
import { MainStackParamList } from "../../navigation/types";
import { useUpdateRiderPasswordMutation } from "../../hooks/useRiderProfileMutations";

type Navigation = NativeStackNavigationProp<MainStackParamList>;

export default function UpdatePasswordScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations("app");
  const navigation = useNavigation<Navigation>();
  const updatePasswordMutation = useUpdateRiderPasswordMutation();
  const [previousPassword, setPreviousPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home", { screen: "ProfileTab" });
    }
  };

  const onSubmit = async () => {
    if (
      !previousPassword.trim() ||
      !newPassword.trim() ||
      updatePasswordMutation.isPending
    ) {
      return;
    }

    try {
      const response = await updatePasswordMutation.mutateAsync({
        previous_password: previousPassword.trim(),
        new_password: newPassword.trim(),
      });
      setSuccessMessage(response.message);
      handleBack();
    } catch {
      setSuccessMessage("");
      // Mutation error is displayed from state.
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={[styles.backButton, { backgroundColor: theme.colors.gray100 }]}
        >
          <BackIcon color={theme.colors.gray900} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text
          weight="bold"
          style={[styles.title, { color: theme.colors.gray900 }]}
        >
          {t("profile_update_password_title")}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.gray500 }]}>
          {t("profile_update_password_subtitle")}
        </Text>

        <TextInput
          placeholder={t("profile_old_password_placeholder")}
          value={previousPassword}
          onChangeText={(value) => {
            setPreviousPassword(value);
            setSuccessMessage("");
          }}
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.inputWrapper}
        />
        <TextInput
          placeholder={t("profile_new_password_placeholder")}
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            setSuccessMessage("");
          }}
          isPassword
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.inputWrapper}
        />
      </View>
      {updatePasswordMutation.error?.message ? (
        <Text
          variant="caption"
          color={theme.colors.red500}
          style={styles.feedbackText}
        >
          {updatePasswordMutation.error.message}
        </Text>
      ) : null}
      {successMessage ? (
        <Text
          variant="caption"
          color={theme.colors.emerald900}
          style={styles.feedbackText}
        >
          {successMessage}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <Button
          label={t("profile_update_password_button")}
          onPress={onSubmit}
          disabled={
            updatePasswordMutation.isPending ||
            !previousPassword.trim() ||
            !newPassword.trim()
          }
          textColor={theme.colors.gray900}
          containerStyle={styles.updateButton}
        />
      </View>
    </SafeAreaView>
  );
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 64,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    lineHeight: 38,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 0,
  },
  inputWrapper: {
    minHeight: 42,
  },
  footer: {
    marginTop: "auto",
    paddingHorizontal: 16,
    paddingBottom: 34,
    paddingTop: 12,
  },
  updateButton: {
    height: 54,
    borderRadius: 40,
  },
  feedbackText: {
    marginTop: 8,
    textAlign: "center",
  },
});
