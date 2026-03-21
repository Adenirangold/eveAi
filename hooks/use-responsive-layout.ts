import { Platform, useWindowDimensions } from "react-native";

/** Width at or above which we apply tablet layout, only when also on iPad. */
const TABLET_MIN_WIDTH = 768;

/**
 * Large form factor = iPad device AND window wide enough (full screen or large split).
 * iPhone layout stays the default when either condition fails.
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isIOSPad = Platform.OS === "ios" && Platform.isPad;
  const isLargeFormFactor = isIOSPad && width >= TABLET_MIN_WIDTH;

  return {
    windowWidth: width,
    windowHeight: height,
    isLargeFormFactor,
    /** Centered column cap on large iPad; omit on phone so width stays 100%. */
    contentMaxWidth: isLargeFormFactor ? 560 : undefined,
  };
}
