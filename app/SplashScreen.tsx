import images from "@/constants/images";
import React, { useEffect } from "react";
import { Image, ImageBackground, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const SplashScreen = () => {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });

    logoScale.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
      withRepeat(
        withSequence(
          withTiming(1.08, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.95, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
      ),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <ImageBackground className="flex-1" source={images.backgroundImage}>
      <View className="flex-1 items-center justify-center">
        <Animated.View style={logoStyle}>
          <Image source={images.logo} />
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

export default SplashScreen;
