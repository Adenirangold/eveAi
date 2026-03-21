import BackButton from "@/components/BackButton";
import Background from "@/components/BackGround";
import Header from "@/components/Header";
import LoginForm from "@/components/forms/LoginForm";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignIn = () => {
  const isDark = useColorScheme() === "dark";
  const { isLargeFormFactor, contentMaxWidth } = useResponsiveLayout();

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
              title="Log in to your account"
              subtitle="Welcome back! Please enter your details"
            />
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-10 flex-grow"
            >
              <LoginForm />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
};

export default SignIn;
