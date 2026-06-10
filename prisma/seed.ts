import { PrismaClient } from "@prisma/client";
import { indexDocument } from "../lib/search";

const prisma = new PrismaClient();

/** 일반 텍스트 문단들을 Tiptap JSON 문서로 변환 */
function doc(paragraphs: string[]): string {
  return JSON.stringify({
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: p ? [{ type: "text", text: p }] : [],
    })),
  });
}

const CATEGORY_TREE: { name: string; children: string[] }[] = [
  { name: "업무 기준", children: ["업무 프로세스", "팀 규칙 / 컨벤션", "온보딩 가이드"] },
  { name: "기술 문서", children: ["아키텍처", "API 명세", "개발 환경 설정", "배포 가이드"] },
  { name: "오류 리포팅", children: ["장애 기록", "버그 트래킹", "포스트모템"] },
  { name: "업무 관리", children: ["프로젝트 현황", "주간 업무"] },
];

function ymd(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("🌱 Seeding...");

  // 1) 기본 사용자 + 팀원 (인증 없음 — 작성자/담당자/공수 관리용)
  const admin = await prisma.user.upsert({
    where: { email: "team@company.local" },
    update: {},
    create: { name: "팀", email: "team@company.local", role: "PM", team: "기획", capacity: 1 },
  });
  console.log(`  ✓ 기본 사용자: ${admin.name}`);

  const memberSpecs = [
    { name: "홍길동", email: "hong@company.local", role: "백엔드", team: "개발", capacity: 1 },
    { name: "김영희", email: "kim@company.local", role: "프론트엔드", team: "개발", capacity: 1 },
    { name: "이철수", email: "lee@company.local", role: "QA", team: "품질", capacity: 0.5 },
  ];
  const members = [admin];
  for (const m of memberSpecs) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: { ...m },
    });
    members.push(u);
  }

  // 2) 카테고리 트리
  const existing = await prisma.category.count();
  const topCategoryIds: Record<string, string> = {};
  if (existing === 0) {
    let order = 0;
    for (const top of CATEGORY_TREE) {
      const parent = await prisma.category.create({
        data: { name: top.name, order: order++ },
      });
      topCategoryIds[top.name] = parent.id;
      let childOrder = 0;
      for (const childName of top.children) {
        await prisma.category.create({
          data: { name: childName, parentId: parent.id, order: childOrder++ },
        });
      }
    }
    console.log(`  ✓ 카테고리 트리 생성 완료`);
  } else {
    const tops = await prisma.category.findMany({ where: { parentId: null } });
    tops.forEach((c) => (topCategoryIds[c.name] = c.id));
  }

  // 3) 샘플 문서
  if ((await prisma.document.count()) === 0) {
    const samples = [
      { title: "온보딩 가이드 - 신규 입사자 체크리스트", category: "업무 기준", tags: ["온보딩", "가이드"], paragraphs: ["신규 입사자는 첫 주에 개발 환경 설정과 사내 위키 계정을 발급받습니다.", "필수 읽기 문서: 팀 규칙, 코드 컨벤션, 배포 프로세스."] },
      { title: "시스템 아키텍처 개요", category: "기술 문서", tags: ["아키텍처", "인프라"], paragraphs: ["본 시스템은 망분리(인트라넷) 환경에서 Next.js standalone 으로 단독 구동됩니다.", "데이터는 파일 기반 SQLite 에 저장되며 외부 네트워크 의존성이 없습니다."] },
      { title: "장애 기록 템플릿", category: "오류 리포팅", tags: ["장애", "템플릿"], paragraphs: ["장애 발생 시 발생 시각, 영향 범위, 원인, 조치 내역, 재발 방지책을 기록합니다.", "포스트모템은 장애 종료 후 3일 이내 작성합니다."] },
      { title: "주간 업무 보고 양식", category: "업무 관리", tags: ["주간보고", "양식"], paragraphs: ["이번 주 완료 업무, 진행 중 업무, 다음 주 계획, 이슈/리스크를 정리합니다.", "매주 금요일 17시까지 작성합니다."] },
    ];
    for (const s of samples) {
      const created = await prisma.document.create({
        data: {
          title: s.title,
          content: doc(s.paragraphs),
          categoryId: topCategoryIds[s.category] ?? null,
          authorId: admin.id,
          status: "published",
          tags: JSON.stringify(s.tags),
        },
      });
      indexDocument({ id: created.id, title: created.title, content: created.content, tags: created.tags });
    }
    console.log(`  ✓ 샘플 문서 4건 생성 + FTS 색인`);
  }

  // 4) 샘플 프로젝트 (RFI/RFP/실행중) + 배정
  if ((await prisma.project.count()) === 0) {
    const projects = [
      {
        type: "실행중인 프로젝트", subtitle: "사내 위키 구축", name: "TeamWiki Build",
        client: "사내", status: "진행중", effort: 6, effortUnit: "MM",
        summary: "망분리 사내 기술 위키 & 업무 관리 시스템 구축", order: 0,
        startDate: ymd(-20), endDate: ymd(25),
        assigns: [{ u: 0, role: "PM", e: 1 }, { u: 1, role: "백엔드", e: 3 }, { u: 2, role: "프론트", e: 2 }],
      },
      {
        type: "RFP", subtitle: "차세대 포털 제안", name: "Next Portal RFP",
        client: "A사", status: "대기", effort: 12, effortUnit: "MM",
        summary: "고객사 포털 재구축 제안 작업", order: 0,
        startDate: ymd(3), endDate: ymd(40),
        assigns: [{ u: 0, role: "PM", e: 1 }, { u: 1, role: "설계", e: 2 }],
      },
      {
        type: "RFI", subtitle: "데이터 플랫폼 사전조사", name: "DataPlatform RFI",
        client: "B사", status: "진행중", effort: 2, effortUnit: "MM",
        summary: "데이터 플랫폼 도입 정보 요청 대응", order: 0,
        startDate: ymd(-5), endDate: ymd(10),
        assigns: [{ u: 0, role: "PM", e: 0.5 }],
      },
      {
        type: "실행중인 프로젝트", subtitle: "결제 모듈 고도화", name: "Payment v2",
        client: "C사", status: "개발완료", archived: true, effort: 4, effortUnit: "MM",
        summary: "결제 모듈 리팩터링 (완료)", order: 0,
        startDate: ymd(-90), endDate: ymd(-10),
        assigns: [{ u: 1, role: "백엔드", e: 4 }],
      },
    ];
    for (const p of projects) {
      const { assigns, ...rest } = p;
      await prisma.project.create({
        data: {
          ...rest,
          archived: rest.archived ?? false,
          assignments: {
            create: assigns.map((a) => ({
              userId: members[a.u].id,
              name: members[a.u].name,
              role: a.role,
              effort: a.e,
              effortUnit: "MM",
            })),
          },
        },
      });
    }
    console.log(`  ✓ 샘플 프로젝트 ${projects.length}건 + 배정 생성`);
  }

  // 5) 샘플 개인 일정
  if ((await prisma.personalEvent.count()) === 0) {
    await prisma.personalEvent.createMany({
      data: [
        { title: "여름 휴가", type: "휴가", color: "#22c55e", startDate: ymd(14), endDate: ymd(16) },
        { title: "고객사 출장", type: "출장", color: "#3b82f6", startDate: ymd(5), endDate: ymd(5) },
        { title: "전사 회의", type: "회의", color: "#a855f7", startDate: ymd(2), endDate: ymd(2) },
      ],
    });
    console.log(`  ✓ 샘플 개인 일정 생성`);
  }

  console.log("✅ Seed 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
