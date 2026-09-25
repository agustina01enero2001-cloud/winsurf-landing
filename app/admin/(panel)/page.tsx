import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminIndexPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role === "superadmin") redirect("/admin/super");
  redirect("/admin/settings");
}
