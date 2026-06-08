import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/expo';
import { useState } from 'react';
import { authStyles } from '../../assets/styles/auth.styles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const SignInScreen = () => {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    try {
      const signInResult = await signIn.create({
        identifier: email,
        password,
      });
      if (signInResult.status === 'complete') {
        await setActive({ session: signInResult.createdSessionId });
        router.push('/(tabs)');
      } else {
        Alert.alert('Error', 'Failed to sign in. Please try again.');
        console.error(JSON.stringify(signInResult, null, 2));
      }
    } catch (err) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign in failed');
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.keyboardView}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent}>
          <Text style={authStyles.title}>Recipe App</Text>
          <Text style={authStyles.subtitle}>
            Welcome Back! Please login to your account
          </Text>

          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Email"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Password"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={authStyles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                authStyles.authButton,
                loading && authStyles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={authStyles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={authStyles.linkContainer}>
              <TouchableOpacity onPress={() => router.push('/sign-up')}>
                <Text style={authStyles.linkText}>
                  {"Don't have an account? "}
                  <Text style={authStyles.link}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignInScreen;
