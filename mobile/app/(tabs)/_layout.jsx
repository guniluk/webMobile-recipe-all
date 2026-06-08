import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';

const TabsLayout = () => {
  const { isSignedIn } = useAuth();

  // Redirect unauthenticated users to sign-in page
  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  return <Stack />;
};

export default TabsLayout;
