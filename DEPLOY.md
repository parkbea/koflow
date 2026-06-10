# koFlow 망분리(인트라넷) 배포 가이드

외부 인터넷이 없는 내부망에서 단독 구동되도록 만든 Next.js standalone 패키지입니다.
**런타임에 외부 네트워크 요청이 전혀 없습니다.** (외부 폰트/CDN/API 미사용)

---

## 1. 인터넷 되는 개발 PC에서 (패키징)

```bash
# 1) 의존성 설치
npm install

# 2) DB 생성 + 초기 데이터(관리 카테고리/샘플 문서/업무) 시드
npm run db:migrate        # 최초 1회 (prisma migrate dev)
npm run db:seed

# 3) 배포용 standalone 빌드 + 조립
npm run build:deploy
```

`build:deploy` 가 끝나면 **`.next/standalone`** 폴더 안에 다음이 모두 포함됩니다.

```
.next/standalone/
├── server.js                # 실행 진입점
├── run.bat                  # Windows 실행 스크립트
├── node_modules/            # 런타임 의존성 (prisma 엔진, better-sqlite3 네이티브 포함)
├── .next/                   # 빌드 산출물 + static
├── prisma/                  # schema + migrations
├── data/koflow.db         # 시드 완료된 SQLite DB (동봉됨)
└── uploads/                 # 첨부/이미지 저장 위치
```

---

## 2. 반입 (내부망 서버로 이관)

`.next/standalone` 폴더 **전체**를 압축해서 내부망 서버로 옮깁니다.
내부망 서버에는 **Node.js 18+ 런타임만** 설치되어 있으면 됩니다. (npm install 불필요)

> 네이티브 모듈(better-sqlite3, prisma 쿼리 엔진)은 **빌드한 PC와 동일한 OS/아키텍처**용으로
> 번들됩니다. 개발 PC와 내부망 서버의 OS(예: Windows x64)가 같아야 합니다.
> 다르면 해당 서버 OS에서 빌드하세요.

---

## 3. 내부망 서버에서 실행

압축 해제한 `standalone` 폴더에서:

**Windows**
```
run.bat
```

**수동 실행 (Linux/Windows 공통)**
```bash
# DB 절대경로 지정 (Prisma 와 검색엔진이 같은 파일을 보도록)
# Windows 예: set DATABASE_URL=file:C:/koFlow/data/koflow.db
# Linux  예: export DATABASE_URL=file:/opt/koFlow/data/koflow.db
export DATABASE_URL="file:$(pwd)/data/koflow.db"
export PORT=3000
node server.js
```

브라우저에서 `http://서버IP:3000` 접속.

---

## 4. 운영 메모

- **인증 없음**: 사내망 공용. 누구나 읽기/쓰기 가능합니다.
- **백업**: `data/koflow.db` 파일과 `uploads/` 폴더만 백업하면 전체 데이터가 보존됩니다.
  (WAL 모드 사용 → `koflow.db-wal`, `koflow.db-shm` 도 함께 백업 권장)
- **업로드 허용 형식**: jpg, png, gif, webp, pdf, md (최대 10MB)
- **검색**: SQLite FTS5 전문검색. 문서 저장 시 자동 색인됩니다.
- **DB 위치 변경**: `DATABASE_URL` 환경변수만 절대경로로 바꾸면 됩니다.
```
```
