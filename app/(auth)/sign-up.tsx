import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import SigupForm from "@/components/forms/SigupForm";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignUp = () => {
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
          title="Create an account"
          subtitle="Join EVE AI and start meaningful conversations with Bible characters"
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10 flex-grow"
        >
          <SigupForm />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
