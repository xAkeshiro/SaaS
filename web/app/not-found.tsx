import Link from "next/link";
import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { CtaArrow } from "@/components/site/cta-arrow";
import { Button } from "@/components/ui/button";
import { Mirror } from "@/components/world/mirror";
import { SteamText } from "@/components/world/steam-text";
import { notFound } from "@/lib/content";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main" className="flex flex-1 items-center pt-[120px] pb-24">
        <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h1 className="display-1 on-tile max-w-[12ch] text-wall-ink">{notFound.title}</h1>
            <p className="lede on-tile mt-6 max-w-[40ch] text-wall-muted">{notFound.body}</p>
            <Button asChild size="lg" className="mt-9 pr-2.5 pl-6">
              <Link href="/">
                {notFound.cta}
                <CtaArrow />
              </Link>
            </Button>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Mirror shape="arch" seed={0x404} className="mx-auto aspect-[5/6] w-full max-w-[20rem]">
              <div className="flex h-full items-center justify-center pt-[12%]">
                <SteamText text={notFound.mirror} padX={20} padY={12} className="display-1 text-ink" />
              </div>
            </Mirror>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
