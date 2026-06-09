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
import { useSignUp, useClerk } from "@clerk/expo";
import { useState } from "react";
import { authStyles } from "../../assets/styles/auth.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { Image } from "expo-image";

const SignUpScreen = () => {
  const router = useRouter();
  const { signUp, isLoaded: clerkIsLoaded } = useSignUp();
  const { setActive } = useClerk();
  const isLoaded = clerkIsLoaded !== undefined ? clerkIsLoaded : !!signUp;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. 회원가입 시작 및 인증 이메일 발송
  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    if (!isLoaded || !signUp) {
      Alert.alert(
        "Error",
        "Clerk authentication is not initialized yet. Please wait.",
      );
      return;
    }

    setLoading(true);
    try {
      const signUpAttempt = await signUp.create({
        emailAddress: email,
        password,
      });

      // 1. Clerk 응답에 에러가 담겨서 리턴된 경우 즉시 에러 처리
      if (signUpAttempt?.error) {
        const clerkError = signUpAttempt.error;
        const errorToThrow = new Error(
          clerkError.message || "Sign up attempt failed.",
        );
        errorToThrow.errors =
          clerkError.errors || (clerkError.message ? [clerkError] : []);
        throw errorToThrow;
      }

      // 2. Clerk 응답이 { result, error } 래핑 구조를 가질 경우 실제 SignUpResource 추출
      const actualAttempt = signUpAttempt?.result
        ? signUpAttempt.result
        : signUpAttempt;

      // 3. 가용 메서드를 unwrapped 인스턴스(actualAttempt) 또는 원본 signUp 객체에서 직접 호출하여 상태 지연(Lexical Lag) 완벽 우회
      if (typeof actualAttempt.prepareVerification === "function") {
        await actualAttempt.prepareVerification({ strategy: "email_code" });
      } else if (
        typeof actualAttempt.prepareEmailAddressVerification === "function"
      ) {
        await actualAttempt.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      } else if (typeof signUp.prepareVerification === "function") {
        await signUp.prepareVerification({ strategy: "email_code" });
      } else if (typeof signUp.prepareEmailAddressVerification === "function") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      } else if (
        signUp.verifications &&
        typeof signUp.verifications.sendEmailCode === "function"
      ) {
        // Clerk Core 3 미래 버전 API 대응
        await signUp.verifications.sendEmailCode();
      } else if (
        actualAttempt.verifications &&
        typeof actualAttempt.verifications.sendEmailCode === "function"
      ) {
        // Clerk Core 3 미래 버전 API 대응 (래핑된 경우)
        await actualAttempt.verifications.sendEmailCode();
      } else {
        throw new Error(
          `Verification method not found. 
          signUpAttempt keys: [${Object.keys(signUpAttempt || {}).join(", ")}], 
          actualAttempt keys: [${Object.keys(actualAttempt || {}).join(", ")}], 
          signUp keys: [${Object.keys(signUp || {}).join(", ")}],
          verifications: ${!!signUp.verifications || !!actualAttempt.verifications}`,
        );
      }

      setPendingVerification(true);
    } catch (err) {
      const errorMessage =
        err.errors?.[0]?.message ||
        err.message ||
        "An error occurred during sign up.";
      Alert.alert("Sign Up Failed", errorMessage);
      // console.error("Sign up error detail:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 인증코드 검증 및 가입 완료
  const handleVerify = async () => {
    if (!code) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }
    if (!isLoaded || !signUp) {
      Alert.alert(
        "Error",
        "Clerk authentication is not initialized yet. Please wait.",
      );
      return;
    }

    setLoading(true);
    try {
      let completeSignUp;
      // 1. 메서드 동적 폴백 처리 (이전 버전 및 최신 Core 3 API 대응)
      if (typeof signUp.attemptVerification === "function") {
        completeSignUp = await signUp.attemptVerification({
          code,
          strategy: "email_code",
        });
      } else if (typeof signUp.attemptEmailAddressVerification === "function") {
        completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        });
      } else if (
        signUp.verifications &&
        typeof signUp.verifications.verifyEmailCode === "function"
      ) {
        // Clerk Core 3 미래 버전 API 대응
        completeSignUp = await signUp.verifications.verifyEmailCode({ code });
      } else {
        throw new Error(
          "Verification attempt method not found on Clerk signUp object.",
        );
      }

      // 2. 만약 completeSignUp 결과에 에러가 존재한다면 throw
      if (completeSignUp?.error) {
        const clerkError = completeSignUp.error;
        const errorToThrow = new Error(
          clerkError.message || "Verification failed.",
        );
        errorToThrow.errors =
          clerkError.errors || (clerkError.message ? [clerkError] : []);
        throw errorToThrow;
      }

      // 3. 성공 상태 확인 및 세션 활성화
      const actualComplete = completeSignUp?.result
        ? completeSignUp.result
        : completeSignUp;

      // Lexical Lag 문제를 방지하기 위해 status가 "complete"이거나 createdSessionId가 이미 존재하면 성공으로 판단합니다.
      const status = actualComplete?.status || signUp.status;
      const createdSessionId =
        actualComplete?.createdSessionId || signUp.createdSessionId;

      if (status === "complete" || createdSessionId) {
        if (createdSessionId) {
          await setActive({ session: createdSessionId });
          router.push("/(tabs)");
        } else if (typeof signUp.finalize === "function") {
          // Clerk Core 3 미래 버전 finalize 대응
          await signUp.finalize({
            navigate: (to) => router.push(to),
          });
        } else {
          // 회원가입 자체는 Clerk 상에서 성공했으므로, 세션 생성이 실패하더라도
          // 에러를 내뿜지 않고 로그인 화면으로 안전하게 유도하여 로그인을 진행하게 합니다.
          Alert.alert(
            "Account Verified",
            "Your email has been verified successfully. Please log in.",
            [{ text: "Log In", onPress: () => router.push("/sign-in") }],
          );
        }
      } else {
        Alert.alert("Error", `Failed to verify email. Status: ${status}`);
        // console.error(JSON.stringify(completeSignUp || signUp, null, 2));
      }
    } catch (err) {
      const errorMessage =
        err.errors?.[0]?.message || err.message || "Invalid verification code.";
      Alert.alert("Verification Failed", errorMessage);
      // console.error("Verification error detail:", err);
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
          {!pendingVerification ? (
            <>
              <Image
                source={require("../../assets/images/i2.png")}
                style={authStyles.image}
              />
              <Text style={authStyles.title}>Create Account</Text>
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
                      name={showPassword ? "eye-off" : "eye"}
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
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={24}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[
                    authStyles.authButton,
                    (loading || !isLoaded) && authStyles.buttonDisabled,
                  ]}
                  onPress={handleSignUp}
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={authStyles.buttonText}>
                      {isLoaded ? "Sign Up" : "Loading Clerk..."}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Link to Sign In */}
                <View style={authStyles.linkContainer}>
                  <TouchableOpacity onPress={() => router.push("/sign-in")}>
                    <Text style={authStyles.linkText}>
                      {"Already have an account? "}
                      <Text style={authStyles.link}>Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              <Image
                source={require("../../assets/images/i3.png")}
                style={authStyles.image}
              />
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
                    (loading || !isLoaded) && authStyles.buttonDisabled,
                  ]}
                  onPress={handleVerify}
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={authStyles.buttonText}>
                      {isLoaded ? "Verify Email" : "Loading Clerk..."}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Link to Back to Sign Up */}
                <View style={authStyles.linkContainer}>
                  <TouchableOpacity
                    onPress={() => setPendingVerification(false)}
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

export default SignUpScreen;
