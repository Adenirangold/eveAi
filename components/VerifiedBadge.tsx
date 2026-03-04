import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface Props {
  size?: number;
}

export default function VerifiedBadge({ size = 16 }: Props) {
  return (
    <Ionicons
      name="checkmark-circle"
      size={size}
      color="#1D9BF0"
      style={{ marginLeft: 4 }}
    />
  );
}
