import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

export default function Background({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.base} />

      <LinearGradient
        colors={["#1E1740", "#0E0D14", "#0A0A0B"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={["rgba(90,70,180,0.25)", "transparent"]}
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
    backgroundColor: "#0A0A0B",
  },
});
