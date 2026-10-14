import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/services/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

/**
 * Server-side gate for the /admin tree.
 * /admin/login is public. All other routes require an active ADMIN session.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Allow the standalone /admin/login page to render freely without shell or redirect loop
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const user = await getSessionUser();

  if (!user) {
    redirect("/admin/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  // Confirm against the database so a revoked admin can't keep using an old cookie.
  let isStillAdmin = user.role === "ADMIN";
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, isActive: true },
    });
    if (dbUser) {
      isStillAdmin = Boolean(dbUser.role === "ADMIN" && dbUser.isActive);
    }
  } catch (err) {
    console.warn("[admin layout] database check skipped/unreachable:", err);
  }

  if (!isStillAdmin) {
    redirect("/");
  }

  return (
    <AdminShell adminName={user.name || user.phone} adminEmail={user.email || undefined}>
      {children}
    </AdminShell>
  );
}
