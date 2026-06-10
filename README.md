# 🍳 Web & Mobile Integrated Recipe App

이 프로젝트는 **Expo (React Native)** 프런트엔드와 **Node.js (Express)** 백엔드로 구성된 통합 레시피 탐색 및 관리 애플리케이션입니다. **TheMealDB API**를 연동하여 전 세계의 수많은 레시피 데이터를 탐색하고, 사용자 계정별로 즐겨찾는 레시피를 실시간으로 저장 및 분석할 수 있는 풀스택 모바일 서비스입니다.

---

## 🛠️ 기술 스택 (Technology Stack)

### 프런트엔드 (Mobile)
* **Framework**: [Expo](https://expo.dev/) (React Native) v51
* **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (파일 기반 라우팅)
* **인증 (Authentication)**: [Clerk Auth](https://clerk.com/) (`@clerk/expo` & `expo-secure-store` 토큰 암호화 캐싱)
* **네트워크**: Native Fetch API (인메모리 캐싱 레이어 탑재)
* **스타일링**: React Native StyleSheet, [Ionicons](https://ionicons.com/) 벡터 아이콘
* **피드백/인터랙션**: `expo-image` (초고속 이미지 렌더링), `expo-haptics` (햅틱 진동 피드백)

### 백엔드 (Backend)
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js (Express 5.x)
* **Database**: [Neon Postgres](https://neon.tech/) (Serverless PostgreSQL Cloud)
* **ORM**: [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) (Schema-first 개발 및 마이그레이션)
* **호스팅**: [Render.com](https://render.com/) (자동 휴면 방지 Self-Ping CronJob 내장)

---

## 📁 디렉토리 구조 (Directory Structure)

```text
project/
 ├─ backend/                   # Node.js Express 백엔드 소스 폴더
 │   ├─ src/
 │   │   ├─ config/
 │   │   │   ├─ cron.js        # Render.com 서버 휴면 방지 Cron 설정
 │   │   │   ├─ db.js          # Drizzle ORM 및 Neon Database 연결
 │   │   │   └─ env.js         # 환경 변수 스키마 정의
 │   │   ├─ controllers/
 │   │   │   └─ favorite.controller.js # 즐겨찾기 CRUD 컨트롤러
 │   │   ├─ db/
 │   │   │   ├─ migrations/    # Drizzle Kit으로 자동 생성된 SQL 마이그레이션 파일들
 │   │   │   └─ schema.js      # Drizzle PostgreSQL DB 스키마 정의
 │   │   ├─ middleware/
 │   │   │   └─ error.middleware.js # Express 5.x 전역 에러 핸들링 미들웨어
 │   │   ├─ routes/
 │   │   │   └─ favorite.route.js # 즐겨찾기 관련 API 라우팅 정의
 │   │   └─ server.js          # Express 서버 엔트리 포인트
 │   ├─ package.json
 │   └─ .env                   # DB 연결 및 배포 설정 환경변수
 │
 ├─ mobile/                    # Expo 모바일 프런트엔드 소스 폴더
 │   ├─ app/                   # Expo Router 파일 기반 라우팅 경로
 │   │   ├─ (auth)/            # 비로그인 사용자용 경로 (Sign-In, Sign-Up)
 │   │   ├─ (tabs)/            # 하단 탭 레이아웃 (Home, Search, Favorites)
 │   │   ├─ recipe/
 │   │   │   └─ [id].jsx       # 레시피 상세 화면 (Dynamic Route)
 │   │   └─ _layout.tsx        # 최상위 루트 레이아웃 (Clerk Provider 바인딩)
 │   ├─ assets/                # 정적 리소스 및 공통 CSS/Style 파일
 │   ├─ components/            # 재사용 가능 UI 컴포넌트
 │   │   ├─ HomeHeader.jsx     # 홈 상단 영역 및 카테고리 필터 슬라이더
 │   │   ├─ HomeFooter.jsx     # FlatList 하단 인디케이터
 │   │   ├─ RecipeItem.jsx     # 그리드 카드 형태의 레시피 썸네일 컴포넌트
 │   │   ├─ LatestRecipe.jsx   # 홈 화면 추천 레시피 배너
 │   │   └─ SafeScreen.jsx     # SafeAreaView 컴포넌트 wrapper
 │   ├─ constants/             # 색상, API URL 등의 상수 정의
 │   ├─ services/              # API 통신 로직 및 데이터 어댑터
 │   │   ├─ mealAPI.js         # TheMealDB API 통신 및 메모리 캐싱 레이어
 │   │   └─ tokenCache.ts      # Clerk 로그인 토큰 SecureStore 캐싱
 │   ├─ package.json
 │   └─ .env                   # Clerk API Key 및 API URL 설정 환경변수
 │
 ├─ README.md                  # 프로젝트 통합 설명서 (현재 파일)
 ├─ postgreDb.md               # 데이터베이스 연동 가이드 문서
 ├─ clerkAuth.md               # 사용자 인증 설정 가이드 문서
 └─ renderOngoing.md           # Render.com 무료 티어 서버 활성 가이드 문서
```

---

## 🎬 서비스 시나리오 (Service Scenarios)

### Scenario 1. 회원가입 및 로그인 (User Authentication)
1. **첫 화면 (인증 가드)**: 사용자가 로그인 상태가 아닐 경우, 인증 가드 미들웨어가 작동하여 접근을 차단하고 자동으로 로그인(`(auth)/sign-in`) 화면으로 리다이렉트합니다.
2. **회원가입**: 계정이 없는 경우 회원가입 링크를 탭하여 이메일 주소와 비밀번호를 입력하고 가입을 신청합니다.
3. **이메일 인증**: Clerk가 제공하는 보안 메일 발송 기능에 의해 입력한 이메일로 6자리 인증 코드가 전송됩니다. 앱에서 코드를 정확하게 입력하면 가입 승인이 완료됩니다.
4. **자동 로그인 및 영구 저장**: 가입 또는 로그인 성공 시 획득한 세션 토큰은 `expo-secure-store`를 통해 디바이스 기기의 안전한 영역(Keychain/Keystore)에 캐싱되어 앱을 재시작해도 로그인 상태가 유지됩니다.

### Scenario 2. 홈 화면 레시피 탐색 (Home & Discover)
1. **환영 인사 및 최신 레시피**: 로그인 성공 시 사용자 이메일 아이디의 환영 인사(`Welcome back, [Name] 👋`)와 함께 추천 레시피 배너가 표시됩니다.
2. **카테고리 필터링**: 화면 중단 슬라이더에서 'Beef', 'Chicken', 'Dessert' 등의 아이콘을 터치하면 부드러운 전환 효과(`LayoutAnimation`)와 함께 해당 종류의 음식 목록으로 전환됩니다.
3. **무한 스크롤**: 레시피 카드 목록은 2열 그리드로 렌더링되며, 아래로 스크롤하면 4개 단위로 상세 데이터(국가명 등)가 Lazy 로드 및 결합됩니다.
4. **당겨서 새로고침**: 화면을 아래로 당기면 상단 테스트 배너 및 카테고리 정보가 갱신됩니다.

### Scenario 3. 검색 및 재료 필터링 (Smart Search)
1. **추천 레시피**: 검색어를 입력하기 전에는 디바이스 전체 화면에 무작위 레시피 6개가 추천됩니다. '새로고침' 시 실시간으로 추천 레시피가 재갱신됩니다.
2. **디바운스 검색**: 검색 창에 검색하고자 하는 요리명 혹은 핵심 재료(예: `egg`, `potato`)를 입력하면 타이핑 완료 600ms 후에 자동으로 API 검색(`searchMealByName` 또는 `filterByIngredient`)이 트리거되어 불필요한 서버 호출을 방지합니다.
3. **검색 페이지네이션**: 검색 결과 역시 무한 스크롤을 활용하여 12개 단위로 끊어서 매끄럽게 조회할 수 있습니다.

### Scenario 4. 레시피 상세 정보 보기 및 요리 준비 (Recipe Detail)
1. **메타 정보 요약**: 요리 썸네일 카드를 선택하면 상세 화면으로 진입합니다. 요리 카테고리, 원산지(Origin), 난이도 시간, 서빙 크기 등이 그리드 형태로 깔끔하게 표시됩니다.
2. **식재료 체크리스트**: 해당 요리에 사용되는 재료와 계량(수량) 단위가 깔끔하게 정렬된 체크박스 형태로 나열되어 사용자가 장을 보거나 요리를 준비할 때 체크할 수 있습니다.
3. **단계별 지침 카드**: 텍스트가 번잡하게 나열되어 있지 않고, 1단계부터 마지막 단계까지 순서에 맞춰 라벨링된 개별 카드 형태로 제공되어 가독성을 대폭 향상했습니다.
4. **미디어 연동 및 공유**: 'Watch Video on YouTube' 버튼을 클릭하면 내장 브라우저 또는 YouTube 앱으로 자동 이동하여 동영상 요리 튜토리얼을 볼 수 있으며, 우측 상단 공유 버튼을 통해 지인에게 레시피 정보를 전송할 수 있습니다.
5. **실시간 즐겨찾기 토글**: 상세 페이지 하트 아이콘을 탭하면 `expo-haptics`를 통한 부드러운 진동 충격(Haptic Feedback)과 함께 백엔드 DB의 즐겨찾기 목록 추가/삭제 프로세스가 안전하게 비동기 실행됩니다.

### Scenario 5. 나만의 요리 수첩 및 통계 분석 (Favorites & Analytics)
1. **실시간 동기화**: 사용자가 찜한 레시피들은 백엔드 PostgreSQL DB에 저장되어 다른 기기로 로그인해도 영구 유지됩니다. 즐겨찾기 탭 진입 시 실시간으로 목록을 페칭합니다.
2. **통계 카드 제공**: 저장된 요리 개수와 저장된 요리들의 **평균 소요 시간(Avg. Cook Time)**을 분석해 주는 카드 레이아웃이 화면 상단에 렌더링되어 한눈에 나만의 식습관과 선호도를 모니터링할 수 있습니다.
3. **간편 제거**: 리스트 내 하트 아이콘을 탭하여 즉시 즐겨찾기를 삭제할 수 있으며, 이 경우 상단 통계 카드 데이터도 실시간으로 리계산되어 자연스럽게 즉각 변경됩니다.

---

## 💻 실행 및 설정 방법 (Getting Started)

### Prerequisites
* Node.js v18 이상 설치
* Expo Go 앱 설치 (테스트용 스마트폰 기기) 또는 Android/iOS 시뮬레이터 환경 구축
* Neon Postgres 계정 및 Clerk Account 생성

### Backend 설정 및 실행
1. `backend` 폴더로 이동합니다.
   ```bash
   cd backend
   ```
2. 필요 패키지를 설치합니다.
   ```bash
   npm install
   ```
3. `backend/.env` 파일을 작성합니다.
   ```env
   PORT=3000
   DATABASE_URL=your_neon_postgresql_connection_string
   NODE_ENV=development
   API_URL=http://localhost:3000/api/test
   ```
4. Drizzle 스키마를 Neon Cloud DB에 즉시 푸시합니다.
   ```bash
   npx drizzle-kit push
   ```
5. 개발 서버를 구동합니다.
   ```bash
   npm run dev
   ```

### Mobile 설정 및 실행
1. `mobile` 폴더로 이동합니다.
   ```bash
   cd mobile
   ```
2. 필요 패키지를 설치합니다.
   ```bash
   npm install
   ```
3. `mobile/.env` 파일을 작성합니다.
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```
4. `mobile/constants/api.js` 파일에 백엔드 서버의 로컬 IP 또는 배포 주소를 설정합니다.
   ```javascript
   export const API_URL = "http://YOUR_LOCAL_IP:3000/api";
   ```
5. Expo 클라이언트를 실행합니다.
   ```bash
   npx expo start
   ```

---

## ⚡ 프로젝트 주요 최적화 사항 (Optimization Details)
1. **API 캐싱 레이어**: 잦은 네트워크 Fetch로 인한 지연을 해소하기 위해 프런트엔드 서비스단에 인메모리 Map 캐시를 적용, 기조회된 정보의 로딩 시간을 최소화했습니다.
2. **컴포넌트 메모이제이션**: `React.memo`와 `useCallback`을 통해 FlatList 내부의 렌더링 오버헤드를 막아 스크롤 시 프레임 드랍 현상을 최적화했습니다.
3. **전역 에러 핸들링**: 백엔드 내 개별 try-catch의 보일러플레이트를 제거하고 Express 5.x의 에러 바운싱을 활용하여 서비스 비정상 중단을 완벽히 방어했습니다.
