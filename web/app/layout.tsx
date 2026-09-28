import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { site } from "@/lib/content";
import { resolveSiteUrl } from "@/lib/site-url";

/* Mona Sans carries every word on the site across its weight (200-900) and width (75-125%) axes. */
const mona = localFont({
  src: [
    {
      path: "../node_modules/@fontsource-variable/mona-sans/files/mona-sans-latin-standard-normal.woff2",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource-variable/mona-sans/files/mona-sans-latin-standard-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-mona",
  weight: "200 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 125%" }],
});

/* A marker hand, used only on post-it notes. */
const kalam = localFont({
  src: [
    { path: "../node_modules/@fontsource/kalam/files/kalam-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/kalam/files/kalam-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-kalam",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: {
    default: `${site.name} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d3f33",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mona.variable} ${kalam.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks the document as scripted before first paint, so sequenced mirror text can wait for its cue
            without ever hiding content from a visitor whose JavaScript does not run. */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute("data-js","")` }} />
      </head>
      <body className="relative min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-amber px-5 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to content
        </a>
        <Providers>
          <div className="relative z-[1] flex min-h-dvh flex-col">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
