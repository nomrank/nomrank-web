import { ImageResponse } from "next/og";
import { formatScore, scoreHeat } from "./ratings";
import { HEAD_ASPECT, markUri } from "./logo";

// Link previews (WhatsApp, Instagram, X…): one 1200×630 card in the Nomrank look. Rendered by next/og, which
// understands a small subset of CSS: flex layout and plain colours only (no CSS variables).

export const OG_SIZE = { width: 1200, height: 630 };

const STUDIO = "#17111c";
const PAPER = "#211a27";
const SPOTLIGHT = "#fff4ea";
const MUTED = "#b3a8b9";
const KETCHUP = "#ff4b3a";

// The score colour as plain RGB: ketchup (low) to mustard (high), the same blend as the app.
function scoreRgb(score: number) {
  const t = scoreHeat(score);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(255, ${mix(75, 194)}, ${mix(58, 60)})`;
}

type Card = {
  eyebrow: string; // "Dish" / "Take" / "Rankings" / "Profile"
  title: string;
  subtitle?: string;
  body?: string; // a quote or a short list, a few lines at most
  score?: number | null;
  scoreNote?: string; // under the sticker: "12 ratings"
  photo?: string | null;
};

// Fonts for the card (the built-in font is regular only): Geist for text and Plus Jakarta Sans for the wordmark, as in the app. Fetched once per server process as TTF (Google Fonts serves TTF to clients that don't ask for
// woff2). If the fetch fails, the card still renders in the built-in font.
type Font = { name: string; data: ArrayBuffer; weight: 400 | 500 | 800; style: "normal" };
let fonts: Promise<Font[]> | null = null;

async function googleFont(family: string, weight: Font["weight"]): Promise<Font | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}:wght@${weight}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return { name: family, data: await (await fetch(url)).arrayBuffer(), weight, style: "normal" };
  } catch {
    return null;
  }
}

export function loadFonts() {
  fonts ??= Promise.all([googleFont("Geist", 500), googleFont("Geist", 800), googleFont("Plus Jakarta Sans", 800)]).then((list) =>
    list.filter((f): f is Font => f !== null),
  );
  return fonts;
}

// The mark for generated images (icons, cards), as a picture of the same SVG the app draws.
// `head` is just the fox's head and scarf, for sizes too small to read the hand and the sparkle.
export function Mark({ size, head = false }: { size: number; head?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img
  return <img src={markUri(head)} alt="" width={head ? Math.round(size * HEAD_ASPECT) : size} height={size} />;
}

export async function ogCard({ eyebrow, title, subtitle, body, score, scoreNote, photo }: Card) {
  const loaded = await loadFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: STUDIO, color: SPOTLIGHT, fontFamily: "Geist", fontWeight: 500 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 64px 56px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: KETCHUP }}>{eyebrow}</div>
            <div style={{ display: "flex", marginTop: 18, fontSize: title.length > 28 ? 60 : 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
              {title.length > 60 ? `${title.slice(0, 58)}…` : title}
            </div>
            {subtitle && <div style={{ display: "flex", marginTop: 18, fontSize: 32, color: MUTED }}>{subtitle}</div>}
            {body && (
              <div style={{ display: "flex", marginTop: 30, fontSize: 30, lineHeight: 1.4, color: SPOTLIGHT, maxWidth: photo ? 560 : 860, whiteSpace: "pre-wrap" }}>
                {body.length > 160 ? `${body.slice(0, 158)}…` : body}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "Plus Jakarta Sans", fontWeight: 800, fontSize: 40, letterSpacing: -1.4 }}>
            <Mark size={68} />
            <span style={{ marginLeft: 12 }}>nomrank</span>
            <span style={{ marginLeft: 18, fontFamily: "Geist", fontSize: 24, fontWeight: 500, color: MUTED, letterSpacing: 0 }}>Rate the dish, not the place.</span>
          </div>
        </div>
        {(photo || score != null) && (
          <div style={{ width: 400, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: PAPER }}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element -- next/og renders plain img
              <img src={photo} alt="" width={400} height={630} style={{ width: 400, height: 630, objectFit: "cover" }} />
            )}
            {score != null && (
              <div
                style={{
                  position: "absolute",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 210,
                  height: 210,
                  borderRadius: 999,
                  background: scoreRgb(score),
                  color: STUDIO,
                  transform: "rotate(-8deg)",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.45)",
                  ...(photo ? { bottom: 40, left: -70 } : {}),
                }}
              >
                <div style={{ display: "flex", fontSize: 84, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>{formatScore(score)}</div>
                <div style={{ display: "flex", fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>{scoreNote ?? "/ 10"}</div>
              </div>
            )}
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: loaded },
  );
}
