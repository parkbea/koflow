import prisma from "@/lib/prisma";
import { UserManager, type UserItem } from "@/components/admin/UserManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      team: true,
      capacity: true,
      createdAt: true,
      _count: { select: { documents: true, assignments: true } },
    },
  });

  const items: UserItem[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    team: u.team,
    capacity: u.capacity,
    createdAt: u.createdAt.toISOString(),
    docCount: u._count.documents,
    assignCount: u._count.assignments,
  }));

  return <UserManager initial={items} />;
}
