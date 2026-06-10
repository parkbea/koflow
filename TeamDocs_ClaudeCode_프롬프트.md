# TeamDocs — Claude Code 개발 프롬프트

## 프로젝트 개요

사내 전용 기술 위키 & 업무 관리 시스템을 Next.js로 구축한다.
망분리(인트라넷) 환경에서 운영되며, 외부 인터넷 없이 완전히 동작해야 한다.

---

## 환경 제약 (필수 준수)

- **망분리**: 인트라넷 전용. 외부 CDN, Google Fonts, 외부 API 절대 사용 금지
- **DB**: SQLite (파일 기반). 별도 DB 서버 없음. Prisma + better-sqlite3 사용
- **인증**: 자체 ID/PW 로그인 (NextAuth.js Credentials Provider). Google OAuth 사용 금지
- **파일 저장**: 이미지/첨부파일은 로컬 파일시스템 (`/uploads` 디렉토리)
- **폰트**: 외부 폰트 로드 금지. Tailwind 기본 폰트 스택 사용
- **모든 의존성**: npm 패키지는 빌드 시 번들에 포함되어야 함 (런타임 외부 요청 없음)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| DB | SQLite + Prisma ORM |
| 인증 | NextAuth.js v5 (Credentials) |
| 에디터 | Tiptap (번들 포함) |
| 검색 | SQLite FTS5 (전문검색) |
| 스타일 | Tailwind CSS + shadcn/ui |
| 배포 | Node.js standalone 빌드 |

---

## 문서 카테고리 구조 (사이드바 트리)

```
📁 업무 기준
  ├── 업무 프로세스
  ├── 팀 규칙 / 컨벤션
  └── 온보딩 가이드

📁 기술 문서
  ├── 아키텍처
  ├── API 명세
  ├── 개발 환경 설정
  └── 배포 가이드

📁 오류 리포팅
  ├── 장애 기록
  ├── 버그 트래킹
  └── 포스트모템

📁 업무 관리
  ├── 프로젝트 현황
  └── 주간 업무
```

---

## Prisma 스키마 (SQLite)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./data/teamdocs.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hash
  role      String   @default("viewer") // admin | editor | viewer
  createdAt DateTime @default(now())
  documents Document[]
  tasks     Task[]
  activities ActivityLog[]
}

model Category {
  id        String     @id @default(cuid())
  name      String
  parentId  String?
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  order     Int        @default(0)
  documents Document[]
}

model Document {
  id         String   @id @default(cuid())
  title      String
  content    String   // JSON (Tiptap)
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  status     String   @default("draft") // draft | published
  visibility String   @default("team")  // team | private
  version    Int      @default(1)
  tags       String   @default("[]")    // JSON array
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  histories  DocumentHistory[]
  tasks      Task[]
}

model DocumentHistory {
  id         String   @id @default(cuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id])
  content    String
  version    Int
  createdAt  DateTime @default(now())
}

