import BackButton from "@/components/BackButton";
import Background from "@/components/BackGround";
import FormError from "@/components/FormError";
import FormTextInput from "@/components/FormTextInput";
import Header from "@/components/Header";
import CustomButton from "@/components/custom-button";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import { useChangePassword } from "@/hooks/useAuth";
import { changePasswordSchema } from "@/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { z } from "zod";

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function ChangePassword() {
  const isDark = useColorScheme() === "dark";
  const { isLargeFormFactor, contentMaxWidth } = useResponsiveLayout();
  const changePassword = useChangePassword();

  const { control, handleSubmit } = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const errorMessage = changePassword.error?.message ?? "";

  const onSubmit = (data: ChangePasswordData) => {
    changePassword.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Password Updated",
            text2: "Your password has been changed successfully.",
          });
          router.back();
        },
      },
    );
  };

  return (
    <Background>
      <SafeAreaView
        className="flex-1 px-5"
        // style={{ backgroundColor: isDark ? "#0A0A0B" : "#F5F3FF" }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View
            style={
              isLargeFormFactor && contentMaxWidth != null
                ? {
                    flex: 1,
                    width: "100%",
                    maxWidth: contentMaxWidth,
                    alignSelf: "center",
                  }
                : { flex: 1 }
            }
          >
            <BackButton />
            <Header
              title="Change Password"
              subtitle="Enter your current password and choose a new one."
            />
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-10 flex-grow"
            >
              <View className="flex-1 gap-5">
                <FormTextInput
                  control={control}
                  name="currentPassword"
                  label="Current Password"
                  placeholder="Enter your current password"
                  secureTextEntry
                />
                <FormTextInput
                  control={control}
                  name="newPassword"
                  label="New Password"
                  placeholder="Enter your new password"
                  secureTextEntry
                />
                <FormTextInput
                  control={control}
                  name="confirmNewPassword"
                  label="Confirm New Password"
                  placeholder="Confirm your new password"
                  secureTextEntry
                />

                <View className="mt-6">
                  <FormError message={errorMessage} />
                  <CustomButton
                    title="Update Password"
                    rounded="full"
                    loading={changePassword.isPending}
                    onPress={handleSubmit(onSubmit)}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}
