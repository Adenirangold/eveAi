import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import OTPInput from "@/components/OtpInput";
import CustomButton from "@/components/custom-button";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResetPassword } from "@/hooks/useAuth";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const RESEND_COOLDOWN = 60;

const VerifyOTP = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const isDark = useColorScheme() === "dark";
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendMutation = useResetPassword();

  const startTimer = useCallback(() => {
    setSecondsLeft(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const handleResend = () => {
    if (secondsLeft > 0) return;
    resendMutation.mutate(
      { email: email! },
      {
        onSuccess: () => {
          startTimer();
          Toast.show({
            type: "success",
            text1: "Code Resent",
            text2: "A new OTP has been sent to your email",
          });
        },
        onError: (error) => {
          Toast.show({
            type: "error",
            text1: "Resend Failed",
            text2: error.message || "Failed to resend code",
          });
        },
      },
    );
  };

  const handleVerify = () => {
    if (otp.length < 4) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter the complete OTP code",
      });
      return;
    }
    router.push({
      pathname: "/(auth)/reset-password",
      params: { email, otp },
    });
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const subtextColor = isDark ? "#E5E5E5" : "#6B7280";

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
          title="Verify OTP"
          subtitle={`Enter the code sent to ${email || "your email"} to verify your email address.`}
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-10 flex-grow"
        >
          <OTPInput value={otp} onChange={setOtp} />

          <View className="mt-4 flex-row items-center justify-center">
            <Text
              className="font-Outfit text-sm"
              style={{ color: subtextColor }}
            >
              Didn't receive the code?{" "}
            </Text>
            <Pressable
              onPress={handleResend}
              disabled={secondsLeft > 0 || resendMutation.isPending}
              className="flex-row items-center gap-1.5"
            >
              {resendMutation.isPending ? (
                <>
                  <ActivityIndicator size="small" color="#6C56FF" />
                  <Text className="font-OutfitSemiBold text-sm text-primary-primary">
                    Sending...
                  </Text>
                </>
              ) : (
                <Text
                  className={`font-OutfitSemiBold text-sm ${
                    secondsLeft > 0
                      ? "text-gray-500"
                      : "text-primary-primary"
                  }`}
                >
                  {secondsLeft > 0
                    ? `Resend in ${formatTime(secondsLeft)}`
                    : "Resend"}
                </Text>
              )}
            </Pressable>
          </View>

          <View className="mt-10">
            <CustomButton
              title="Continue"
              rounded="full"
              onPress={handleVerify}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOTP;
