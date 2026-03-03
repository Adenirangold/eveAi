import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import ResetPasswordForm from "@/components/forms/ResetPasswordForm";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ResetPassword = () => {
  const isDark = useColorScheme() === "dark";

  return (
    <SafeAreaView
      className="flex-1 px-5"
      style={{ backgroundColor: isDark ? "#0A0A0B" : "#F5F3FF" }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <BackButton />
        <Header
          title="Reset Password"
          subtitle="Enter your new password to reset your password."
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10 flex-grow"
        >
          <ResetPasswordForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPassword;
