import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "../services/tokenCache";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file.",
  );
}

export default function RootLayout() {
  // console.log(
  //   "RootLayout rendering. EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:",
  //   publishableKey ? "Loaded successfully" : "Missing",
  // );
  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Slot />
      </SafeAreaView>
    </ClerkProvider>
  );
}
