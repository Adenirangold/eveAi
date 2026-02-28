import AddContactsContent from "@/components/AddContactsContent";
import CustomBottomSheet, {
  CustomBottomSheetRef,
} from "@/components/CustomBottomSheet";
import CustomTabBar from "@/components/custom-tab-bar";
import { useAuthStore } from "@/store/auth-store";
import { Redirect, Tabs } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useRef } from "react";

type SheetContextType = {
  openAddContacts: () => void;
};

const SheetContext = createContext<SheetContextType>({
  openAddContacts: () => {},
});

export const useAddContactsSheet = () => useContext(SheetContext);

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
  const sheetRef = useRef<CustomBottomSheetRef>(null);
  const queryClient = useQueryClient();

  const openSheet = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["availableContacts"] });
    sheetRef.current?.present();
  }, [queryClient]);

  const closeSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  if (!isAuthenticated) {
    if (!hasSeenOnboarding) {
      return <Redirect href="/(auth)/onboarding" />;
    }
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <SheetContext.Provider value={{ openAddContacts: openSheet }}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="profile" />
      </Tabs>

      <CustomBottomSheet
        ref={sheetRef}
        snapPoints={["100%"]}
        initialIndex={0}
        backgroundStyle={{ backgroundColor: "#0D0B1E" }}
        handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.3)" }}
        enableContentPanningGesture
      >
        <AddContactsContent onClose={closeSheet} />
      </CustomBottomSheet>
    </SheetContext.Provider>
  );
}
