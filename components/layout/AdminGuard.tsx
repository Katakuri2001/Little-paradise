"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { isAdminUser } from "@/lib/server/admin-helper";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useLibraryStore((s) => s.user);
  const router = useRouter();

  // While user is still loading (null), show nothing but don't redirect yet
  if (user === null) return null;

  useEffect(() => {
    if (!isAdminUser(user)) {
      router.push("/");
    }
  }, [user, router]);

  if (!isAdminUser(user)) return null;
  return <>{children}</>;
}
