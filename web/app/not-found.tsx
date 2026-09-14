import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="flex flex-1 items-center bg-hero-mesh pt-32 pb-24">
        <Container className="flex flex-col items-start gap-6">
          <span className="text-eyebrow text-amber-ink">404</span>
          <h1 className="text-display-lg">This page went quiet.</h1>
          <p className="text-lede max-w-[48ch]">
            The link is wrong or the page moved. The conversation you are dreading is still waiting, though.
          </p>
          <Button asChild size="lg">
            <Link href="/">Back to Unmute</Link>
          </Button>
        </Container>
      </main>
      <Footer />
    </>
  );
}
