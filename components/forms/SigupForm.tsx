import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSignUp } from "@/hooks/useAuth";
import { signUpSchema } from "@/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import React from "react";
import { useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import FormError from "../FormError";
import FormTextInput from "../FormTextInput";
import GoogleButton from "../GoogleButton";
import CustomButton from "../custom-button";

const SigupForm = () => {
  type SignUpFormData = z.infer<typeof signUpSchema>;
  const signUpMutation = useSignUp();
  const isDark = useColorScheme() === "dark";

  const { control, handleSubmit } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const errorMessage = signUpMutation.error?.message ?? "";

  const onSubmit = (data: SignUpFormData) => {
    signUpMutation.mutate(data, {
      onSuccess: () => {
        router.replace("/(tabs)");
      },
    });
  };

  const bodyColor = isDark ? "#FAFAFA" : "#374151";

  return (
    <View className="flex-1 gap-5">
      <FormTextInput
        control={control}
        name="email"
        label="Email"
        placeholder="Enter your email"
        autoCapitalize="none"
        autoComplete="email"
      />
      <FormTextInput
        control={control}
        name="password"
        label="Password"
        placeholder="Enter your password"
        autoCapitalize="none"
        autoComplete="password"
        secureTextEntry={true}
      />
      <FormError message={errorMessage} />
      <View className="mt-5">
        <CustomButton
          title="Create account"
          rounded="full"
          loading={signUpMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
        <Text
          className="font-Outfit text-sm text-center mt-5"
          style={{ color: bodyColor }}
        >
          Already have an account?{" "}
          <Link
            className="text-primary-primary font-OutfitSemiBold
            text-[15px]"
            href="/sign-in"
          >
            {" "}
            Log in
          </Link>
        </Text>
      </View>
      <View className="flex-1" />
      <GoogleButton />
    </View>
  );
};

export default SigupForm;
