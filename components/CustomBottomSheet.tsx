import { BottomSheetBackdrop, BottomSheetModal } from "@gorhom/bottom-sheet";
import React, {
  ReactNode,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

export interface CustomBottomSheetRef {
  present: () => void;
  dismiss: () => void;
  snapToIndex: (index: number) => void;
  snapToPosition: (position: string | number) => void;
  collapse: () => void;
  expand: () => void;
}

interface CustomBottomSheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  initialIndex?: number;
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  backdropOpacity?: number;
  backdropColor?: string;
  handleStyle?: ViewStyle;
  handleIndicatorStyle?: ViewStyle;
  backgroundStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  enableContentPanningGesture?: boolean;
  enableOverDrag?: boolean;
  showHandle?: boolean;
  customHandle?: React.ReactNode;
  onDismiss?: () => void;
  onChange?: (index: number) => void;
  onAnimate?: (fromIndex: number, toIndex: number) => void;
}

const CustomBottomSheet = forwardRef<
  CustomBottomSheetRef,
  CustomBottomSheetProps
>(
  (
    {
      children,
      snapPoints = ["50%", "90%"],
      initialIndex = 0,
      enablePanDownToClose = true,
      enableDynamicSizing = false,
      backdropOpacity = 0.5,
      backdropColor = "#000000",
      handleStyle,
      handleIndicatorStyle,
      backgroundStyle,
      containerStyle,
      enableContentPanningGesture = false,
      enableOverDrag = true,
      showHandle = true,
      customHandle,
      onDismiss,
      onChange,
      onAnimate,
    },
    ref,
  ) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    // // Expose methods to parent components
    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
      snapToIndex: (index: number) =>
        bottomSheetRef.current?.snapToIndex(index),
      snapToPosition: (position: string | number) =>
        bottomSheetRef.current?.snapToPosition(position),
      collapse: () => bottomSheetRef.current?.collapse(),
      expand: () => bottomSheetRef.current?.expand(),
    }));

    // Memoize snap points for performance
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    // Backdrop component with customizable appearance
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={backdropOpacity}
          pressBehavior={enablePanDownToClose ? "close" : "none"}
          style={[props.style, { backgroundColor: backdropColor }]}
        />
      ),
      [backdropOpacity, backdropColor, enablePanDownToClose],
    );

    // Custom handle component
    const renderHandle = useCallback(
      (props: any) => {
        if (!showHandle) return null;

        if (customHandle) {
          return <>{customHandle}</>;
        }

        return (
          <View style={[styles.handleContainer, handleStyle]}>
            <View style={[styles.handleIndicator, handleIndicatorStyle]} />
          </View>
        );
      },
      [showHandle, customHandle, handleStyle, handleIndicatorStyle],
    );

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={initialIndex}
        snapPoints={memoizedSnapPoints}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        enablePanDownToClose={enablePanDownToClose}
        enableDynamicSizing={enableDynamicSizing}
        enableHandlePanningGesture={enablePanDownToClose}
        enableContentPanningGesture={enableContentPanningGesture}
        enableOverDrag={enableOverDrag}
        backgroundStyle={[styles.background, backgroundStyle]}
        containerStyle={containerStyle}
        android_keyboardInputMode="adjustResize"
        keyboardBlurBehavior="restore"
        keyboardBehavior="extend"
        onDismiss={onDismiss}
        onChange={onChange}
        onAnimate={onAnimate}
      >
        {children}
      </BottomSheetModal>
    );
  },
);

CustomBottomSheet.displayName = "CustomBottomSheet";

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  handleContainer: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  handleIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
});

export default CustomBottomSheet;
