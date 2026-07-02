"use client";

import { useRef, useState } from "react";
import WhatsAppButton from "./WhatsAppButton";

type VideoHeroProps = {
  videoSrc: string;
};

export default function VideoHero({ videoSrc }: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);

  async function startVideo() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setStarted(true);
    try {
      await video.play();
    } catch {
      video.muted = true;
      setMuted(true);
      setStarted(false);
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video || !started) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
    if (!nextMuted) void video.play();
  }

  return (
    <section className="flex h-[100dvh] flex-col overflow-hidden bg-[#0a1628] px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
      <div className="hero-title-bar shrink-0 px-2 pb-3 pt-1 text-center">
        <h1 className="hero-title-text text-[clamp(1.65rem,6.5vw,2.5rem)] font-extrabold uppercase leading-none tracking-[0.12em]">
          <span className="hero-title-winsurf">Winsurf</span>{" "}
          <span className="hero-title-accent">tr1plica</span>
        </h1>
      </div>

      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-white/10">
        <div className="hero-video-placeholder absolute inset-0" aria-hidden />

        <video
          key={videoSrc}
          ref={videoRef}
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${started ? "opacity-100" : "opacity-40"}`}
          src={videoSrc}
        />

        {!started && (
          <button
            type="button"
            onClick={startVideo}
            className="animate-audio-prompt absolute inset-x-4 top-[45%] z-20 mx-auto max-w-xs -translate-y-1/2 rounded-2xl border border-amber-400/50 bg-[#0a1628]/90 px-5 py-4 text-center shadow-[0_0_40px_rgb(251_191_36_/_0.2)] backdrop-blur-md sm:max-w-sm"
          >
            <span className="mb-2 flex items-center justify-center text-2xl">▶️</span>
            <span className="block text-base font-bold uppercase tracking-wide text-amber-300">
              Iniciar video
            </span>
            <span className="mt-1 block text-sm text-slate-300">
              Tocá acá para ver el beneficio completo
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tocar para iniciar
            </span>
          </button>
        )}

        {started && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
          >
            {muted ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12m-4.707-2.293L5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
        )}

        <div className="hero-cta-overlay absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-20">
          <div className="mx-auto flex max-w-sm flex-col gap-3">
            {!started && (
              <p className="text-center text-xs font-medium text-amber-300/90">
                Tocá el botón de arriba para iniciar el video
              </p>
            )}
            {started && muted && (
              <p className="text-center text-xs font-medium text-amber-300/90">
                Audio silenciado — tocá el ícono arriba para activarlo
              </p>
            )}
            <WhatsAppButton className="animate-cta-glow w-full py-[1.125rem] text-base shadow-[0_8px_32px_rgb(0_0_0_/_0.4)]">
              <span>Activar beneficio</span>
              <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </WhatsAppButton>
          </div>
        </div>
      </div>

      <div className="animate-scroll-hint flex shrink-0 flex-col items-center gap-0.5 py-2 text-white/30">
        <span className="text-[10px] font-medium uppercase tracking-widest">
          Más info
        </span>
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
