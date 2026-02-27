import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import ResetPasswordForm from "@/components/forms/ResetPasswordForm";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ResetPassword = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B] px-5">
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
