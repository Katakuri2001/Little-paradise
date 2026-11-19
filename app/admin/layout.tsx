import AdminShell from "@/components/layout/AdminLayout";

export default function AdminRouteLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
