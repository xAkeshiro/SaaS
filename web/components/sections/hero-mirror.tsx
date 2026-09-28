"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowCounterClockwise, Check } from "@phosphor-icons/react";
import { Mirror } from "@/components/world/mirror";
import { SteamText } from "@/components/world/steam-text";
import { PostIt } from "@/components/world/post-it";
import { heroMirror, rehearsalWindow as rw } from "@/lib/content";
import { cn } from "@/lib/utils";

/*
 * The first viewport's one authored moment. The other person's line clears through the steam at
 * speaking pace, your reply follows, they give ground, and the debrief lands as two notes.
 * Plays once per visit; "Play it again" re-fogs and replays. Reduced motion shows the final state.
 */

const [L1, L2, L3] = rw.transcript;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

// Speaking pace: the other person is slower and guarded; you are rehearsed.
const T = (() => {
  const line1 = { delay: 520, per: 118 };
  const line1End = line1.delay + words(L1.text) * line1.per;
  const line2 = { delay: line1End + 620, per: 84 };
  const line2End = line2.delay + words(L2.text) * line2.per;
  const line3 = { delay: line2End + 980, per: 150 };
  const line3End = line3.delay + words(L3.text) * line3.per;
  const noteA = line3End + 420;
  const noteB = noteA + 520;
  return { line1, line2, line3, noteA, noteB, end: noteB + 600 };
})();

export function HeroMirror() {
  const reduce = useReducedMotion();
  const [round, setRound] = useState(0);
  const [play, setPlay] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = window.setTimeout(() => setPlay(true), 180);
    const finish = window.setTimeout(() => setDone(true), reduce ? 400 : T.end);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(finish);
    };
  }, [round, reduce]);

  function replay() {
    setDone(false);
    setPlay(false);
    setRound((r) => r + 1);
  }

  return (
    <figure className="relative mx-auto w-full max-w-[30rem] lg:ml-auto lg:mr-0">
      <div className="relative">
        <Mirror shape="arch" seed={0x2f91} className="aspect-[5/7] w-full sm:aspect-[5/6.5]">
          <div key={round} className="flex h-full flex-col px-[7%] pt-[22%] pb-[12%] sm:px-[8%] sm:pt-[24%]">
            <SteamText
              as="p"
              text={`${rw.persona.who} · ${rw.persona.mood}`}
              wipe={false}
              className="self-center text-center text-[0.8125rem] font-semibold text-ink-muted"
            />
            <div className="mt-[9%] flex flex-col gap-[6%]">
              <Line speaker={L1.speaker} text={L1.text} play={play} delay={T.line1.delay} perWord={T.line1.per} />
              <Line speaker={L2.speaker} text={L2.text} play={play} delay={T.line2.delay} perWord={T.line2.per} you />
              <Line speaker={L3.speaker} text={L3.text} play={play} delay={T.line3.delay} perWord={T.line3.per} />
            </div>
          </div>
        </Mirror>

        {/*
          The debrief lands as notes stuck to the glass and frame. On phones they sit on the bottom rail,
          side by side, so they never cover a line of the rehearsal; from sm up they overlap the glass.
        */}
        <div className="relative z-10 -mt-7 flex items-start gap-2.5 px-0.5 sm:static sm:mt-0 sm:block sm:px-0">
          <PostIt
            key={`a-${round}`}
            play={play}
            delay={T.noteA}
            tilt={-4}
            className="w-[46%] shrink-0 px-3.5 pt-3 pb-3.5 sm:absolute sm:bottom-[9%] sm:-left-[9%] sm:w-[47%] sm:min-w-[11rem] sm:px-4 sm:pt-3.5 sm:pb-4 lg:-left-[12%]"
          >
            <p className="text-[1.05rem] leading-none font-bold sm:text-[1.15rem]">{heroMirror.debriefNote}</p>
            <ul className="mt-2 flex flex-col gap-0.5 text-[0.95rem] leading-snug sm:text-[1rem]">
              {heroMirror.debriefLines.map((l) => (
                <li key={l}>{l}</li>
              ))}
              <li className="flex items-center gap-1.5">
                {heroMirror.heldLine}
                <Check weight="bold" className="size-4 shrink-0 text-wall" aria-label="yes" />
              </li>
            </ul>
          </PostIt>
          <PostIt
            key={`b-${round}`}
            play={play}
            delay={T.noteB}
            tilt={2.5}
            className="mt-5 min-w-0 flex-1 px-3.5 pt-3 pb-3.5 sm:absolute sm:-bottom-[7%] sm:left-[34%] sm:mt-0 sm:w-[57%] sm:min-w-[12rem] sm:flex-none sm:px-4 sm:pt-3.5 sm:pb-4"
          >
            <p className="text-[1.05rem] leading-none font-bold sm:text-[1.15rem]">{heroMirror.nextNote}</p>
            <p className="mt-2 text-[0.98rem] leading-snug sm:text-[1.05rem]">
              &ldquo;{rw.debrief.next[0]}&rdquo;
            </p>
          </PostIt>
        </div>
      </div>

      <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-1 sm:mt-[13%]">
        <span className="text-sm text-wall-muted">
          <span className="pointer-coarse:hidden">{heroMirror.hintPointer}</span>
          <span className="hidden pointer-coarse:inline">{heroMirror.hintTouch}</span>
        </span>
        <button
          type="button"
          onClick={replay}
          disabled={!done}
          className={cn(
            "press inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-sm font-semibold text-wall-ink transition-[opacity,background-color] duration-200 hover:bg-white/[0.08]",
            done ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={!done}
          tabIndex={done ? 0 : -1}
        >
          <ArrowCounterClockwise weight="bold" className="size-4" />
          {heroMirror.replay}
        </button>
      </figcaption>
    </figure>
  );
}

function Line({
  speaker,
  text,
  play,
  delay,
  perWord,
  you = false,
}: {
  speaker: string;
  text: string;
  play: boolean;
  delay: number;
  perWord: number;
  you?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", you ? "items-end text-right" : "items-start text-left")}>
      <SteamText
        as="span"
        text={speaker}
        play={play}
        delay={Math.max(0, delay - 220)}
        perWord={60}
        wipe={false}
        className="text-[0.8125rem] font-semibold text-ink-muted"
      />
      <SteamText
        as="p"
        text={text}
        play={play}
        delay={delay}
        perWord={perWord}
        className={cn(
          "text-[0.97rem] leading-[1.4] font-[560] text-ink [font-stretch:96%] sm:text-[1.0625rem] sm:leading-[1.42]",
          you ? "max-w-[92%]" : "max-w-[94%]",
        )}
      />
    </div>
  );
}
