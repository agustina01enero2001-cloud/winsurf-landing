const items = [
  {
    icon: "⚡",
    title: "Activación inmediata",
    desc: "Acceso listo al instante",
  },
  {
    icon: "🛡️",
    title: "Atención personalizada",
    desc: "Soporte directo y humano",
  },
  {
    icon: "👥",
    title: "Comunidad activa",
    desc: "Miles de integrantes",
  },
  {
    icon: "🏆",
    title: "Experiencia premium",
    desc: "Diseñada para vos",
  },
];

export default function TrustBar() {
  return (
    <section className="relative px-6 py-12 md:py-14">
      <div className="section-divider mx-auto mb-12 max-w-xs" />
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {items.map((item) => (
          <div
            key={item.title}
            className="glass-card flex flex-col items-center rounded-2xl p-5 text-center transition-colors hover:border-cyan-400/20"
          >
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-xl">
              {item.icon}
            </span>
            <h3 className="mb-1 text-sm font-semibold text-white">
              {item.title}
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
