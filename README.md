# koFlow

사내 전용 기술 위키 & 업무 관리 시스템. **망분리(인트라넷) 환경**에서 외부 인터넷 없이 단독 구동됩니다.

## 기술 스택

- **Next.js 14** (App Router) + TypeScript
- **SQLite** + **Prisma ORM** (파일 기반, 별도 DB 서버 없음)
- **SQLite FTS5** 전문검색 (better-sqlite3)
- **Tiptap** 에디터 (코드 블록 하이라이팅, 이미지 업로드 — 모두 번들 포함)
- **Tailwind CSS** + shadcn 스타일 UI (외부 폰트 미사용, 시스템 폰트)
- 인증 없음 — 사내망 공용

## 주요 기능

**위키**
- 📁 카테고리 트리(사이드바) 기반 문서 분류
- 📝 리치 텍스트 문서 작성/수정 + **버전 이력**
- 🔍 제목·본문·태그 전문검색 (하이라이팅)
- 🖼 로컬 파일시스템 이미지·첨부 업로드

**업무 보드 (프로젝트 포트폴리오)**
- 📊 대시보드: 프로젝트 통계(RFI/RFP/실행중/총공수) + 마감 임박 + 최근 문서
- 🗂 칸반: 타입별 컬럼 · 드래그 이동 · 상태/공수/담당자 · D-day · 완료 보관
- 📈 간트 타임라인 / 📅 캘린더(프로젝트 마일스톤 + 개인일정) / 👥 팀 공수 뷰
- 🗄 완료 프로젝트 보관함(복원/삭제)
- 🔌 OpenProject 동기화·이메일 분석·주간보고(PPTX) — *UI 스텁(추후 지원)*

**공통**
- ⚙️ 카테고리 / 팀원(직무·팀·가용공수) 관리
- 인증 없음 — 사내망 공용

## 로컬 개발

```bash
npm install
npm run db:migrate     # DB 생성 (최초 1회)
npm run db:seed        # 초기 데이터 (카테고리·문서·프로젝트·팀원)
npm run dev            # http://localhost:3000
```

> **참고(개발):** SQLite FTS5 가상 테이블 때문에 스키마 변경 시 Prisma가 드리프트를 감지합니다.
> 개발 중 스키마를 바꿨다면 `data/koflow.db*` 삭제 후 `npm run db:migrate && npm run db:seed` 로 재생성하세요.

## 망분리 배포

[DEPLOY.md](./DEPLOY.md) 참고. 요약:

```bash
npm run build:deploy   # .next/standalone 패키지 생성 (DB·run.bat 동봉)
# → .next/standalone 폴더를 내부망 서버로 반입 후 run.bat 실행
```

## 디렉토리

```
app/(main)/      # 페이지 (대시보드/문서/업무/검색/관리)
app/api/         # REST API (docs, tasks, search, upload, admin)
components/      # UI · 에디터 · 레이아웃 컴포넌트
lib/             # prisma, sqlite(FTS5), search, categories 등
prisma/          # schema + seed + migrations
data/            # SQLite DB (런타임)
uploads/         # 업로드 파일 (런타임)
```

## 초기 계정/데이터

인증이 없으므로 로그인 절차는 없습니다. 시드 시 기본 카테고리 트리(업무 기준/기술 문서/오류 리포팅/업무 관리)와
각 영역 샘플 문서, 샘플 업무가 생성됩니다.
