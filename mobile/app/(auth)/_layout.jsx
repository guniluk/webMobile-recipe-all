import { useAuth } from '@clerk/expo';
import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  // console.log("AuthRoutesLayout: isLoaded =", isLoaded, ", isSignedIn =", isSignedIn);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
