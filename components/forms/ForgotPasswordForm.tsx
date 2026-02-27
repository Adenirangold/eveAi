import { useResetPassword } from "@/hooks/useAuth";
import { forgetPasswordSchema } from "@/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import z from "zod";
import FormError from "../FormError";
import FormTextInput from "../FormTextInput";
import CustomButton from "../custom-button";

const ForgotPasswordForm = () => {
  type ForgetPasswordData = z.infer<typeof forgetPasswordSchema>;
  const forgotMutation = useResetPassword();

  const { control, handleSubmit } = useForm<ForgetPasswordData>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const errorMessage = forgotMutation.error?.message ?? "";

  const onSubmit = (data: ForgetPasswordData) => {
    forgotMutation.mutate(data, {
      onSuccess: () => {
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { email: data.email },
        });
      },
    });
  };

  return (
    <View className="gap-10">
      <FormTextInput
        control={control}
        name="email"
        label="Email"
        placeholder="Enter your email"
      />
      <FormError message={errorMessage} />
      <CustomButton
        title="Send"
        rounded="full"
        loading={forgotMutation.isPending}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
};

export default ForgotPasswordForm;
