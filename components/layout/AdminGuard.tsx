"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLibraryStore } from "@/lib/store/libraryStore";
import { isAdminUser } from "@/lib/server/admin-helper";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useLibraryStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!isAdminUser(user)) {
      router.push("/");
    }
  }, [user, router]);

  if (!isAdminUser(user)) return null;
  return <>{children}</>;
}
