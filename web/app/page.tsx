import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { HowItWorks } from "@/components/sections/how-it-works";
import { LiveDemo } from "@/components/sections/live-demo";
import { Scenarios } from "@/components/sections/scenarios";
import { Together } from "@/components/sections/together";
import { Principles } from "@/components/sections/principles";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <LiveDemo />
        <Scenarios />
        <Together />
        <Principles />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
