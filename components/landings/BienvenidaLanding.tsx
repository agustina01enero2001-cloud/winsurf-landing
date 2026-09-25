"use client";

import { Suspense } from "react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { brandMarkFromName } from "@/lib/brand";
import styles from "./BienvenidaLanding.module.css";

type BienvenidaLandingProps = {
  brandName: string;
};

function BienvenidaInner({ brandName }: BienvenidaLandingProps) {
  const mark = brandMarkFromName(brandName);

  return (
    <div className={styles.pageWrap}>
      <main className={styles.page}>
        <span className={`${styles.orb} ${styles.orbOne}`} aria-hidden="true" />
        <span className={`${styles.orb} ${styles.orbTwo}`} aria-hidden="true" />

        <section className={styles.shell} aria-labelledby="bienvenida-title">
          <header className={styles.topbar}>
            <div className={styles.brand} aria-label="Marca">
              <div className={styles.brandMark}>{mark}</div>
              <div className={styles.brandCopy}>
                <strong>{brandName}</strong>
                <small>Atención personalizada</small>
              </div>
            </div>
            <div className={styles.age}>
              <span>OK</span> Soporte humano
            </div>
          </header>

          <div className={styles.hero}>
            <div className={styles.copy}>
              <div className={styles.eyebrow}>
                <i aria-hidden="true" /> BIENVENIDA A NUEVOS USUARIOS
              </div>

              <h1 id="bienvenida-title" className={styles.title}>
                Empezá hoy
                <span>con acompañamiento.</span>
              </h1>

              <p className={styles.lead}>
                Creá tu usuario en la plataforma o escribinos por WhatsApp. Te
                guiamos paso a paso, sin complicaciones.
              </p>

              <div
                className={styles.benefits}
                aria-label="Beneficios principales"
              >
                <span>✓ Atención personalizada</span>
                <span>✓ Sin descargas</span>
                <span>✓ Desde tu celular</span>
              </div>

              <Suspense>
                <WhatsAppButton
                  variant="plain"
                  className={styles.cta}
                  aria-label="Consultar por WhatsApp"
                >
                  <svg
                    className={styles.ctaIcon}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12.04 2C6.52 2 2.05 6.38 2.05 11.78c0 1.72.46 3.4 1.33 4.87L2 21.68l5.2-1.34a10.1 10.1 0 0 0 4.84 1.22h.01c5.51 0 10-4.38 10-9.78S17.56 2 12.04 2Zm5.82 13.8c-.25.7-1.46 1.33-2.02 1.4-.52.07-1.18.1-1.9-.12-.44-.13-1-.32-1.72-.62-3.03-1.28-5-4.25-5.15-4.45-.15-.2-1.23-1.6-1.23-3.06 0-1.46.78-2.18 1.05-2.48.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.5.25.6.85 2.02.92 2.17.08.15.13.33.03.53-.1.2-.15.32-.3.5-.15.17-.32.38-.45.5-.15.15-.3.3-.13.6.17.3.77 1.24 1.65 2.01 1.14.99 2.1 1.3 2.4 1.45.3.15.48.13.65-.08.18-.2.75-.85.95-1.15.2-.3.4-.25.68-.15.28.1 1.77.82 2.07.97.3.15.5.22.58.35.07.12.07.72-.18 1.42Z" />
                  </svg>
                  <span className={styles.ctaCopy}>
                    <small>CONSULTAR AHORA</small>
                    <strong>Hablar con un asesor</strong>
                  </span>
                  <span className={styles.ctaArrow} aria-hidden="true">
                    ›
                  </span>
                </WhatsAppButton>
              </Suspense>

              <p className={styles.microcopy}>
                El botón abre WhatsApp para hablar con un asesor. No hay
                redirección automática.
              </p>
            </div>

            <div className={styles.visualWrap} aria-hidden="true">
              <div className={styles.bonusCard}>
                <div className={styles.bonusLabel}>Atención directa</div>
                <div className={styles.bonusValue}>24/7</div>
                <div className={styles.bonusExtra}>acompañamiento</div>
                <div className={styles.example}>
                  Alta guiada · Soporte humano · Sin vueltas
                </div>
              </div>
              <span className={`${styles.coin} ${styles.coinOne}`}>{mark}</span>
              <span className={`${styles.coin} ${styles.coinTwo}`}>✓</span>
            </div>
          </div>

          <p className={styles.legal}>
            Servicio de atención y alta de usuarios. Información orientativa.
            Consultá condiciones vigentes con el equipo de {brandName}.
          </p>
        </section>
      </main>
    </div>
  );
}

export default function BienvenidaLanding({ brandName }: BienvenidaLandingProps) {
  return <BienvenidaInner brandName={brandName} />;
}
