import { Container } from "@/components/site/container";
import { PostIt } from "@/components/world/post-it";
import { RepMirror } from "@/components/sections/rep-mirror";
import { beforeAfter, together, togetherExtras } from "@/lib/content";

const [rooms, dares, clip] = together.features;
const TILTS = [-3, 2.5, -1.5, 3, -2.5, 1.5];

export function Together() {
  return (
    <section aria-labelledby="together-title" className="relative py-24 sm:py-32">
      <Container>
        <div className="max-w-[40rem]">
          <h2 id="together-title" className="display-2 on-tile text-wall-ink">
            {together.title}
          </h2>
          <p className="lede on-tile mt-5 max-w-[40ch] text-wall-muted">{together.sub}</p>
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* The before-and-after: the same dare, first rep and tenth. */}
          <figure className="lg:col-span-7">
            <p className="on-tile text-[1.0625rem] font-semibold text-wall-ink">{beforeAfter.dare}</p>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
              <RepMirror label={beforeAfter.first.label} line={beforeAfter.first.line} density={1.35} tilt={-4} hesitant />
              <RepMirror label={beforeAfter.tenth.label} line={beforeAfter.tenth.line} density={0.6} tilt={3} />
            </div>
            <figcaption className="mt-8 max-w-[52ch]">
              <span className="display-3 on-tile block text-wall-ink">{clip.title}</span>
              <span className="on-tile mt-2 block text-[1.0625rem] leading-relaxed text-wall-muted">
                {clip.body} {beforeAfter.caption}
              </span>
            </figcaption>
          </figure>

          {/* Dares, stuck to the wall. */}
          <div className="lg:col-span-5">
            <h3 className="display-3 on-tile text-wall-ink">{togetherExtras.daresTitle}</h3>
            <p className="on-tile mt-2 max-w-[40ch] text-[1.0625rem] leading-relaxed text-wall-muted">{dares.body}</p>
            <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5">
              {together.dares.map((d, i) => (
                <li key={d.title} className={i % 2 ? "translate-y-3" : undefined}>
                  <PostIt tilt={TILTS[i % TILTS.length]} className="flex min-h-[8.5rem] flex-col justify-between px-4 pt-3.5 pb-3.5">
                    <p className="text-[1.1rem] leading-snug font-bold">{d.title}</p>
                    <p className="mt-2 text-[0.95rem]">{d.tag}</p>
                  </PostIt>
                </li>
              ))}
            </ul>

            <h3 className="display-3 on-tile mt-16 text-wall-ink">{rooms.title}</h3>
            <p className="on-tile mt-2 max-w-[40ch] text-[1.0625rem] leading-relaxed text-wall-muted">{rooms.body}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
