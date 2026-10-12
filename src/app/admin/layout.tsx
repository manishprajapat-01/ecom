import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/services/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/**
 * Server-side gate for the whole /admin tree.
 * Anonymous → login (and come back), non-admin → storefront.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  // Confirm against the database so a revoked admin can't keep using an old cookie.
  let isStillAdmin = false;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });
    isStillAdmin = Boolean(dbUser && dbUser.role === "ADMIN" && dbUser.isActive);
  } catch (err) {
    console.error("[admin layout] database check failed:", err);
  }

  if (!isStillAdmin) {
    redirect("/");
  }

  return <AdminShell adminName={user.name || user.phone}>{children}</AdminShell>;
}
