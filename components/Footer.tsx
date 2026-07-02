export default function Footer() {
  return (
    <footer className="relative px-6 py-10">
      <div className="section-divider mx-auto mb-10 max-w-xs" />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20">
            WS
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            WINSURF
          </span>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Ride · Win · Celebrate
        </p>
      </div>
    </footer>
  );
}
