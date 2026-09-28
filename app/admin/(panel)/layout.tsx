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
    <div className="min-h-screen bg-slate-950 text-slate-100 [color-scheme:dark]">
      {impersonating && (
        <div className="border-b border-amber-700/50 bg-amber-950/80 px-4 py-2 text-center text-sm text-amber-100">
          Operando como <strong>{session.slug}</strong> — los cambios afectan a
          este cliente.
        </div>
      )}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={isSuper ? "/admin/super" : "/admin/settings"}
              className="font-bold tracking-tight text-slate-50"
            >
              {isSuper
                ? "Superadmin"
                : impersonating
                  ? `Superadmin → ${session.slug}`
                  : `Admin · ${session.slug}`}
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-slate-400">
              {isSuper ? (
                <Link href="/admin/super" className="hover:text-slate-100">
                  Clientes
                </Link>
              ) : (
                <>
                  <Link href="/admin/settings" className="hover:text-slate-100">
                    Marca & video
                  </Link>
                  <Link
                    href="/admin/destinations"
                    className="hover:text-slate-100"
                  >
                    Destinos
                  </Link>
                  <Link href="/admin/origins" className="hover:text-slate-100">
                    Orígenes / Tráfico
                  </Link>
                  {session.slug && (
                    <Link
                      href={`/?c=${session.slug}`}
                      className="hover:text-slate-100"
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
