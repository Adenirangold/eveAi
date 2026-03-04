import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResources, useSignUp } from "@/hooks/useAuth";
import { signUpSchema } from "@/validation/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
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
  const { data: resources } = useResources();
  const isDark = useColorScheme() === "dark";

  const { control, handleSubmit } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
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
        name="fullName"
        label="Full Name"
        placeholder="Enter your full name"
        autoCapitalize="words"
        autoComplete="name"
      />
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
      <Text
        className="font-Outfit text-sm text-center mt-4 mb-2"
        style={{ color: isDark ? "#888" : "#9CA3AF" }}
      >
        By continuing, you agree to our{" "}
        <Text
          className="font-OutfitMedium text-xs"
          style={{ color: "#6C56FF" }}
          onPress={() =>
            WebBrowser.openBrowserAsync(
              resources?.privacyUrl ?? "https://binahstudio.com",
            )
          }
        >
          Privacy Terms
        </Text>
        {" & "}
        <Text
          className="font-OutfitMedium text-xs"
          style={{ color: "#6C56FF" }}
          onPress={() =>
            WebBrowser.openBrowserAsync(
              resources?.policyUrl ?? "https://binahstudio.com",
            )
          }
        >
          Policy Terms
        </Text>
      </Text>
    </View>
  );
};

export default SigupForm;
