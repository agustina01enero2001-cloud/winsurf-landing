const messages = [
  {
    time: "19:48",
    user: "Winsurf",
    text: "Operación confirmada",
    amount: "Completada",
    badge: "Verificado",
    replies: ["Perfecto, ya está listo 🔥", "Seguimos en contacto."],
  },
  {
    time: "20:11",
    user: "Usuario Winsurf",
    text: "Alta completada",
    amount: "Confirmada",
    badge: "Acceso activo",
    replies: ["Excelente, todo activado ✅", "Gracias por confiar."],
  },
  {
    time: "21:06",
    user: "Miembro Winsurf",
    text: "Proceso finalizado",
    amount: "Aprobada",
    badge: "Validación OK",
    replies: ["Felicitaciones, seguimos 🔥", "Listo."],
  },
];

export default function ChatProof() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="section-eyebrow">Prueba social</p>
          <h2 className="mb-3 text-2xl font-bold uppercase tracking-wider text-white md:text-3xl">
            Confianza que se ve
          </h2>
          <p className="text-sm text-slate-400 md:text-base">
            Miles de operaciones completadas todos los días.
          </p>
        </div>

        <div className="space-y-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="animate-fade-up glass-card overflow-hidden rounded-2xl"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-[10px] font-black text-slate-950">
                  WS
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{msg.user}</p>
                  <p className="text-xs text-cyan-400/70">{msg.time}</p>
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div className="rounded-xl rounded-tl-sm bg-[#134e4a]/40 px-4 py-3 ring-1 ring-emerald-500/10">
                  <p className="mb-0.5 text-xs text-slate-400">{msg.text}</p>
                  <p className="text-xl font-bold text-white">{msg.amount}</p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {msg.badge}
                  </span>
                </div>

                {msg.replies.map((reply, j) => (
                  <div
                    key={j}
                    className="ml-6 max-w-[85%] rounded-2xl rounded-tl-sm bg-cyan-500/12 px-4 py-2.5 text-sm text-slate-200 ring-1 ring-cyan-400/10"
                  >
                    {reply}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
