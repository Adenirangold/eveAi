import { useLogin } from "@/hooks/useAuth";
import { signUpSchema } from "@/validation/schema";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { z } from "zod";
import FormError from "../FormError";
import FormTextInput from "../FormTextInput";
import GoogleButton from "../GoogleButton";
import CustomButton from "../custom-button";

const REMEMBER_EMAIL_KEY = "rememberMe_email";
const REMEMBER_PASSWORD_KEY = "rememberMe_password";

const LoginForm = () => {
  type SignUpFormData = z.infer<typeof signUpSchema>;
  const loginMutation = useLogin();

  const {
    control,
    handleSubmit,
    setValue,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    (async () => {
      const savedEmail = await SecureStore.getItemAsync(REMEMBER_EMAIL_KEY);
      const savedPassword = await SecureStore.getItemAsync(REMEMBER_PASSWORD_KEY);
      if (savedEmail) {
        setValue("email", savedEmail);
        if (savedPassword) setValue("password", savedPassword);
        setRememberMe(true);
      }
    })();
  }, []);

  const errorMessage = loginMutation.error?.message ?? "";

  const onSubmit = (data: SignUpFormData) => {
    loginMutation.mutate(data, {
      onSuccess: async () => {
        if (rememberMe) {
          await SecureStore.setItemAsync(REMEMBER_EMAIL_KEY, data.email);
          await SecureStore.setItemAsync(REMEMBER_PASSWORD_KEY, data.password);
        } else {
          await SecureStore.deleteItemAsync(REMEMBER_EMAIL_KEY);
          await SecureStore.deleteItemAsync(REMEMBER_PASSWORD_KEY);
        }
        router.replace("/(tabs)");
      },
    });
  };
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
        secureTextEntry={true}
      />

      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => setRememberMe(!rememberMe)}
          className="flex-row items-center gap-2"
        >
          <Ionicons
            name={rememberMe ? "checkbox" : "square-outline"}
            size={20}
            color={rememberMe ? "#6C56FF" : "#9CA3AF"}
          />
          <Text className="font-Outfit text-sm text-typo-neutralLight">
            Remember me
          </Text>
        </Pressable>
        <TouchableOpacity onPress={() => router.push("/forget-password")}>
          <Text className="font-OutfitSemiBold text-sm text-primary-primary">
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-10">
        <FormError message={errorMessage} />
        <CustomButton
          title="Log in"
          rounded="full"
          loading={loginMutation.isPending}
          onPress={handleSubmit(onSubmit)}
        />
        <Text className="font-Outfit text-sm text-typo-neutral text-center mt-5">
          Don't have an account?{" "}
          <Link
            className="text-primary-primary font-OutfitSemiBold
            text-[15px]"
            href="/sign-up"
          >
            {" "}
            Sign up
          </Link>
        </Text>
      </View>
      <View className="flex-1" />
      <GoogleButton />
    </View>
  );
};

export default LoginForm;
