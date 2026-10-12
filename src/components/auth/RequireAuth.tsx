"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side gate for account/checkout pages.
 * Redirects anonymous visitors to /login and brings them back afterwards.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="bg-white rounded-sm border border-gray-200 p-10 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        {isLoading ? "Checking your session..." : "Redirecting to login..."}
      </div>
    );
  }

  return <>{children}</>;
}
