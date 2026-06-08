# Neon, Drizzle ORM, Drizzle Kit을 사용한 PostgreSQL DB 연동 가이드

이 문서는 **Neon (Serverless Postgres)**, **Drizzle ORM**, 그리고 **Drizzle Kit**을 사용하여 Node.js(Express) 백엔드 환경에서 PostgreSQL 데이터베이스를 설정하고 연결하는 전체 과정을 단계별로 설명합니다.

---

## 🛠️ 전체 아키텍처 및 데이터 흐름

```mermaid
graph LR
    subgraph Local Environment
        Config[drizzle.config.js] -.->|CLI Schema Sync| Kit[Drizzle Kit CLI]
        Schema[schema.js] -->|Define Tables| DB_Conn[db.js]
        DB_Conn -->|Queries| Express[Express Server]
    end

    subgraph Serverless Cloud
        Kit -->|Migration/Push| Neon[(Neon Postgres DB)]
        Express -->|neon-http / WebSockets| Neon
    end
```

---

## 📋 1단계: Neon 데이터베이스 준비

1. [Neon 공식 웹사이트(neon.tech)](https://neon.tech/)에 접속하여 회원가입 및 로그인을 진행합니다.
2. 새 프로젝트를 생성하고 데이터베이스 이름(기본값: `neondb`)과 리전을 설정합니다.
3. 생성 완료 후 대시보드에서 제공하는 **Connection String (Database URL)**을 복사합니다.
   - 예시 형태: `postgresql://[USER]:[PASSWORD]@[HOST]/[DBNAME]?sslmode=require`

---

## 📦 2단계: 패키지 설치

백엔드 프로젝트 디렉토리(`backend/`) 혹은 프로젝트 루트에서 다음 패키지들을 설치합니다.

```bash
# 1. Drizzle ORM 및 Neon Serverless 드라이버 설치
npm install drizzle-orm @neondatabase/serverless

# 2. 개발 의존성 패키지 설치 (Drizzle Kit, Dotenv)
npm install -D drizzle-kit dotenv
```

> [!NOTE]
> 서버리스 환경(예: Vercel Edge, Cloudflare Workers 등)에서는 HTTP 기반의 `@neondatabase/serverless` 드라이버(`neon-http`)를 사용하는 것이 전통적인 TCP 연결보다 성능이 우수하고 효율적입니다.

---

## 📁 3단계: 파일 생성 및 설정

백엔드 폴더 구조 예시는 다음과 같습니다:
```text
project/
 ├─ backend/
 │   ├─ models/
 │   │   └─ schema.js       # 데이터베이스 스키마 정의
 │   ├─ lib/
 │   │   └─ db.js           # Drizzle & Neon DB 연결 설정
 │   ├─ .env                # 환경 변수 설정
 │   └─ server.js           # Express 서버 시작 파일
 ├─ drizzle.config.js       # Drizzle CLI 도구 설정 파일
 └─ package.json
```

### 1. `.env` 파일 설정
프로젝트 루트 또는 `backend/` 폴더 내에 `.env` 파일을 생성하고 Neon에서 복사한 연결 문자열을 추가합니다.

```env
DATABASE_URL=postgresql://user:password@ep-something.aws.neon.tech/neondb?sslmode=require
```

---

### 2. `drizzle.config.js` (Drizzle Kit 설정)
프로젝트 루트에 생성하며, Drizzle Kit이 스키마의 위치를 찾고 데이터베이스에 동기화할 수 있도록 정보를 입력합니다. (ES Modules 기준)

```javascript
import 'dotenv/config'; // .env 파일 로드
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',                  // 사용할 DB 종류
  schema: './backend/models/schema.js',   // 작성한 스키마 파일 경로
  out: './backend/drizzle',               // 마이그레이션 파일이 저장될 출력 폴더
  dbCredentials: {
    url: process.env.DATABASE_URL,        // DB 연결 문자열
  },
});
```

---

### 3. `backend/models/schema.js` (스키마 정의)
PostgreSQL 테이블 스키마를 정의합니다. 다음은 기본적인 `users` 테이블 정의 예시입니다.

```javascript
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

// 'users' 테이블 정의
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

### 4. `backend/lib/db.js` (연결 초기화)
Neon의 Serverless HTTP 클라이언트를 사용해 Drizzle ORM을 연결하고 내보냅니다.

```javascript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../models/schema.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing!');
}

// 1. Neon HTTP 클라이언트 생성
const sql = neon(process.env.DATABASE_URL);

// 2. Drizzle ORM 인스턴스 생성 및 스키마 관계 매핑
export const db = drizzle({ client: sql, schema });
```

---

## 🚀 4단계: 마이그레이션 및 DB 동기화

Drizzle Kit을 사용하여 정의한 스키마를 실제 Neon PostgreSQL 데이터베이스에 동기화합니다.

### 방법 A: 마이그레이션 파일 생성 및 실행 (프로덕션 추천)
1. **스키마 변경사항 감지하여 SQL 파일 생성**
   ```bash
   npx drizzle-kit generate
   ```
   *실행 후 `backend/drizzle/` 폴더 내에 SQL 마이그레이션 파일이 생성됩니다.*

2. **실제 데이터베이스에 마이그레이션 적용**
   ```bash
   npx drizzle-kit migrate
   ```

### 방법 B: DB에 즉시 푸시 (개발 단계 추천)
로컬 개발 및 프로토타이핑 단계에서는 마이그레이션 파일 생성 없이 바로 스키마를 동기화할 수 있습니다.
```bash
npx drizzle-kit push
```

---

## 💻 5단계: Express 서버에서 DB 사용하기 (`backend/server.js`)

설정된 데이터베이스 객체를 불러와 비즈니스 로직을 처리하는 예시입니다.

```javascript
import express from 'express';
import { db } from './lib/db.js';
import { users } from './models/schema.js';

const app = express();
app.use(express.json());

// 사용자 등록 API
app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const newUser = await db.insert(users).values({ name, email }).returning();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 전체 사용자 조회 API
app.get('/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 💡 유용한 Drizzle Kit 도구
스키마 및 데이터를 직접 웹 브라우저에서 편리하게 시각화하여 확인하고 조작할 수 있는 GUI 도구인 **Drizzle Studio**를 제공합니다.
```bash
npx drizzle-kit studio
```
*터미널에서 명령어를 실행하면 기본적으로 `https://local.drizzle.studio`로 접속하여 DB 상태를 볼 수 있습니다.*
