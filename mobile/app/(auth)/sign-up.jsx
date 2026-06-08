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
import { useSignUp } from '@clerk/expo';
import { useState } from 'react';
import { authStyles } from '../../assets/styles/auth.styles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const SignUpScreen = () => {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. 회원가입 시작 및 인증 이메일 발송
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // 이메일 검증 코드 발송 요청
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      Alert.alert(
        'Sign Up Failed',
        err.errors?.[0]?.message || 'An error occurred during sign up.',
      );
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // 2. 인증코드 검증 및 가입 완료
  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        // 성공 시 세션을 활성화하고 탭(메인) 화면으로 리다이렉트
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/(tabs)');
      } else {
        Alert.alert('Error', 'Failed to verify email. Please try again.');
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err) {
      Alert.alert(
        'Verification Failed',
        err.errors?.[0]?.message || 'Invalid verification code.',
      );
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

          {!pendingVerification ? (
            <>
              <Text style={authStyles.subtitle}>
                Create a new account to get started
              </Text>

              <View style={authStyles.formContainer}>
                {/* Email Input */}
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

                {/* Password Input */}
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

                {/* Confirm Password Input */}
                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Confirm Password"
                    placeholderTextColor={COLORS.textLight}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={authStyles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={24}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[
                    authStyles.authButton,
                    loading && authStyles.buttonDisabled,
                  ]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={authStyles.buttonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                {/* Link to Sign In */}
                <View style={authStyles.linkContainer}>
                  <TouchableOpacity onPress={() => router.push('/sign-in')}>
                    <Text style={authStyles.linkText}>
                      {'Already have an account? '}
                      <Text style={authStyles.link}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={authStyles.subtitle}>
                Enter the verification code sent to your email
              </Text>

              <View style={authStyles.formContainer}>
                {/* Verification Code Input */}
                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Verification Code"
                    placeholderTextColor={COLORS.textLight}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                    autoCapitalize="none"
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    authStyles.authButton,
                    loading && authStyles.buttonDisabled,
                  ]}
                  onPress={handleVerify}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={authStyles.buttonText}>Verify Email</Text>
                  )}
                </TouchableOpacity>

                {/* Link to Back to Sign Up */}
                <View style={authStyles.linkContainer}>
                  <TouchableOpacity
                    onPress={() => setPendingVerification(false)}
                  >
                    <Text style={authStyles.linkText}>
                      {'Change email or password? '}
                      <Text style={authStyles.link}>Go Back</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUpScreen;
