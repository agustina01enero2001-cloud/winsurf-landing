import type { Metadata } from "next";
import { Suspense } from "react";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import TwclidCapture from "@/components/TwclidCapture";
import VideoHero from "@/components/VideoHero";
import TrustBar from "@/components/TrustBar";
import ChatProof from "@/components/ChatProof";
import Features from "@/components/Features";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import BienvenidaLanding from "@/components/landings/BienvenidaLanding";
import { getTenantBySlug } from "@/lib/tenant";

type PageProps = {
  searchParams: Promise<{ c?: string; o?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { c } = await searchParams;
  const tenant = await getTenantBySlug(c);
  if (!tenant) {
    return {
      title: "Landing no encontrada",
      description: "El enlace no corresponde a una landing activa.",
    };
  }
  if (tenant.template === "bienvenida") {
    return {
      title: `${tenant.name} | Atención y alta`,
      description: `Creá tu usuario en ${tenant.name}. Atención personalizada por WhatsApp.`,
      openGraph: {
        title: `${tenant.name} | Atención y alta`,
        description: `Creá tu usuario en ${tenant.name}. Atención personalizada por WhatsApp.`,
        type: "website",
      },
    };
  }
  return {
    title: `${tenant.name} | Atención online`,
    description: `${tenant.name}: acompañamiento y alta de usuarios con atención personalizada.`,
    openGraph: {
      title: `${tenant.name} | Atención online`,
      description: `${tenant.name}: acompañamiento y alta de usuarios con atención personalizada.`,
      type: "website",
    },
  };
}

export default async function Home({ searchParams }: PageProps) {
  const { c } = await searchParams;
  const tenant = await getTenantBySlug(c);

  if (!tenant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628] px-6 text-center text-white">
        <h1 className="mb-3 text-2xl font-bold">Landing no encontrada</h1>
        <p className="max-w-md text-sm text-slate-400">
          Usá una URL con el parámetro del cliente, por ejemplo{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">/?c=winsurf</code>
        </p>
      </div>
    );
  }

  if (tenant.template === "bienvenida") {
    return (
      <>
        <Suspense>
          <TwclidCapture />
        </Suspense>
        <Suspense>
          <AnalyticsBeacon slug={tenant.slug} />
        </Suspense>
        <BienvenidaLanding brandName={tenant.name} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <Suspense>
        <TwclidCapture />
      </Suspense>
      <Suspense>
        <AnalyticsBeacon slug={tenant.slug} />
      </Suspense>
      <main>
        <Suspense>
          <VideoHero brandName={tenant.name} videoSrc={tenant.videoSrc} />
        </Suspense>
        <TrustBar brandName={tenant.name} />
        <ChatProof brandName={tenant.name} />
        <Features brandName={tenant.name} />
        <Suspense>
          <FinalCta brandName={tenant.name} />
        </Suspense>
      </main>
      <Footer brandName={tenant.name} />
    </div>
  );
}
