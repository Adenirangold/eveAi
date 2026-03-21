import Background from "@/components/BackGround";
import CustomSwitch from "@/components/CustomSwitch";
import FormError from "@/components/FormError";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import ProfileSkeleton from "@/components/skeleton/ProfileSkeleton";
import icons from "@/constants/icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsiveLayout } from "@/hooks/use-responsive-layout";
import {
  useLogout,
  useProfile,
  useRequestDeletion,
  useResources,
  useUpdateFullName,
  useUpdateUsername,
} from "@/hooks/useAuth";
import { useThemeStore } from "@/store/theme-store";
import {
  clearPushToken,
  getNotificationsEnabled,
  getPermissionStatus,
  registerAndSyncPushToken,
  removePushTokenFromServer,
  setNotificationsEnabled,
} from "@/utils/notification";
import { fullNameSchema } from "@/validation/schema";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const updateFullName = useUpdateFullName();
  const updateUsername = useUpdateUsername();
  const requestDeletion = useRequestDeletion();
  const { data: resources } = useResources();
  const logout = useLogout();

  const colorScheme = useColorScheme();
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const isDark = colorScheme === "dark";
  const { isLargeFormFactor, contentMaxWidth } = useResponsiveLayout();

  const scrollColumnStyle =
    isLargeFormFactor && contentMaxWidth != null
      ? {
          flex: 1,
          width: "100%" as const,
          maxWidth: contentMaxWidth,
          alignSelf: "center" as const,
        }
      : { flex: 1 };

  const handleThemeToggle = (value: boolean) => {
    setThemePreference(value ? "dark" : "light");
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    setRefreshing(false);
  }, [queryClient]);

  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [isNotificationPending, setIsNotificationPending] = useState(false);
  const [isNotificationTurningOff, setIsNotificationTurningOff] =
    useState(false);
  const [fullName, setFullName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  const [nameError, setNameError] = useState("");
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isDeletionSuccess, setIsDeletionSuccess] = useState(false);

  useEffect(() => {
    if (profile?.name) setFullName(profile.name);
    if (profile?.username) setUsername(profile.username);
  }, [profile?.name, profile?.username]);

  useEffect(() => {
    (async () => {
      try {
        const permission = await getPermissionStatus();
        // Use profile.notificationStatus from /me as source of truth when available
        const serverEnabled =
          profile?.notificationStatus ?? (await getNotificationsEnabled());
        setNotificationsEnabledState(serverEnabled && permission);
      } catch {
        setNotificationsEnabledState(false);
      }
    })();
  }, [profile?.notificationStatus]);

  const handleSaveFullName = () => {
    setNameError("");
    const trimmed = fullName.trim();
    if (!trimmed) return;

    const result = fullNameSchema.safeParse(trimmed);
    if (!result.success) {
      setNameError(result.error.issues[0].message);
      return;
    }

    if (trimmed === profile?.name) {
      setIsEditingName(false);
      return;
    }

    updateFullName.mutate(trimmed, {
      onSuccess: () => setIsEditingName(false),
    });
  };

  const handleSaveUsername = () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    if (trimmed === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    updateUsername.mutate(trimmed, {
      onSuccess: () => setIsEditingUsername(false),
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/sign-in");
  };

  const handleEnableNotifications = async () => {
    setIsNotificationPending(true);
    try {
      const ok = await registerAndSyncPushToken();
      if (!ok) {
        Toast.show({
          type: "error",
          text1: "Unable to turn on notifications",
          text2: "Please try again later.",
        });
        return;
      }

      setNotificationsEnabledState(true);
      setIsNotificationModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });

      Toast.show({
        type: "success",
        text1: "Notifications enabled",
        text2:
          "You can now receive notifications from your favourite Bible character.",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Unable to turn on notifications",
        text2: "Please try again later.",
      });
    } finally {
      setIsNotificationPending(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsNotificationTurningOff(true);
    try {
      await removePushTokenFromServer();
      await clearPushToken();
      await setNotificationsEnabled(false);
      setNotificationsEnabledState(false);
      setIsNotificationModalVisible(false);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      Toast.show({
        type: "success",
        text1: "Notifications turned off",
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Unable to turn off notifications",
        text2: "Please try again later.",
      });
    } finally {
      setIsNotificationTurningOff(false);
    }
  };

  const privacyUrl = resources?.privacyUrl ?? "https://binahstudio.com";
  const policyUrl = resources?.policyUrl ?? "https://binahstudio.com";

  const cardBg = isDark ? "#1F1D35" : "#FFFFFF";
  const cardBorder = isDark
    ? { borderWidth: 1, borderColor: "#2D2B4A" }
    : { borderWidth: 1, borderColor: "#E0DCF0" };
  const labelColor = isDark ? "#999" : "#6B7280";
  const valueColor = isDark ? "#fff" : "#1A1A2E";
  const separatorColor = isDark ? "#2D2B45" : "#E0DCF0";
  const chevronColor = isDark ? "#555" : "#9CA3AF";
  const modalBg = isDark ? "#1D1B31" : "#FFFFFF";
  const inputBg = isDark ? "#0A0A0B" : "#F5F3FF";
  const inputBorder = isDark ? "#2D2B45" : "#E0DCF0";
  const subtextColor = isDark ? "#888" : "#6B7280";
  const descColor = isDark ? "#E5E5E5" : "#4B5563";

  if (isLoading) {
    return (
      <Background>
        <SafeAreaView className="flex-1">
          <View style={scrollColumnStyle}>
            <ProfileSkeleton />
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background>
      <SafeAreaView className="flex-1">
        <View style={scrollColumnStyle}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={isDark ? "#A78BFA" : "#1A1A2E"}
                colors={[isDark ? "#A78BFA" : "#1A1A2E"]}
                progressBackgroundColor={isDark ? "#1E1740" : "#FFFFFF"}
              />
            }
          >
            <VerifyEmailBanner />

          {/* Theme Toggle */}
          <View className="flex-row items-center justify-end px-5 pt-4 gap-2">
            <Ionicons
              name={isDark ? "moon" : "sunny"}
              size={18}
              color={isDark ? "#A78BFA" : "#F59E0B"}
            />
            <CustomSwitch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColorFalse="#D1D5DB"
              trackColorTrue="#6C56FF"
              scale={0.9}
            />
          </View>

          {/* Avatar + Identity */}
          <View className="items-center pt-6 pb-8 px-5">
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
                  {getInitials(profile?.name)}
                </Text>
              </LinearGradient>
            </View>

            <Pressable
              onPress={() => setIsEditingName(true)}
              className="flex-row items-center gap-2"
            >
              <Text
                className="font-OutfitSemiBold text-2xl"
                style={{ color: valueColor }}
              >
                {profile?.name ?? "Set name"}
              </Text>
              <Ionicons name="pencil" size={14} color="#6C56FF" />
            </Pressable>

            <Text
              className="font-Outfit text-sm mt-1.5"
              style={{ color: subtextColor }}
            >
              {profile?.email}
            </Text>
          </View>

          {/* Info Cards */}
          <View className="px-5 gap-3">
            {/* Account Section */}
            <Text
              className="font-OutfitSemiBold text-xs uppercase tracking-wider mt-2"
              style={{ color: labelColor, letterSpacing: 1 }}
            >
              Account
            </Text>
            <View
              className="rounded-2xl"
              style={[{ backgroundColor: cardBg }, cardBorder]}
            >
              <Pressable
                onPress={() => setIsEditingUsername(true)}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="at-outline" size={18} color="#6C56FF" />
                </View>
                <Text
                  className="font-OutfitMedium text-base flex-1"
                  style={{ color: labelColor }}
                >
                  Username
                </Text>
                <Text
                  className="font-OutfitMedium text-base mr-2"
                  style={{ color: valueColor }}
                >
                  {profile?.username ?? "—"}
                </Text>
                <Ionicons name="pencil" size={14} color="#6C56FF" />
              </Pressable>
              <Separator color={separatorColor} />
              {!profile?.emailVerified && (
                <>
                  <InfoRow
                    icon="shield-checkmark-outline"
                    labelColor={labelColor}
                    valueColor={valueColor}
                    label="Account Status"
                    trailing={
                      <View className="flex-row items-center gap-1.5 rounded-full px-3 py-1">
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: "#EF4444",
                          }}
                        />
                        <Text
                          className="font-OutfitMedium text-sm"
                          style={{ color: valueColor }}
                        >
                          Not Verified
                        </Text>
                      </View>
                    }
                  />
                  <Separator color={separatorColor} />
                </>
              )}
              <InfoRow
                icon="calendar-outline"
                label="Member Since"
                value={formatDate(profile?.createdAt)}
                labelColor={labelColor}
                valueColor={valueColor}
              />
            </View>

            {/* Settings Section */}
            <Text
              className="font-OutfitSemiBold text-xs uppercase tracking-wider mt-4"
              style={{ color: labelColor, letterSpacing: 1 }}
            >
              Settings
            </Text>
            <View
              className="rounded-2xl"
              style={[{ backgroundColor: cardBg }, cardBorder]}
            >
              <Pressable
                onPress={() => setIsNotificationModalVisible(true)}
                className="flex-row items-center px-5 py-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#6C56FF"
                  />
                </View>
                <Text
                  className="font-OutfitMedium text-base flex-1"
                  style={{ color: labelColor }}
                >
                  Notification
                </Text>
                <Text
                  className="font-OutfitMedium text-sm mr-1"
                  style={{ color: subtextColor }}
                >
                  {notificationsEnabled ? "On" : "Off"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={chevronColor}
                />
              </Pressable>
              <Separator color={separatorColor} />
              <Pressable
                onPress={() => router.push("/change-password")}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#6C56FF"
                  />
                </View>
                <Text
                  className="font-OutfitMedium text-base flex-1"
                  style={{ color: labelColor }}
                >
                  Change Password
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={chevronColor}
                />
              </Pressable>
            </View>

            {/* More Section */}
            <Text
              className="font-OutfitSemiBold text-xs uppercase tracking-wider mt-4"
              style={{ color: labelColor, letterSpacing: 1 }}
            >
              Terms & Conditions
            </Text>
            <View
              className="rounded-2xl"
              style={[{ backgroundColor: cardBg }, cardBorder]}
            >
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(privacyUrl)}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="shield-outline" size={18} color="#6C56FF" />
                </View>
                <Text
                  className="font-OutfitMedium text-base flex-1"
                  style={{ color: labelColor }}
                >
                  Privacy Terms
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={chevronColor}
                />
              </Pressable>

              <Separator color={separatorColor} />

              <Pressable
                onPress={() => WebBrowser.openBrowserAsync(policyUrl)}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#6C56FF"
                  />
                </View>
                <Text
                  className="font-OutfitMedium text-base flex-1"
                  style={{ color: labelColor }}
                >
                  Policy Terms
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={chevronColor}
                />
              </Pressable>

              <Separator color={separatorColor} />

              <Pressable
                onPress={() => router.push("/about")}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#6C56FF"
                  />
                </View>
                <Text
                  className="font-OutfitMedium text-base flex-1"
                  style={{ color: labelColor }}
                >
                  About
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={chevronColor}
                />
              </Pressable>
            </View>

            {/* Delete & Logout */}
            <View
              className="rounded-2xl mt-4"
              style={[{ backgroundColor: cardBg }, cardBorder]}
            >
              <Pressable
                onPress={() => setIsDeleteModalVisible(true)}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Ionicons name="trash-outline" size={18} color="#6C56FF" />
                </View>
                <Text
                  className="font-OutfitMedium text-base flex-1"
                  style={{ color: labelColor }}
                >
                  Request Account Deletion
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={chevronColor}
                />
              </Pressable>
              <Separator color={separatorColor} />
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
                  <Image
                    source={icons.logout}
                    style={{ width: 18, height: 18, tintColor: "#6C56FF" }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  className="font-OutfitMedium text-base  flex-1"
                  style={{ color: labelColor }}
                >
                  Log out
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
        </View>

        {/* Notification Modal */}
        <Modal
          visible={isNotificationModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isNotificationPending) {
              setIsNotificationModalVisible(false);
            }
          }}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)",
            }}
            onPress={() => {
              if (!isNotificationPending) {
                setIsNotificationModalVisible(false);
              }
            }}
          >
            <Pressable
              className="rounded-3xl w-[85%] max-w-[340px] p-6"
              style={{ backgroundColor: modalBg }}
              onPress={() => {}}
            >
              <View className="items-center mb-4">
                <View className="w-14 h-14 rounded-full bg-[#6C56FF]/10 items-center justify-center">
                  <Ionicons
                    name="notifications-outline"
                    size={30}
                    color="#6C56FF"
                  />
                </View>
              </View>
              {notificationsEnabled ? (
                <>
                  <Text
                    className="font-OutfitSemiBold text-xl text-center mb-2"
                    style={{ color: valueColor }}
                  >
                    Turn off notifications?
                  </Text>
                  <Text
                    className="font-Outfit text-sm text-center mb-6"
                    style={{ color: subtextColor }}
                  >
                    You won&apos;t receive updates or messages from your
                    favourite Bible characters. You can turn this back on at any
                    time.
                  </Text>

                  <View className="flex-row gap-3 mt-1">
                    <Pressable
                      onPress={() => {
                        if (!isNotificationTurningOff) {
                          setIsNotificationModalVisible(false);
                        }
                      }}
                      className="flex-1 rounded-xl py-3 items-center"
                      style={[
                        {
                          backgroundColor: isDark ? "#2D2B45" : "#F3F4F6",
                        },
                      ]}
                    >
                      <Text
                        className="font-OutfitMedium text-sm"
                        style={{ color: valueColor }}
                      >
                        Keep on
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleDisableNotifications}
                      disabled={isNotificationTurningOff}
                      className="flex-1 rounded-xl py-3 items-center"
                      style={[
                        {
                          backgroundColor: "#DC2626",
                          opacity: isNotificationTurningOff ? 0.7 : 1,
                        },
                      ]}
                    >
                      {isNotificationTurningOff ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="font-OutfitSemiBold text-sm text-white">
                          Turn off
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text
                    className="font-OutfitSemiBold text-xl text-center mb-2"
                    style={{ color: valueColor }}
                  >
                    Enable Notifications?
                  </Text>
                  <Text
                    className="font-Outfit text-sm text-center mb-6"
                    style={{ color: subtextColor }}
                  >
                    Stay up to date with updates and messages from your
                    favourite Bible characters. You can change this later in
                    your settings.
                  </Text>

                  <View className="flex-row gap-3 mt-1">
                    <Pressable
                      onPress={() => {
                        if (!isNotificationPending) {
                          setIsNotificationModalVisible(false);
                        }
                      }}
                      className="flex-1 rounded-xl py-3 items-center"
                      style={[
                        {
                          backgroundColor: isDark ? "#2D2B45" : "#F3F4F6",
                        },
                      ]}
                    >
                      <Text
                        className="font-OutfitMedium text-sm"
                        style={{ color: valueColor }}
                      >
                        Not now
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleEnableNotifications}
                      disabled={isNotificationPending}
                      className="flex-1 rounded-xl py-3 items-center"
                      style={[
                        {
                          backgroundColor: "#6C56FF",
                          opacity: isNotificationPending ? 0.7 : 1,
                        },
                      ]}
                    >
                      {isNotificationPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="font-OutfitSemiBold text-sm text-white">
                          Yes, enable
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Update Name Modal */}
        <Modal
          visible={isEditingName}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsEditingName(false);
            setFullName(profile?.name ?? "");
            setNameError("");
          }}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)",
            }}
            onPress={() => {
              setIsEditingName(false);
              setFullName(profile?.name ?? "");
              setNameError("");
            }}
          >
            <Pressable
              className="rounded-3xl w-[85%] max-w-[340px] p-6"
              style={{ backgroundColor: modalBg }}
              onPress={() => {}}
            >
              <Text
                className="font-OutfitSemiBold text-xl text-center mb-2"
                style={{ color: valueColor }}
              >
                Update Your Name
              </Text>
              <Text
                className="font-Outfit text-sm text-center mb-6"
                style={{ color: subtextColor }}
              >
                Choose a name that others will see
              </Text>

              <TextInput
                value={fullName}
                onChangeText={setFullName}
                autoFocus
                autoCapitalize="words"
                className="font-OutfitMedium text-base rounded-xl px-4 py-3.5 mb-3"
                style={{
                  color: valueColor,
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: inputBorder,
                }}
                placeholderTextColor="#6B7280"
                placeholder="Enter your full name"
              />

              <FormError
                message={nameError || updateFullName.error?.message || ""}
              />

              <Pressable
                onPress={handleSaveFullName}
                disabled={updateFullName.isPending}
                className="bg-[#6C56FF] rounded-xl py-3.5 items-center mt-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                {updateFullName.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="font-OutfitSemiBold text-base text-white">
                    Save
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsEditingName(false);
                  setFullName(profile?.name ?? "");
                  setNameError("");
                }}
                className="mt-3 py-2 items-center"
              >
                <Text
                  className="font-OutfitMedium text-sm"
                  style={{ color: subtextColor }}
                >
                  Cancel
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Update Username Modal */}
        <Modal
          visible={isEditingUsername}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsEditingUsername(false);
            setUsername(profile?.username ?? "");
          }}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)",
            }}
            onPress={() => {
              setIsEditingUsername(false);
              setUsername(profile?.username ?? "");
            }}
          >
            <Pressable
              className="rounded-3xl w-[85%] max-w-[340px] p-6"
              style={{ backgroundColor: modalBg }}
              onPress={() => {}}
            >
              <Text
                className="font-OutfitSemiBold text-xl text-center mb-2"
                style={{ color: valueColor }}
              >
                Update Username
              </Text>
              <Text
                className="font-Outfit text-sm text-center mb-6"
                style={{ color: subtextColor }}
              >
                Choose a unique username
              </Text>

              <TextInput
                value={username}
                onChangeText={setUsername}
                autoFocus
                autoCapitalize="none"
                className="font-OutfitMedium text-base rounded-xl px-4 py-3.5 mb-3"
                style={{
                  color: valueColor,
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: inputBorder,
                }}
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
                  setIsEditingUsername(false);
                  setUsername(profile?.username ?? "");
                }}
                className="mt-3 py-2 items-center"
              >
                <Text
                  className="font-OutfitMedium text-sm"
                  style={{ color: subtextColor }}
                >
                  Cancel
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Delete Account Modal */}
        <Modal
          visible={isDeleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsDeleteModalVisible(false);
            setIsDeletionSuccess(false);
          }}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)",
            }}
            onPress={() => {
              setIsDeleteModalVisible(false);
              setIsDeletionSuccess(false);
            }}
          >
            <Pressable
              className="rounded-3xl w-[85%] max-w-[340px] p-6"
              style={{ backgroundColor: modalBg }}
              onPress={() => {}}
            >
              {isDeletionSuccess ? (
                <>
                  <View className="items-center mb-4">
                    <View className="w-14 h-14 rounded-full bg-[#22C55E]/15 items-center justify-center">
                      <Ionicons
                        name="checkmark-circle"
                        size={36}
                        color="#22C55E"
                      />
                    </View>
                  </View>
                  <Text
                    className="font-OutfitSemiBold text-lg text-center mb-2"
                    style={{ color: valueColor }}
                  >
                    Request Submitted
                  </Text>
                  <Text
                    className="font-Outfit text-sm text-center mb-5"
                    style={{ color: subtextColor }}
                  >
                    An admin will process your request.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setIsDeleteModalVisible(false);
                      setIsDeletionSuccess(false);
                    }}
                    className="rounded-xl py-3 items-center"
                    style={[
                      { backgroundColor: isDark ? "#2D2B45" : "#F3F4F6" },
                    ]}
                  >
                    <Text
                      className="font-OutfitMedium text-sm"
                      style={{ color: valueColor }}
                    >
                      Close
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View className="items-center mb-4">
                    <View className="w-14 h-14 rounded-full bg-[#DC2626]/10 items-center justify-center">
                      <Ionicons name="warning" size={30} color="#DC2626" />
                    </View>
                  </View>

                  <Text
                    className="font-OutfitSemiBold text-xl text-center mb-2"
                    style={{ color: valueColor }}
                  >
                    Delete Account?
                  </Text>
                  <Text
                    className="font-Outfit text-sm text-center mb-6"
                    style={{ color: subtextColor }}
                  >
                    Are you sure you want to delete your account? This action
                    cannot be undone and all your data will be permanently
                    removed.
                  </Text>

                  <FormError message={requestDeletion.error?.message ?? ""} />

                  <Pressable
                    onPress={() => {
                      requestDeletion.mutate(undefined, {
                        onSuccess: () => {
                          setIsDeletionSuccess(true);
                          setTimeout(() => {
                            setIsDeleteModalVisible(false);
                            setIsDeletionSuccess(false);
                          }, 3000);
                        },
                      });
                    }}
                    disabled={requestDeletion.isPending}
                    className="rounded-xl py-3.5 items-center"
                    style={[{ backgroundColor: "#DC2626" }]}
                  >
                    {requestDeletion.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="font-OutfitSemiBold text-base text-white">
                        Yes, Delete My Account
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => setIsDeleteModalVisible(false)}
                    className="mt-3 py-2 items-center"
                  >
                    <Text
                      className="font-OutfitMedium text-sm"
                      style={{ color: subtextColor }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </>
              )}
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
  labelColor,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  trailing?: React.ReactNode;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <View className="flex-row items-center px-5 py-4">
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-4">
        <Ionicons name={icon} size={18} color="#6C56FF" />
      </View>
      <Text
        className="font-OutfitMedium text-sm flex-1"
        style={{ color: labelColor }}
      >
        {label}
      </Text>
      {trailing ?? (
        <Text
          className="font-OutfitMedium text-sm"
          style={{ color: valueColor }}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

function Separator({ color }: { color: string }) {
  return <View className="h-px mx-5" style={{ backgroundColor: color }} />;
}
