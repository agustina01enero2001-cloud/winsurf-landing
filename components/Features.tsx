type FeaturesProps = {
  brandName: string;
};

const features = [
  {
    icon: "🛡️",
    title: "Claridad",
    desc: "Procesos explicados desde el primer contacto.",
  },
  {
    icon: "👥",
    title: "Acompañamiento",
    desc: "Te guiamos paso a paso con atención humana.",
  },
  {
    icon: "🎧",
    title: "Atención rápida",
    desc: "Respuesta directa por WhatsApp, sin vueltas.",
  },
  {
    icon: "⚡",
    title: "Alta simple",
    desc: "Creación de usuario ordenada y asistida.",
  },
  {
    icon: "✅",
    title: "Gestión simple",
    desc: "Todo se resuelve en una conversación clara.",
  },
  {
    icon: "🏆",
    title: "Experiencia profesional",
    desc: "Diseñada para sentirse confiable y ordenada.",
  },
];

export default function Features({ brandName }: FeaturesProps) {
  return (
    <section className="px-6 py-16 md:py-24 lg:px-10">
      <div className="mx-auto max-w-5xl lg:max-w-6xl">
        <div className="mb-10 text-center md:mb-12">
          <p className="section-eyebrow">Ventajas</p>
          <h2 className="text-2xl font-bold uppercase tracking-wider text-white md:text-3xl">
            ¿Por qué {brandName}?
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:shadow-[0_8px_32px_rgb(34_211_238_/_0.08)] lg:p-7"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/15 to-teal-500/10 text-2xl transition-transform duration-300 group-hover:scale-110">
                {feature.icon}
              </span>
              <h3 className="mb-2 text-base font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
