import type { Metadata } from "next";
import "./globals.css";

// 망분리 환경: 외부 폰트(next/font/google) 사용 금지 → 시스템 폰트 스택 사용
export const metadata: Metadata = {
  title: "koFlow",
  description: "사내 기술 위키 & 업무 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
