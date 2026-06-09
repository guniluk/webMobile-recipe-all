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
} from "react-native";
import { useRouter } from "expo-router";
import { useSignIn, useAuth, useClerk } from "@clerk/expo";
import { useState } from "react";
import { authStyles } from "../../assets/styles/auth.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { Image } from "expo-image";

const SignInScreen = () => {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { setActive } = useClerk();
  const { signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    try {
      const signInResult = await signIn.create({
        identifier: email,
        password,
      });

      // 1. Clerk 응답에 에러가 담겨서 리턴된 경우 즉시 에러 처리
      if (signInResult?.error) {
        const clerkError = signInResult.error;
        const errorToThrow = new Error(clerkError.message || "Sign in failed.");
        errorToThrow.errors = clerkError.errors || (clerkError.message ? [clerkError] : []);
        throw errorToThrow;
      }

      // 2. Clerk 응답이 { result } 래핑 구조를 가질 경우 실제 SignInResource 추출
      const actualResult = signInResult?.result ? signInResult.result : signInResult;
      const status = actualResult?.status || signIn.status;

      if (status === "complete") {
        const createdSessionId = actualResult?.createdSessionId || signIn.createdSessionId;
        
        if (createdSessionId) {
          await setActive({ session: createdSessionId });
          router.push("/(tabs)");
        } else if (typeof signIn.finalize === "function") {
          // Clerk Core 3 미래 버전 API 대응
          await signIn.finalize({
            navigate: (to) => router.push(to),
          });
        } else {
          throw new Error("Session ID not found and finalize method is missing.");
        }
      } else {
        Alert.alert("Error", `Failed to sign in. Status: ${status}`);
        // console.error(JSON.stringify(signInResult || signIn, null, 2));
      }
    } catch (err) {
      const errorMessage = err.errors?.[0]?.message || err.message || "Sign in failed";
      Alert.alert("Error", errorMessage);
      // console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={authStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View>
            <Image
              source={require("../../assets/images/i1.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View>

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
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                authStyles.authButton,
                (loading || !isLoaded) && authStyles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={loading || !isLoaded}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={authStyles.buttonText}>
                  {isLoaded ? "Sign In" : "Loading Clerk..."}
                </Text>
              )}
            </TouchableOpacity>

            <View style={authStyles.linkContainer}>
              <TouchableOpacity onPress={() => router.push("/sign-up")}>
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
