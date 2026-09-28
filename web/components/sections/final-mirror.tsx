"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { Mirror } from "@/components/world/mirror";
import { SteamText } from "@/components/world/steam-text";

export function FinalMirror({ title, id }: { title: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const play = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  return (
    <div ref={ref} className="w-full max-w-[54rem]">
      <Mirror shape="rect" seed={0x5eed} className="aspect-[16/10] w-full sm:aspect-[16/7]">
        <div className="flex h-full items-center justify-center px-[8%]">
          <SteamText
            as="h2"
            id={id}
            text={title}
            play={play}
            delay={250}
            perWord={210}
            padX={22}
            padY={14}
            className="display-1 text-ink"
            style={{ fontSize: "clamp(2.4rem, 6.4vw, 5.6rem)" }}
          />
        </div>
      </Mirror>
    </div>
  );
}
