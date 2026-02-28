import Background from "@/components/BackGround";
import FormError from "@/components/FormError";
import icons from "@/constants/icons";
import { useLogout, useProfile, useUpdateUsername } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getInitials(email?: string, username?: string | null): string {
  if (username) {
    return username
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email ? email[0].toUpperCase() : "?";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

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
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/sign-in");
  };

  if (isLoading) {
    return (
      <Background>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6C56FF" size="large" />
        </View>
      </Background>
    );
  }

  const initials = getInitials(profile?.email, profile?.username);

  return (
    <Background>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar + Identity */}
          <View className="items-center pt-10 pb-8 px-5">
            <View className="w-24 h-24 rounded-full items-center justify-center overflow-hidden mb-5">
              <LinearGradient
                colors={["#6C56FF", "#4A3BB5"]}
                style={{
                  width: 96,
                  height: 96,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text className="font-OutfitBold text-4xl text-white">
                  {initials}
                </Text>
              </LinearGradient>
            </View>

            <Pressable
              onPress={() => setIsEditing(true)}
              className="flex-row items-center gap-2"
            >
              <Text className="font-OutfitSemiBold text-2xl text-white">
                {profile?.username ?? "Set username"}
              </Text>
              <Ionicons name="pencil" size={16} color="#6C56FF" />
            </Pressable>

            <Text className="font-Outfit text-sm text-[#888] mt-1.5">
              {profile?.email}
            </Text>
          </View>

          {/* Info Cards */}
          <View className="px-5 gap-3">
            {/* Account Status */}
            <View className="bg-[#1D1B31] rounded-2xl overflow-hidden">
              <InfoRow
                icon="shield-checkmark-outline"
                label="Account Status"
                trailing={
                  <View
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-1"
                    style={{
                      backgroundColor: profile?.emailVerified
                        ? "rgba(34,197,94,0.12)"
                        : "rgba(239,68,68,0.12)",
                    }}
                  >
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: profile?.emailVerified
                          ? "#22C55E"
                          : "#EF4444",
                      }}
                    />
                    <Text
                      className="font-OutfitMedium text-xs"
                      style={{
                        color: profile?.emailVerified ? "#22C55E" : "#EF4444",
                      }}
                    >
                      {profile?.emailVerified ? "Verified" : "Not Verified"}
                    </Text>
                  </View>
                }
              />
              <Separator />
              <InfoRow
                icon="calendar-outline"
                label="Member Since"
                value={formatDate(profile?.createdAt)}
              />
            </View>

            {/* Logout */}
            <Pressable
              onPress={handleLogout}
              className="bg-[#1D1B31] rounded-2xl flex-row items-center px-5 py-4 mt-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-9 h-9 rounded-xl bg-[#DC2626]/10 items-center justify-center mr-4">
                <Image
                  source={icons.logout}
                  style={{ width: 18, height: 18, tintColor: "#DC2626" }}
                  resizeMode="contain"
                />
              </View>
              <Text className="font-OutfitMedium text-base text-[#DC2626] flex-1">
                Log out
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Update Username Modal */}
        <Modal
          visible={isEditing}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsEditing(false);
            setUsername(profile?.username ?? "");
          }}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            onPress={() => {
              setIsEditing(false);
              setUsername(profile?.username ?? "");
            }}
          >
            <Pressable
              className="bg-[#1D1B31] rounded-3xl w-[85%] max-w-[340px] p-6"
              onPress={() => {}}
            >
              <Text className="font-OutfitSemiBold text-xl text-white text-center mb-2">
                Update Your Username
              </Text>
              <Text className="font-Outfit text-sm text-[#888] text-center mb-6">
                Choose a username that others will see
              </Text>

              <TextInput
                value={username}
                onChangeText={setUsername}
                autoFocus
                className="font-OutfitMedium text-base text-white bg-[#0A0A0B] rounded-xl px-4 py-3.5 border border-[#2D2B45] mb-3"
                placeholderTextColor="#6B7280"
                placeholder="Enter username"
              />

              <FormError message={updateUsername.error?.message ?? ""} />

              <Pressable
                onPress={handleSaveUsername}
                disabled={updateUsername.isPending}
                className="bg-[#6C56FF] rounded-xl py-3.5 items-center mt-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                {updateUsername.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="font-OutfitSemiBold text-base text-white">
                    Save
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsEditing(false);
                  setUsername(profile?.username ?? "");
                }}
                className="mt-3 py-2 items-center"
              >
                <Text className="font-OutfitMedium text-sm text-[#888]">
                  Cancel
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </Background>
  );
}

function InfoRow({
  icon,
  label,
  value,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center px-5 py-4">
      <View className="w-9 h-9 rounded-xl bg-[#6C56FF]/10 items-center justify-center mr-4">
        <Ionicons name={icon} size={18} color="#6C56FF" />
      </View>
      <Text className="font-OutfitMedium text-sm text-[#999] flex-1">
        {label}
      </Text>
      {trailing ?? (
        <Text className="font-OutfitMedium text-sm text-white">{value}</Text>
      )}
    </View>
  );
}

function Separator() {
  return <View className="h-px bg-[#2D2B45] mx-5" />;
}
