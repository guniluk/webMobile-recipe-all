import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../constants/colors";

const HomeFooter = React.memo(({ loadingMore }) => {
  if (!loadingMore) return null;
  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={COLORS.primary} />
    </View>
  );
});

HomeFooter.displayName = "HomeFooter";

const styles = StyleSheet.create({
  footerLoader: {
    paddingVertical: 15,
    alignItems: "center",
  },
});

export default HomeFooter;
