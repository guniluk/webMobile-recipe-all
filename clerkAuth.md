# Expo App에서 Clerk로 사용자 인증(Signup, Login) 구현하기

이 가이드는 **Expo Router** 프로젝트에서 **Clerk** 라이브러리를 활용해 안전하게 회원가입, 로그인, 로그아웃 및 토큰 캐싱을 구현하는 전체적인 과정과 방법을 설명합니다.

---

## 📌 주요 특징

1. **토큰 암호화 저장**: iOS의 Keychain과 Android의 Keystore를 활용하는 `expo-secure-store`를 사용해 세션 토큰을 암호화하여 저장합니다.
2. **최신 API 적용**: Clerk Core v3 이상에서 권장하는 `<Show>` 컴포넌트 및 최신 React Hook 방식을 적용합니다.
3. **Expo Router 통합**: 파일 기반 라우팅 시스템과 결합하여 인증 상태에 따른 보호된 경로(Authentication Guard)를 설정합니다.

---

## 1단계: 사전 준비 및 패키지 설치

### 1. Clerk 대시보드 설정

1. [Clerk 공식 홈페이지](https://clerk.com/)에서 회원가입 및 새 프로젝트(App)를 생성합니다.
2. 가입 시 제공할 인증 방식(Email, Password, Social Login 등)을 선택합니다.
3. 대시보드에서 `Publishable Key`를 복사해 둡니다.

### 2. 패키지 설치

터미널에서 Expo 프로젝트 폴더로 이동하여 아래 명령어를 통해 필요한 라이브러리를 설치합니다.

```bash
npx expo install @clerk/expo expo-secure-store
```

---

## 2단계: 환경 변수 설정

프로젝트 루트 폴더에 `.env` 파일을 만들고(이미 있다면 편집), 복사해 둔 Publishable Key를 추가합니다.

> [!IMPORTANT]
> Expo 환경에서 클라이언트 측에 변수를 노출하려면 반드시 접두사 `EXPO_PUBLIC_`을 사용해야 합니다.

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

---

## 3단계: 안전한 토큰 캐싱 유틸리티 구현 (`cache.js`)

Clerk가 로그인 세션 토큰을 앱에 암호화하여 안전하게 저장하고 유지할 수 있도록 `expo-secure-store`를 활용한 캐시 유틸리티를 작성합니다.

`mobile/src/utils/cache.js` (또는 프로젝트 구조에 맞는 경로)를 생성합니다.

```javascript
import * as SecureStore from "expo-secure-store";

export const tokenCache = {
  async getToken(key) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error("토큰 가져오기 실패:", err);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("토큰 저장 실패:", err);
    }
  },
};
```

---

## 4단계: App Root에 `ClerkProvider` 설정 (`app/_layout.js`)

앱의 진입점이 되는 최상위 레이아웃 파일(`app/_layout.js`)에 `ClerkProvider`를 설정하고, `tokenCache`와 `publishableKey`를 주입합니다.

```jsx
import { ClerkProvider } from "@clerk/expo";
import { Slot } from "expo-router";
import { tokenCache } from "../src/utils/cache"; // 3단계에서 만든 캐시 유틸 경로

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY가 설정되지 않았습니다.");
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/* Slot을 통해 하위 스크린이 마운트됩니다. */}
      <Slot />
    </ClerkProvider>
  );
}
```

---

## 5단계: 인증 가드 설정 (Authentication Guard)

사용자의 로그인 상태에 따라 접근 권한을 제어합니다. Clerk의 `<Show>` 컴포넌트를 이용하면 로그인 유무에 따른 리다이렉트를 깔끔하게 구현할 수 있습니다.

### 보호된 라우트용 레이아웃 예시 (`app/(auth)/_layout.js`)

비로그인 상태일 때는 로그인 화면으로 리다이렉트하는 예시입니다.

```jsx
import { Show } from "@clerk/expo";
import { Redirect, Slot } from "expo-router";

export default function AuthLayout() {
  return (
    // 로그인 상태가 아닐 때(signed-out) -> 로그인 페이지('/sign-in')로 이동
    // 로그인 상태일 때(signed-in) -> 하위 스크린(Slot) 렌더링
    <Show when="signed-in" fallback={<Redirect href="/sign-in" />}>
      <Slot />
    </Show>
  );
}
```

---

## 6단계: 커스텀 회원가입(Sign-up) 화면 구현

Clerk는 메일 검증용 코드를 보낸 뒤, 이를 검증하여 회원가입을 완료하는 Flow를 거칩니다.

### 회원가입 컴포넌트 예시 (`app/sign-up.js`)

```jsx
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const { signUp, setActive, fetchStatus } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");

  // 1. 회원가입 시작 및 인증 이메일 발송
  const onSignUpPress = async () => {
    if (!signUp) return;

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // 이메일 검증 코드 발송 요청
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      Alert.alert(
        "회원가입 실패",
        err.errors?.[0]?.message || "에러가 발생했습니다.",
      );
    }
  };

  // 2. 인증코드 검증 및 가입 완료
  const onPressVerify = async () => {
    if (!signUp) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        // 성공 시 세션을 활성화하고 원하는 경로로 리다이렉트
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err) {
      Alert.alert(
        "인증 실패",
        err.errors?.[0]?.message || "코드가 올바르지 않습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      {!pendingVerification ? (
        <View style={styles.form}>
          <Text style={styles.title}>회원가입</Text>
          <TextInput
            autoCapitalize="none"
            placeholder="이메일 주소"
            value={emailAddress}
            onChangeText={setEmailAddress}
            style={styles.input}
          />
          <TextInput
            placeholder="비밀번호"
            value={password}
            secureTextEntry={true}
            onChangeText={setPassword}
            style={styles.input}
          />
          <TouchableOpacity onPress={onSignUpPress} style={styles.button}>
            <Text style={styles.buttonText}>인증 코드 전송</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>이메일 인증</Text>
          <Text style={styles.subtitle}>
            입력하신 이메일로 발송된 6자리 코드를 입력해주세요.
          </Text>
          <TextInput
            placeholder="인증 코드 입력"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            style={styles.input}
          />
          <TouchableOpacity onPress={onPressVerify} style={styles.button}>
            <Text style={styles.buttonText}>인증 완료</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  form: { width: "100%" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#6C47FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
```

---

## 7단계: 커스텀 로그인(Sign-in) 화면 구현

로그인은 ID(이메일)와 Password를 받아서 인증한 후 완료하는 흐름을 가집니다.

### 로그인 컴포넌트 예시 (`app/sign-in.js`)

```jsx
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSignIn } from "@clerk/expo";
import { useRouter, Link } from "expo-router";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // 세션을 활성화하고 홈으로 리다이렉션
      await setActive({ session: completeSignIn.createdSessionId });
      router.replace("/");
    } catch (err) {
      Alert.alert(
        "로그인 실패",
        err.errors?.[0]?.message || "이메일 또는 비밀번호를 확인하세요.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <TextInput
        autoCapitalize="none"
        placeholder="이메일 주소"
        value={emailAddress}
        onChangeText={setEmailAddress}
        style={styles.input}
      />
      <TextInput
        placeholder="비밀번호"
        value={password}
        secureTextEntry={true}
        onChangeText={setPassword}
        style={styles.input}
      />
      <TouchableOpacity onPress={onSignInPress} style={styles.button}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      <View style={styles.linkContainer}>
        <Text>계정이 없으신가요? </Text>
        <Link href="/sign-up" asChild>
          <TouchableOpacity>
            <Text style={styles.linkText}>회원가입</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#6C47FF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  linkText: { color: "#6C47FF", fontWeight: "bold" },
});
```

---

## 8단계: 현재 사용자 정보 확인 및 로그아웃 구현

로그인 완료 후 메인 홈 화면(`app/index.js`)에서 사용자 정보를 표시하고 로그아웃을 제공하는 예제입니다.

### 홈 화면 예시 (`app/index.js`)

```jsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (err) {
      console.error("로그아웃 에러:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>홈 화면</Text>
      {user && (
        <View style={styles.profileBox}>
          <Text style={styles.welcomeText}>
            안녕하세요, {user.emailAddresses[0].emailAddress} 님!
          </Text>
        </View>
      )}

      <TouchableOpacity onPress={handleSignOut} style={styles.button}>
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  profileBox: { marginBottom: 30, alignItems: "center" },
  welcomeText: { fontSize: 16, color: "#333" },
  button: {
    backgroundColor: "#FF4D4D",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
```

---

## 9단계: Backend (Express.js) 연동 및 API 보호

클라이언트(Expo)에서 백엔드 API를 호출할 때, Clerk에서 발급받은 세션 JWT 토큰을 담아 보내고, 백엔드에서 이를 검증하여 인증된 사용자만 API를 이용할 수 있도록 설정합니다.

### 1. 백엔드 패키지 설치

백엔드 프로젝트(Express.js) 폴더로 이동하여 Clerk Express SDK를 설치합니다.

```bash
npm install @clerk/express
```

### 2. 백엔드 환경 변수 설정 (`.env`)

Clerk 대시보드(API Keys 메뉴)에서 `Publishable Key`와 `Secret Key`를 복사하여 백엔드 `.env` 파일에 추가합니다.

```env
PORT=5000
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
```

### 3. Express 앱에 Clerk 미들웨어 통합 (`src/server.js`)

서버 진입점 파일(`src/server.js`)에 `clerkMiddleware`를 추가하여 들어오는 요청의 JWT 세션을 파싱하도록 설정합니다.

```javascript
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import favoriteRoute from "./routes/favorite.route.js";

const app = express();

app.use(cors());
app.use(express.json());

// Clerk 미들웨어 전역 적용 (req.auth 객체 생성 및 JWT 파싱)
app.use(clerkMiddleware());

app.use("/api/favorites", favoriteRoute);

// ...이하 서버 대기 설정
```

### 4. 라우트 및 컨트롤러에서 인증된 유저 처리

특정 라우트에서 인증을 필수값으로 제한하려면 `@clerk/express`에서 제공하는 `requireAuth` 미들웨어를 사용하거나, `req.auth`를 통해 유저 ID(`auth.userId`) 정보를 컨트롤러에서 바로 활용할 수 있습니다.

#### 방법 A: 라우트 레벨에서 `requireAuth()` 적용 (`routes/favorite.route.js`)

```javascript
import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  createFavorite,
  getFavorites,
  deleteFavorite,
} from "../controllers/favorite.controller.js";

const router = Router();

// requireAuth() 미들웨어를 통과해야만 다음 컨트롤러로 진행할 수 있습니다. (미인증시 401 Unauthorized 반환)
router.post("/", requireAuth(), createFavorite);
router.get("/:userId", requireAuth(), getFavorites);
router.delete("/:userId/:recipeId", requireAuth(), deleteFavorite);

export default router;
```

#### 방법 B: 컨트롤러에서 인증된 유저 ID 활용하기 (`controllers/favorite.controller.js`)

`req.auth.userId`를 사용하여 클라이언트가 보낸 데이터가 아닌 실제 인증 토큰에 기재된 유저 식별자를 안전하게 획득할 수 있습니다.

```javascript
export const createFavorite = async (req, res, next) => {
  try {
    const { recipeId, title, image, cookTime, servings } = req.body;

    // req.auth.userId에는 토큰 검증이 완료된 사용자 ID가 저장되어 있습니다.
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // DB에 즐겨찾기 저장 처리 로직...

    res.status(201).json({ message: "Favorite added successfully" });
  } catch (error) {
    next(error);
  }
};
```

---

## 10단계: Expo App에서 백엔드로 JWT 인증 토큰 전송하기

백엔드에서 `requireAuth` 또는 `req.auth.userId`를 정상적으로 처리하려면, 클라이언트(Expo)에서 HTTP API 호출을 보낼 때 **Authorization 헤더**에 JWT 세션 토큰을 담아서 전송해야 합니다.

`useAuth` 훅의 `getToken` 메서드를 호출하여 토큰을 발급받은 뒤 백엔드로 보내는 예시입니다.

```jsx
import React from "react";
import { Button, Alert } from "react-native";
import { useAuth } from "@clerk/expo";
import { API_URL } from "../constants/api";

export default function FavoriteButton({ recipeId }) {
  const { getToken, userId } = useAuth();

  const handleAddFavorite = async () => {
    if (!userId) {
      Alert.alert("로그인 필요", "즐겨찾기를 등록하려면 로그인이 필요합니다.");
      return;
    }

    try {
      // 1. Clerk로부터 최신 JWT 세션 토큰을 획득합니다.
      const token = await getToken();

      // 2. HTTP 요청 헤더에 Authorization Bearer 토큰으로 기입하여 백엔드로 발송합니다.
      const response = await fetch(`${API_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 여기에 JWT 토큰 전달
        },
        body: JSON.stringify({
          recipeId: recipeId,
          // userId는 백엔드에서 req.auth.userId로 추출하여 검증하므로 생략 가능 (안전함)
        }),
      });

      if (response.ok) {
        Alert.alert("성공", "즐겨찾기에 추가되었습니다.");
      } else {
        Alert.alert("실패", "서버 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return <Button title="즐겨찾기 추가" onPress={handleAddFavorite} />;
}
```

---

## 💡 유용한 팁 및 주의 사항

- **Expo Go vs Development Builds**: 소셜 로그인(Google, Apple 등)을 적용하려면 Expo Go 환경에서는 제약이 따릅니다. 이 경우에는 `expo prebuild`를 거쳐 **Custom Development Build**를 생성해 테스트해야 정상 동작합니다.
- **인증 갱신**: `expo-secure-store`에 캐싱된 토큰 덕분에 앱을 재시작해도 세션이 그대로 유지됩니다.
- **다국어 지원**: Clerk 대시보드 내 "Localization" 메뉴에서 이메일 인증코드 템플릿 등을 한글로 커스텀할 수 있습니다.
- **백엔드 토큰 만료 처리**: Clerk의 프론트엔드 SDK(`@clerk/expo`)는 토큰 만료 시간이 지나면 자동으로 갱신(Refresh)해 줍니다. 따라서 `getToken()`을 API 요청 직전에 호출하면 항상 유효한 최신 JWT 토큰을 백엔드로 안전하게 전송할 수 있습니다.
