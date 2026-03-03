import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ForgetPassword = () => {
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
          title="Forgot Your Password?"
          subtitle="Enter your email address and we'll send you a code to your email."
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10 flex-grow"
        >
          <ForgotPasswordForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgetPassword;
