import Background from "@/components/BackGround";
import CustomSwitch from "@/components/CustomSwitch";
import FormError from "@/components/FormError";
import icons from "@/constants/icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  useChangePassword,
  useLogout,
  useProfile,
  useUpdateUsername,
} from "@/hooks/useAuth";
import { useNotificationToggle } from "@/hooks/useNotifications";
import { useThemeStore } from "@/store/theme-store";
import { changePasswordSchema } from "@/validation/schema";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
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
  const changePassword = useChangePassword();
  const logout = useLogout();

  const colorScheme = useColorScheme();
  const setThemePreference = useThemeStore((s) => s.setPreference);
  const isDark = colorScheme === "dark";

  const handleThemeToggle = (value: boolean) => {
    setThemePreference(value ? "dark" : "light");
  };

  const notifications = useNotificationToggle();
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

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

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError("");
    setPasswordSuccess(false);
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const handleChangePassword = () => {
    setPasswordError("");
    setPasswordSuccess(false);

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });

    if (!result.success) {
      setPasswordError(result.error.issues[0].message);
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess(true);
          setTimeout(() => {
            setIsChangingPassword(false);
            resetPasswordForm();
          }, 1500);
        },
        onError: (err) => {
          setPasswordError(err.message);
        },
      },
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/sign-in");
  };

  const PRIVACY_URL = "https://eve-ai.api.openhvn.dev/privacy";

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
          {/* Theme Toggle */}
          <View className="flex-row items-center justify-end px-5 pt-4">
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
              scale={0.7}
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
                  {initials}
                </Text>
              </LinearGradient>
            </View>

            <Pressable
              onPress={() => setIsEditing(true)}
              className="flex-row items-center gap-2"
            >
              <Text
                className="font-OutfitSemiBold text-2xl"
                style={{ color: valueColor }}
              >
                {profile?.username ?? "Set username"}
              </Text>
              <Ionicons name="pencil" size={16} color="#6C56FF" />
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
            {/* Account Status */}
            <View
              className="rounded-2xl"
              style={[{ backgroundColor: cardBg }, cardBorder]}
            >
              <InfoRow
                icon="shield-checkmark-outline"
                labelColor={labelColor}
                valueColor={valueColor}
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
              <Separator color={separatorColor} />
              <InfoRow
                icon="calendar-outline"
                label="Member Since"
                value={formatDate(profile?.createdAt)}
                labelColor={labelColor}
                valueColor={valueColor}
              />
            </View>

            {/* Notifications */}
            <View
              className="rounded-2xl"
              style={[{ backgroundColor: cardBg }, cardBorder]}
            >
              <View className="flex-row items-center px-5 py-3">
                <View className="w-9 h-9 rounded-xl bg-[#6C56FF]/10 items-center justify-center mr-4">
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#6C56FF"
                  />
                </View>
                <Text
                  className="font-OutfitMedium text-sm flex-1"
                  style={{ color: labelColor }}
                >
                  Push Notifications
                </Text>
                <CustomSwitch
                  value={notifications.isEnabled}
                  onValueChange={notifications.toggle}
                  disabled={notifications.isLoading}
                  trackColorFalse={isDark ? "#2D2B45" : "#D1D5DB"}
                  trackColorTrue="#6C56FF"
                  scale={0.8}
                />
              </View>
              <View className="px-5 pb-4">
                <Text
                  className="font-Outfit text-sm"
                  style={{ color: descColor }}
                >
                  This enables you to receive notifications when your favourite
                  Bible character sends a message.
                </Text>
              </View>
            </View>

            {/* Security & Privacy */}
            <View
              className="rounded-2xl"
              style={[{ backgroundColor: cardBg }, cardBorder]}
            >
              <Pressable
                onPress={() => setIsChangingPassword(true)}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl bg-[#6C56FF]/10 items-center justify-center mr-4">
                  <Ionicons name="lock-closed-outline" size={18} color="#6C56FF" />
                </View>
                <Text
                  className="font-OutfitMedium text-sm flex-1"
                  style={{ color: labelColor }}
                >
                  Change Password
                </Text>
                <Ionicons name="chevron-forward" size={16} color={chevronColor} />
              </Pressable>

              <Separator color={separatorColor} />

              <Pressable
                onPress={() => Linking.openURL(PRIVACY_URL)}
                className="flex-row items-center px-5 py-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="w-9 h-9 rounded-xl bg-[#6C56FF]/10 items-center justify-center mr-4">
                  <Ionicons name="document-text-outline" size={18} color="#6C56FF" />
                </View>
                <Text
                  className="font-OutfitMedium text-sm flex-1"
                  style={{ color: labelColor }}
                >
                  Privacy Policy
                </Text>
                <Ionicons name="chevron-forward" size={16} color={chevronColor} />
              </Pressable>
            </View>

            {/* Logout */}
            <Pressable
              onPress={handleLogout}
              className="rounded-2xl flex-row items-center px-5 py-4 mt-4"
              style={[
                { backgroundColor: cardBg },
                cardBorder,
                ({ pressed }: { pressed: boolean }) => ({
                  opacity: pressed ? 0.7 : 1,
                }),
              ]}
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

            {/* Delete Account */}
            <Pressable
              onPress={() => setIsDeleteModalVisible(true)}
              className="rounded-2xl flex-row items-center px-5 py-4 mt-3"
              style={[
                { backgroundColor: cardBg },
                cardBorder,
                ({ pressed }: { pressed: boolean }) => ({
                  opacity: pressed ? 0.7 : 1,
                }),
              ]}
            >
              <View className="w-9 h-9 rounded-xl bg-[#DC2626]/10 items-center justify-center mr-4">
                <Ionicons name="trash-outline" size={18} color="#DC2626" />
              </View>
              <Text className="font-OutfitMedium text-base text-[#DC2626] flex-1">
                Request Account Deletion
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
            style={{
              backgroundColor: isDark
                ? "rgba(0,0,0,0.6)"
                : "rgba(0,0,0,0.3)",
            }}
            onPress={() => {
              setIsEditing(false);
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
                Update Your Username
              </Text>
              <Text
                className="font-Outfit text-sm text-center mb-6"
                style={{ color: subtextColor }}
              >
                Choose a username that others will see
              </Text>

              <TextInput
                value={username}
                onChangeText={setUsername}
                autoFocus
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
                  setIsEditing(false);
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

        {/* Change Password Modal */}
        <Modal
          visible={isChangingPassword}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsChangingPassword(false);
            resetPasswordForm();
          }}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{
              backgroundColor: isDark
                ? "rgba(0,0,0,0.6)"
                : "rgba(0,0,0,0.3)",
            }}
            onPress={() => {
              setIsChangingPassword(false);
              resetPasswordForm();
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
                Change Password
              </Text>
              <Text
                className="font-Outfit text-sm text-center mb-6"
                style={{ color: subtextColor }}
              >
                Enter your current password and choose a new one
              </Text>

              {passwordSuccess ? (
                <View className="items-center py-4">
                  <View className="w-14 h-14 rounded-full bg-[#22C55E]/15 items-center justify-center mb-3">
                    <Ionicons
                      name="checkmark-circle"
                      size={36}
                      color="#22C55E"
                    />
                  </View>
                  <Text className="font-OutfitMedium text-base text-[#22C55E]">
                    Password updated!
                  </Text>
                </View>
              ) : (
                <>
                  <View className="mb-3">
                    <View
                      className="flex-row items-center rounded-xl"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderColor: inputBorder,
                      }}
                    >
                      <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        secureTextEntry={!showCurrentPw}
                        className="font-OutfitMedium text-base flex-1 px-4 py-3.5"
                        style={{ color: valueColor }}
                        placeholderTextColor="#6B7280"
                        placeholder="Current password"
                      />
                      <Pressable
                        onPress={() => setShowCurrentPw(!showCurrentPw)}
                        className="pr-4"
                        hitSlop={8}
                      >
                        <Ionicons
                          name={showCurrentPw ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#6B7280"
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View className="mb-3">
                    <View
                      className="flex-row items-center rounded-xl"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderColor: inputBorder,
                      }}
                    >
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNewPw}
                        className="font-OutfitMedium text-base flex-1 px-4 py-3.5"
                        style={{ color: valueColor }}
                        placeholderTextColor="#6B7280"
                        placeholder="New password"
                      />
                      <Pressable
                        onPress={() => setShowNewPw(!showNewPw)}
                        className="pr-4"
                        hitSlop={8}
                      >
                        <Ionicons
                          name={showNewPw ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#6B7280"
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View className="mb-1">
                    <View
                      className="flex-row items-center rounded-xl"
                      style={{
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderColor: inputBorder,
                      }}
                    >
                      <TextInput
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry={!showConfirmPw}
                        className="font-OutfitMedium text-base flex-1 px-4 py-3.5"
                        style={{ color: valueColor }}
                        placeholderTextColor="#6B7280"
                        placeholder="Confirm new password"
                      />
                      <Pressable
                        onPress={() => setShowConfirmPw(!showConfirmPw)}
                        className="pr-4"
                        hitSlop={8}
                      >
                        <Ionicons
                          name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                          size={20}
                          color="#6B7280"
                        />
                      </Pressable>
                    </View>
                  </View>

                  <FormError message={passwordError} />

                  <Pressable
                    onPress={handleChangePassword}
                    disabled={changePassword.isPending}
                    className="bg-[#6C56FF] rounded-xl py-3.5 items-center mt-2"
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    {changePassword.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="font-OutfitSemiBold text-base text-white">
                        Update Password
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIsChangingPassword(false);
                      resetPasswordForm();
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
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
        {/* Delete Account Modal */}
        <Modal
          visible={isDeleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDeleteModalVisible(false)}
        >
          <Pressable
            className="flex-1 items-center justify-center"
            style={{
              backgroundColor: isDark
                ? "rgba(0,0,0,0.6)"
                : "rgba(0,0,0,0.3)",
            }}
            onPress={() => setIsDeleteModalVisible(false)}
          >
            <Pressable
              className="rounded-3xl w-[85%] max-w-[340px] p-6"
              style={{ backgroundColor: modalBg }}
              onPress={() => {}}
            >
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
                Are you sure you want to delete your account? This action cannot
                be undone and all your data will be permanently removed.
              </Text>

              <Pressable
                onPress={() => {
                  setIsDeleteModalVisible(false);
                }}
                className="rounded-xl py-3.5 items-center"
                style={[
                  { backgroundColor: "#DC2626" },
                  ({ pressed }: { pressed: boolean }) => ({
                    opacity: pressed ? 0.8 : 1,
                  }),
                ]}
              >
                <Text className="font-OutfitSemiBold text-base text-white">
                  Yes, Delete My Account
                </Text>
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
      <View className="w-9 h-9 rounded-xl bg-[#6C56FF]/10 items-center justify-center mr-4">
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
