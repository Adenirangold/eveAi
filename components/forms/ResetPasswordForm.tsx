import { useResetPasswordConfirm } from "@/hooks/useAuth";
import { resetPasswordSchema } from "@/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import Toast from "react-native-toast-message";
import z from "zod";
import FormError from "../FormError";
import FormTextInput from "../FormTextInput";
import CustomButton from "../custom-button";

const ResetPasswordForm = () => {
  type ForgetPasswordData = z.infer<typeof resetPasswordSchema>;
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const resetMutation = useResetPasswordConfirm();

  const { control, handleSubmit } = useForm<ForgetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const errorMessage = resetMutation.error?.message ?? "";

  const onSubmit = (data: ForgetPasswordData) => {
    resetMutation.mutate(
      { email: email!, otp: otp!, newPassword: data.password },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Password Reset",
            text2: "Your password has been reset successfully",
          });
          router.replace("/(auth)/sign-in");
        },
      },
    );
  };
  return (
    <View className="gap-10">
      <FormTextInput
        control={control}
        name="password"
        label="New Password"
        placeholder="Enter your new password"
        secureTextEntry={true}
      />
      <FormTextInput
        control={control}
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Confirm your new password"
        secureTextEntry={true}
      />

      <FormError message={errorMessage} />
      <CustomButton
        title="Reset Password"
        rounded="full"
        loading={resetMutation.isPending}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
};

export default ResetPasswordForm;