model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      String    @default("todo") // todo | in-progress | done
  priority    String    @default("medium") // low | medium | high
  assigneeId  String?
  assignee    User?     @relation(fields: [assigneeId], references: [id])
  linkedDocId String?
  linkedDoc   Document? @relation(fields: [linkedDocId], references: [id])
  dueDate     DateTime?
  tags        String    @default("[]")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // created | updated | deleted | viewed
  target    String   // document | task
  targetId  String
  createdAt DateTime @default(now())
}
```

---

## 디렉토리 구조

```
teamdocs/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx          # 사이드바 + 헤더 레이아웃
│   │   ├── page.tsx            # 대시보드
│   │   ├── docs/
│   │   │   ├── page.tsx        # 문서 목록
│   │   │   ├── new/page.tsx    # 문서 작성
│   │   │   └── [id]/
│   │   │       ├── page.tsx    # 문서 상세
│   │   │       └── edit/page.tsx
│   │   ├── tasks/
│   │   │   ├── page.tsx        # 칸반 보드
│   │   │   └── [id]/page.tsx
│   │   └── search/page.tsx     # 통합 검색
│   ├── admin/
│   │   ├── users/page.tsx
│   │   └── categories/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── docs/route.ts
│       ├── docs/[id]/route.ts
│       ├── tasks/route.ts
│       ├── search/route.ts
│       ├── upload/route.ts
│       └── admin/users/route.ts
├── components/
│   ├── editor/TiptapEditor.tsx
│   ├── layout/Sidebar.tsx
│   ├── docs/DocumentCard.tsx
│   └── tasks/KanbanBoard.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── search.ts               # SQLite FTS5 검색
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 # 초기 admin 계정 + 카테고리 seeding
├── public/
│   └── (폰트 파일 없음 — 시스템 폰트 사용)
├── uploads/                    # 첨부파일 저장 디렉토리
├── data/                       # teamdocs.db 위치
└── next.config.ts
```

---

## 핵심 구현 지침

### 1. 인증
- NextAuth.js Credentials Provider로 email + password 로그인
- bcryptjs로 비밀번호 해싱
- 세션에 `role` 포함 (admin/editor/viewer)
- 미들웨어로 비로그인 시 `/login` 리다이렉트

### 2. 에디터 (Tiptap)
- `@tiptap/react`, `@tiptap/starter-kit` 사용
- 코드 블록: `@tiptap/extension-code-block-lowlight` + lowlight (번들 포함)
- 이미지 업로드: `/api/upload`로 POST → 로컬 저장 → URL 반환
- 외부 URL 이미지 삽입 금지 (인트라넷 환경)

### 3. 검색 (SQLite FTS5)
```sql
-- 문서 생성 시 FTS 테이블도 같이 업데이트
CREATE VIRTUAL TABLE docs_fts USING fts5(
  title, content, tags,
  content='Document', content_rowid='rowid'
);
```
- Prisma `$queryRaw`로 FTS 쿼리 실행
- 검색어 하이라이팅은 `snippet()` 함수 활용

### 4. 권한 제어
- `viewer`: 읽기만 가능
- `editor`: 문서/업무 작성·수정 가능
- `admin`: 사용자 관리, 카테고리 관리, 전체 권한

### 5. SQLite 설정
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// WAL 모드 활성화 (동시 접속 성능 향상)
prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;')
prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;')

export default prisma
```

### 6. 파일 업로드
- `/uploads/{year}/{month}/{uuid}.{ext}` 경로에 저장
- `next.config.ts`에서 `/uploads` 경로를 static으로 서빙
- 허용 확장자: jpg, png, gif, webp, pdf, md

---

## Seed 데이터 (prisma/seed.ts)

초기 실행 시 자동 생성:
1. **admin 계정**: `admin@company.local` / `Admin1234!`
2. **기본 카테고리**: 업무 기준, 기술 문서, 오류 리포팅, 업무 관리 (+ 하위 카테고리)
3. **샘플 문서** 각 카테고리에 1개씩

---

## 실행 방법 (인트라넷 환경)

```bash
# 1. 의존성 설치 (인터넷 되는 개발 PC에서)
npm install

# 2. DB 초기화
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 3. 개발 서버
npm run dev

# 4. 프로덕션 빌드 (산출물만 내부망 서버로 이관)
npm run build
node .next/standalone/server.js
```

---

## 개발 순서 (Phase 1 MVP)

1. `prisma/schema.prisma` 작성 및 migrate
2. `prisma/seed.ts` — admin + 카테고리 초기 데이터
3. NextAuth.js 인증 설정 + 미들웨어
4. 레이아웃 (Sidebar 카테고리 트리 + Header)
5. 문서 목록 페이지
6. Tiptap 에디터 + 문서 작성/수정
7. 문서 상세 페이지 (버전 이력 포함)
8. 태그 + 카테고리 관리
9. SQLite FTS5 검색
10. Task 칸반 보드
11. 어드민 (사용자 관리)

---

## 주의사항 요약

- 외부 URL fetch 절대 금지 (폰트, CDN, API 포함)
- `next/font/google` 사용 금지 → 시스템 폰트 또는 로컬 폰트만
- 이미지 최적화: `next/image`의 `unoptimized` 옵션 필요 (외부 이미지 도메인 없음)
- `output: 'standalone'` 설정으로 배포 패키지 최소화
