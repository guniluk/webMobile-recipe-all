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
  const [pendingClientTrust, setPendingClientTrust] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

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
        errorToThrow.errors =
          clerkError.errors || (clerkError.message ? [clerkError] : []);
        throw errorToThrow;
      }

      // 2. Clerk 응답이 { result } 래핑 구조를 가질 경우 실제 SignInResource 추출
      const actualResult = signInResult?.result
        ? signInResult.result
        : signInResult;
      const status = actualResult?.status || signIn.status;

      if (status === "complete") {
        const createdSessionId =
          actualResult?.createdSessionId || signIn.createdSessionId;

        if (createdSessionId) {
          await setActive({ session: createdSessionId });
          router.push("/(tabs)");
        } else if (typeof signIn.finalize === "function") {
          // Clerk Core 3 미래 버전 API 대응
          await signIn.finalize({
            navigate: (to) => router.push(to),
          });
        } else {
          throw new Error(
            "Session ID not found and finalize method is missing.",
          );
        }
      } else if (status === "needs_client_trust") {
        // 새로운 환경이나 기기에서 로그인할 때 기기 신뢰(Client Trust) 수립을 위해 이메일 코드 인증 필요
        const emailCodeFactor = (
          actualResult?.supportedSecondFactors ||
          signIn?.supportedSecondFactors ||
          []
        ).find((factor) => factor.strategy === "email_code");

        if (emailCodeFactor) {
          if (typeof signIn.prepareSecondFactor === "function") {
            await signIn.prepareSecondFactor({ strategy: "email_code" });
          } else if (typeof signIn.mfa?.sendEmailCode === "function") {
            await signIn.mfa.sendEmailCode();
          } else {
            throw new Error(
              "No method found to prepare second factor verification.",
            );
          }
          setPendingClientTrust(true);
          Alert.alert(
            "Device Verification",
            "This looks like a new device. A verification code has been sent to your email.",
          );
        } else {
          Alert.alert(
            "Security Check Required",
            "Your account requires multi-factor authentication, but email verification strategy is not configured.",
          );
        }
      } else {
        Alert.alert("Error", `Failed to sign in. Status: ${status}`);
      }
    } catch (err) {
      const errorMessage =
        err.errors?.[0]?.message || err.message || "Sign in failed";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClientTrust = async () => {
    if (!verificationCode) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }
    if (!isLoaded || !signIn) return;

    setLoading(true);
    try {
      let completeSignIn;
      if (typeof signIn.attemptSecondFactor === "function") {
        completeSignIn = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: verificationCode,
        });
      } else if (typeof signIn.mfa?.verifyEmailCode === "function") {
        completeSignIn = await signIn.mfa.verifyEmailCode({
          code: verificationCode,
        });
      } else {
        throw new Error(
          "Verification method not found on Clerk signIn object.",
        );
      }

      // 만약 에러가 리턴된 경우 throw
      if (completeSignIn?.error) {
        const clerkError = completeSignIn.error;
        const errorToThrow = new Error(
          clerkError.message || "Verification failed.",
        );
        errorToThrow.errors =
          clerkError.errors || (clerkError.message ? [clerkError] : []);
        throw errorToThrow;
      }

      const actualComplete = completeSignIn?.result
        ? completeSignIn.result
        : completeSignIn;
      const status = actualComplete?.status || signIn.status;
      const createdSessionId =
        actualComplete?.createdSessionId || signIn.createdSessionId;

      if (status === "complete" || createdSessionId) {
        if (createdSessionId) {
          await setActive({ session: createdSessionId });
          router.push("/(tabs)");
        } else if (typeof signIn.finalize === "function") {
          await signIn.finalize({
            navigate: (to) => router.push(to),
          });
        }
      } else {
        Alert.alert("Error", `Verification failed. Status: ${status}`);
      }
    } catch (err) {
      const errorMessage =
        err.errors?.[0]?.message || err.message || "Invalid verification code.";
      Alert.alert("Verification Failed", errorMessage);
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
          {!pendingClientTrust ? (
            <>
              <View>
                <Image
                  source={require("../../assets/images/i1.png")}
                  style={authStyles.image}
                  contentFit="contain"
                />
              </View>

              <Text style={authStyles.title}>Recipe App</Text>
              <Text style={authStyles.subtitle}>
                Welcome Back! Please login to your account^^
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
            </>
          ) : (
            <>
              <View>
                <Image
                  source={require("../../assets/images/i3.png")}
                  style={authStyles.image}
                  contentFit="contain"
                />
              </View>

              <Text style={authStyles.title}>Verify Device</Text>
              <Text style={authStyles.subtitle}>
                Enter the verification code sent to your email: {email}
              </Text>

              <View style={authStyles.formContainer}>
                {/* Verification Code Input */}
                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Verification Code"
                    placeholderTextColor={COLORS.textLight}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="numeric"
                    autoCapitalize="none"
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    authStyles.authButton,
                    (loading || !isLoaded) && authStyles.buttonDisabled,
                  ]}
                  onPress={handleVerifyClientTrust}
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={authStyles.buttonText}>
                      {isLoaded ? "Verify Code" : "Loading Clerk..."}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Link to Go Back to Sign In */}
                <View style={authStyles.linkContainer}>
                  <TouchableOpacity
                    onPress={() => setPendingClientTrust(false)}
                  >
                    <Text style={authStyles.linkText}>
                      {"Change email or password? "}
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

export default SignInScreen;
