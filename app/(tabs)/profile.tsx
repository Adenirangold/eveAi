import Background from "@/components/BackGround";
import FormError from "@/components/FormError";
import Header from "@/components/Header";
import CustomButton from "@/components/custom-button";
import icons from "@/constants/icons";
import { useLogout, useProfile, useUpdateUsername } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { data: profile, isLoading } = useProfile();
  const updateUsername = useUpdateUsername();
  const logout = useLogout();

  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile?.username]);

  const handleSaveUsername = () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    if (trimmed === profile?.username) {
      setIsEditing(false);
      return;
    }

    updateUsername.mutate(trimmed, {
      onSuccess: () => {
        setIsEditing(false);
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/sign-in");
  };

  if (isLoading) {
    return (
      <Background>
        <View className="flex-1  items-center justify-center">
          <ActivityIndicator color="#6C56FF" size="large" />
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <SafeAreaView className="flex-1  px-5">
        <Header title="Profile" subtitle="Manage your profile" />

        <View className="bg-[#1D1B31] rounded-2xl p-5 gap-5">
          {/* Email */}
          <View className="gap-1.5">
            <Text className="font-Outfit text-sm text-typo-neutralLight uppercase tracking-wider">
              Email
            </Text>
            <Text className="font-OutfitMedium text-base text-typo-neutral">
              {profile?.email}
            </Text>
          </View>

          {/* Verified status */}
          <View className="gap-1.5">
            <Text className="font-Outfit text-sm text-typo-neutralLight uppercase tracking-wider">
              Status
            </Text>
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={
                  profile?.emailVerified ? "checkmark-circle" : "close-circle"
                }
                size={18}
                color={profile?.emailVerified ? "#22C55E" : "#EF4444"}
              />
              <Text
                className="font-OutfitMedium text-base"
                style={{
                  color: profile?.emailVerified ? "#22C55E" : "#EF4444",
                }}
              >
                {profile?.emailVerified ? "Verified" : "Not Verified"}
              </Text>
            </View>
          </View>

          {/* Username */}
          <View className="gap-1.5">
            <Text className="font-Outfit text-sm text-typo-neutralLight uppercase tracking-wider">
              Username
            </Text>
            {isEditing ? (
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  autoFocus
                  className="flex-1 font-OutfitMedium text-base text-typo-neutral bg-[#0A0A0B] rounded-lg px-3 py-2.5 border border-[#2D2B45]"
                  placeholderTextColor="#6B7280"
                  placeholder="Enter username"
                />
                <Pressable
                  onPress={handleSaveUsername}
                  disabled={updateUsername.isPending}
                  className="bg-[#6C56FF] rounded-lg px-4 py-2.5"
                >
                  {updateUsername.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="font-OutfitMedium text-sm text-white">
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsEditing(true)}
                className="flex-row items-center gap-2"
              >
                <Text className="font-OutfitMedium text-base text-white">
                  {profile?.username ?? "Not set"}
                </Text>
                <Ionicons name="pencil" size={16} color="#6C56FF" />
              </Pressable>
            )}
          </View>
        </View>

        <FormError message={updateUsername.error?.message ?? ""} />

        <View className="mt-10">
          <CustomButton
            title="Log out"
            rounded="full"
            backgroundColor="#DC2626"
            textColor="#FFFFFF"
            onPress={handleLogout}
            leftIcon={icons.logout}
            leftIconTintColor="#FFFFFF"
          />
        </View>
      </SafeAreaView>
    </Background>
  );
}
