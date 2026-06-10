import prisma from "./prisma";

/**
 * 인증이 없는 사내망 공용 환경.
 * 문서 작성자 등 FK 용으로 기본 사용자를 반환한다(없으면 생성).
 */
export async function getDefaultUser() {
  const existing = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name: "팀",
      email: "team@company.local",
      password: "",
      role: "member",
    },
  });
}
