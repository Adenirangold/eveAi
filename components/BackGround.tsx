import { useColorScheme } from "@/hooks/use-color-scheme";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

export default function Background({
  children,
}: {
  children: React.ReactNode;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.base,
          { backgroundColor: isDark ? "#0A0A0B" : "#F5F3FF" },
        ]}
      />

      <LinearGradient
        colors={
          isDark
            ? ["#1E1740", "#0E0D14", "#0A0A0B"]
            : ["#EDE9FE", "#F5F3FF", "#FFFFFF"]
        }
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={
          isDark
            ? ["rgba(90,70,180,0.25)", "transparent"]
            : ["rgba(108,86,255,0.08)", "transparent"]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={StyleSheet.absoluteFill}
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  base: {
    ...StyleSheet.absoluteFillObject,
  },
});
