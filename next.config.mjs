/** @type {import('next').NextConfig} */
const nextConfig = {
  // 망분리(인트라넷) 배포: 산출물 최소화 standalone 빌드
  output: "standalone",

  images: {
    // 외부 이미지 도메인이 없으므로 최적화 비활성화 (로컬 파일만 사용)
    unoptimized: true,
  },

  // Prisma / better-sqlite3 네이티브 모듈을 서버 번들에서 외부 처리
  experimental: {
    serverComponentsExternalPackages: [
      "@prisma/client",
      "better-sqlite3",
      "exceljs",
      "pptxgenjs",
    ],
    // standalone 빌드에 prisma 엔진/네이티브 바이너리 포함 (망분리 반입 대비)
    outputFileTracingIncludes: {
      "/**": ["./node_modules/.prisma/client/**", "./prisma/**"],
    },
  },
};

export default nextConfig;
