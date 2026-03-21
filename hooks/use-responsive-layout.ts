import { useWindowDimensions, type ViewStyle } from "react-native";

/** Window width (dp) at or above which we use tablet-style layout (narrower column, etc.). */
const TABLET_MIN_WIDTH = 768;
/**
 * On tablet, max content width scales with window width so a 13" iPad gets a wider column
 * than an 11" (not a single fixed cap that looks like a phone strip on large screens).
 */
const TABLET_CONTENT_WIDTH_FRACTION = 0.76;
/** Floor so split-view / small tablet still has a sensible column. */
const CONTENT_MAX_WIDTH_MIN = 560;
/** Ceiling avoids unreadably wide lines on huge monitors / Stage Manager. */
const CONTENT_MAX_WIDTH_MAX = 1180;

function contentMaxWidthForWindow(width: number): number | undefined {
  if (width < TABLET_MIN_WIDTH) return undefined;
  const fromWindow = Math.round(width * TABLET_CONTENT_WIDTH_FRACTION);
  return Math.min(
    CONTENT_MAX_WIDTH_MAX,
    Math.max(CONTENT_MAX_WIDTH_MIN, fromWindow),
  );
}

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isLargeFormFactor = width >= TABLET_MIN_WIDTH;

  return {
    windowWidth: width,
    windowHeight: height,
    isLargeFormFactor,
    contentMaxWidth: contentMaxWidthForWindow(width),
  };
}

type ScrollColumnOptions = {
  /** When false, only applies tablet width cap (no flex:1). Use for headers, reels strip, etc. */
  flex?: boolean;
};

/** Same column constraint as main tabs (centered, max width on tablet). For skeletons and full-width placeholders. */
export function useScrollColumnStyle(
  options: ScrollColumnOptions = {},
): ViewStyle {
  const { flex: useFlex = true } = options;
  const { isLargeFormFactor, contentMaxWidth } = useResponsiveLayout();

  const constrained: ViewStyle =
    isLargeFormFactor && contentMaxWidth != null
      ? {
          width: "100%",
          maxWidth: contentMaxWidth,
          alignSelf: "center",
        }
      : {};

  if (useFlex) {
    return { flex: 1, ...constrained };
  }
  return constrained;
}
