import Link from "next/link";
import { redirect } from "next/navigation";
import ExitImpersonationButton from "@/components/admin/ExitImpersonationButton";
import LogoutButton from "@/components/admin/LogoutButton";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const isSuper = session.role === "superadmin";
  const impersonating = session.impersonating === true;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {impersonating && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          Operando como <strong>{session.slug}</strong> — los cambios afectan a
          este cliente.
        </div>
      )}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={isSuper ? "/admin/super" : "/admin/settings"}
              className="font-bold tracking-tight"
            >
              {isSuper
                ? "Superadmin"
                : impersonating
                  ? `Superadmin → ${session.slug}`
                  : `Admin · ${session.slug}`}
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-slate-600">
              {isSuper ? (
                <Link href="/admin/super" className="hover:text-slate-900">
                  Clientes
                </Link>
              ) : (
                <>
                  <Link href="/admin/settings" className="hover:text-slate-900">
                    Marca & video
                  </Link>
                  <Link
                    href="/admin/destinations"
                    className="hover:text-slate-900"
                  >
                    Destinos
                  </Link>
                  <Link href="/admin/origins" className="hover:text-slate-900">
                    Orígenes / Tráfico
                  </Link>
                  {session.slug && (
                    <Link
                      href={`/?c=${session.slug}`}
                      className="hover:text-slate-900"
                      target="_blank"
                    >
                      Ver landing
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {impersonating && <ExitImpersonationButton />}
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
