"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { Mirror } from "@/components/world/mirror";
import { SteamText } from "@/components/world/steam-text";
import { PostIt } from "@/components/world/post-it";
import { cn } from "@/lib/utils";

/** One rep of a dare, written into its own small mirror. The first rep is foggier and less sure. */
export function RepMirror({
  label,
  line,
  density,
  tilt,
  hesitant = false,
}: {
  label: string;
  line: string;
  density: number;
  tilt: number;
  hesitant?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const play = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  return (
    <div ref={ref} className="relative pt-4">
      <Mirror shape="arch" density={density} seed={hesitant ? 0x1a1 : 0x10a} className="aspect-[5/4.6] w-full sm:aspect-[5/5.6]">
        <div className="flex h-full flex-col justify-end px-[9%] pb-[12%]">
          <SteamText
            text={line}
            play={play}
            delay={hesitant ? 200 : 900}
            perWord={hesitant ? 150 : 90}
            className={cn(
              "text-[clamp(0.98rem,1.35vw,1.15rem)] leading-[1.4] text-ink [font-stretch:96%]",
              hesitant ? "font-[470]" : "font-[680]",
            )}
          />
        </div>
      </Mirror>
      <PostIt tilt={tilt} className="absolute top-0 left-[8%] px-3.5 pt-1.5 pb-2 text-[1.2rem] font-bold">
        {label}
      </PostIt>
    </div>
  );
}
