import { brandInitials } from "@/lib/password";

type ChatProofProps = {
  brandName: string;
};

export default function ChatProof({ brandName }: ChatProofProps) {
  const initials = brandInitials(brandName);
  const messages = [
    {
      time: "19:48",
      user: brandName,
      text: "Consulta respondida",
      amount: "Listo",
      badge: "Atendido",
      replies: ["Perfecto, gracias.", "Quedamos atentos."],
    },
    {
      time: "20:11",
      user: `Usuario ${brandName}`,
      text: "Alta guiada",
      amount: "Completada",
      badge: "Confirmado",
      replies: ["Excelente, todo claro.", "Gracias por la ayuda."],
    },
    {
      time: "21:06",
      user: `Miembro ${brandName}`,
      text: "Soporte recibido",
      amount: "OK",
      badge: "Resuelto",
      replies: ["Muy buena atención.", "Listo, gracias."],
    },
  ];

  return (
    <section className="px-6 py-16 md:py-24 lg:px-10">
      <div className="mx-auto max-w-3xl lg:max-w-6xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="section-eyebrow">Atención real</p>
          <h2 className="mb-3 text-2xl font-bold uppercase tracking-wider text-white md:text-3xl">
            Conversaciones claras
          </h2>
          <p className="text-sm text-slate-400 md:text-base">
            Respuestas humanas y acompañamiento paso a paso.
          </p>
        </div>

        <div className="space-y-5 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="animate-fade-up glass-card overflow-hidden rounded-2xl"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-[10px] font-black text-slate-950">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {msg.user}
                  </p>
                  <p className="text-[11px] text-slate-500">{msg.time}</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  {msg.badge}
                </span>
              </div>
              <div className="space-y-3 px-4 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-slate-300">{msg.text}</p>
                  <span className="shrink-0 text-sm font-semibold text-cyan-300">
                    {msg.amount}
                  </span>
                </div>
                <div className="space-y-2 border-t border-white/5 pt-3">
                  {msg.replies.map((reply, j) => (
                    <p key={j} className="text-sm text-slate-400">
                      {reply}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
