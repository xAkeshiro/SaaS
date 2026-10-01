import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/sections/hero";
import { Proof } from "@/components/sections/proof";
import { HowItWorks } from "@/components/sections/how-it-works";
import { LiveDemo } from "@/components/sections/live-demo";
import { Scenarios } from "@/components/sections/scenarios";
import { Together } from "@/components/sections/together";
import { AntiCompanion } from "@/components/sections/anti-companion";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <Hero />
        <Proof />
        <HowItWorks />
        {/* Scenarios sits above the demo, so picking a card scrolls down into it. */}
        <Scenarios />
        <LiveDemo />
        <Together />
        <Pricing />
        <Faq />
        {/* One dark block at the end instead of two separate bands, so the page switches theme once. */}
        <div className="dark relative overflow-hidden bg-band-ink text-foreground">
          <AntiCompanion />
          <FinalCta band={false} />
        </div>
      </main>
      <Footer />
    </>
  );
}
