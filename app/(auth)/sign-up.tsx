import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import SigupForm from "@/components/forms/SigupForm";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignUp = () => {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B] px-5">
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
          <SigupForm></SigupForm>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
