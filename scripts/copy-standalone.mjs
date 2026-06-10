// next build (output: standalone) 후 실행물 조립 스크립트
// standalone 디렉토리에 정적 파일(.next/static)과 public 을 복사한다.
// 망분리 반입: .next/standalone 폴더 전체를 그대로 옮기면 단독 구동된다.
import fs from "fs";
import path from "path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  console.error("✗ .next/standalone 이 없습니다. 먼저 `npm run build` 를 실행하세요.");
  process.exit(1);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
  return true;
}

// 1) 정적 자원
copyDir(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static")
);
console.log("  ✓ .next/static → standalone");

// 2) public (있으면)
if (copyDir(path.join(root, "public"), path.join(standalone, "public"))) {
  console.log("  ✓ public → standalone");
}

// 3) 업로드/데이터 디렉토리 자리 (런타임 생성되지만 미리 만들어 둠)
fs.mkdirSync(path.join(standalone, "uploads"), { recursive: true });
fs.mkdirSync(path.join(standalone, "data"), { recursive: true });

// 4) 실행 스크립트 동봉
const runBat = path.join(root, "run.bat");
if (fs.existsSync(runBat)) {
  fs.copyFileSync(runBat, path.join(standalone, "run.bat"));
  console.log("  ✓ run.bat → standalone");
}

// 5) 시드 완료된 DB 가 있으면 동봉 (망분리 서버로 그대로 반입)
const dbFile = path.join(root, "data", "koflow.db");
if (fs.existsSync(dbFile)) {
  fs.copyFileSync(dbFile, path.join(standalone, "data", "koflow.db"));
  console.log("  ✓ data/koflow.db(시드 완료) → standalone");
} else {
  console.log(
    "  ! data/koflow.db 없음 — 반입 전 `npm run db:migrate && npm run db:seed` 로 생성하세요."
  );
}

console.log("✅ standalone 조립 완료: .next/standalone");
console.log("   구동: .next/standalone 폴더로 이동 후 run.bat 실행 (또는 node server.js)");
