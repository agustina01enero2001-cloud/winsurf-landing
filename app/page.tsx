import { Suspense } from "react";
import TwclidCapture from "@/components/TwclidCapture";
import VideoHero from "@/components/VideoHero";
import TrustBar from "@/components/TrustBar";
import ChatProof from "@/components/ChatProof";
import Features from "@/components/Features";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import { getHeroVideoSrc } from "@/lib/hero-video";

export default function Home() {
  const heroVideoSrc = getHeroVideoSrc();

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <Suspense>
        <TwclidCapture />
      </Suspense>
      <main>
        <Suspense>
          <VideoHero videoSrc={heroVideoSrc} />
        </Suspense>
        <TrustBar />
        <ChatProof />
        <Features />
        <Suspense>
          <FinalCta />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
