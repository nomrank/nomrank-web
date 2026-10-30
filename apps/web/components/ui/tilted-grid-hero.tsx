"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ── the curved row ──────────────────────────────────────────────
 * Scroll Tilted Grid turned on its side, with the tilt drawn as a curve.
 * One row of images streams from right to left around the inside of a
 * cylinder. The centre faces you flat, the ends bend toward you so each
 * end image curves along its length, and the ends fade into the page.
 *
 * Each tile is one flat card, and one rotateY about the cylinder's axis
 * carries it along the arc, so the cards lean in toward you at the ends
 * (a coverflow) rather than bending along their length. Only a tile's
 * delay differs, and that sets where on the arc it sits. The band is transform-only on the compositor. The fade
 * is two plain gradients laid over it, in the page's colour, not a mask: a
 * mask on the 3D band opened a transparent seam at the fade's start, a dark
 * bar the tiles slid through.
 *
 * The only JS is a ResizeObserver that sizes the loop. There is one tile per
 * image and a tile never changes its image: swapping on animationiteration
 * lands late on a busy main thread, in view, and reads as a flicker.
 * ─────────────────────────────────────────────────────────────── */

// Strips per tile. One, so each card is a single flat layer tilted on the arc.
// More strips would bend a card along its length, but each strip held its own
// 3D transform inside the tilting tile, and that nesting made a dark bar
// flicker through the cards at one spot on desktop screens, in every browser.
// Raise it only if you also keep the strips out of a nested 3D context.
const SLICES = 1;

// Camera distance from the screen, as a multiple of the cylinder's radius.
// Just past the axis, so the ends come right up to the lens and swell; much
// further back and the row flattens out however tight the cylinder.
const CAMERA = 1.6;

/**
 * Cylinder radius, as a share of the hero's width, that puts the frame's
 * edge `bend` radians round the arc as seen through the camera:
 * r·sinθ · CAMERA / (CAMERA − 1 + cosθ) = width / 2, solved for r.
 */
function arc(bend: number) {
  return (CAMERA - 1 + Math.cos(bend)) / (2 * CAMERA * Math.sin(bend));
}

/**
 * Lays the loop on the cylinder. The radius puts the frame's edge `bend`
 * radians round the arc (see `arc`). Angles come back in degrees: `unit`
 * is the arc one tile-height spans, `limit` how far round a tile's centre
 * can go before the whole tile is off-screen, and `sweep` how far round
 * the loop's ends sit. The loop reaches past `limit`, so a tile only ever
 * wraps out of sight, is rounded up to a whole number of tiles so the gap
 * never stretches, and holds at least `count` tiles so every image gets one.
 */
function measure(
  width: number,
  height: number,
  tile: number,
  aspect: number,
  gap: number,
  bend: number,
  maxWidth: number,
  count: number,
) {
  const h = Math.min((tile / 100) * height, ((maxWidth / 100) * width) / aspect);
  const radius = width * arc(bend);
  if (!(h > 0) || !(radius > 0))
    return { columns: 2, sweep: 0, unit: 0, limit: 0 };
  const deg = (rad: number) => (rad * 180) / Math.PI;
  const unit = deg(h / radius);
  const pitch = (aspect + gap / 100) * unit;
  // A little past the frame, so its strips are drawn before it comes on. Capped:
  // a wide tile on a phone would otherwise reach behind the camera first.
  const half = (aspect * unit) / 2;
  const limit = deg(bend) + half + Math.min(half, 6);
  // Capped so a hero squeezed to a sliver can't mount thousands of tiles.
  const columns = Math.min(60, Math.max(2, count, Math.ceil((2 * limit) / pitch)));
  const round = (n: number) => +n.toFixed(4);
  const sweep = round((columns * pitch) / 2);
  return {
    columns,
    sweep,
    unit: round(unit),
    limit: round(Math.min(sweep, limit)),
  };
}

export type TiltedGridImage = {
  src: string;
  /** Only used if you drop the decorative treatment; the band is aria-hidden. */
  alt?: string;
  /**
   * Printed on the photo, inside every strip, so it moves with the image. It
   * fills the tile, so position its parts absolutely.
   */
  overlay?: React.ReactNode;
};

export type TiltedGridHeroProps = {
  /**
   * Images run along the row in order, one tile each, so the whole list
   * plays through. Short lists simply repeat.
   */
  images: TiltedGridImage[];
  /**
   * Seconds for the row to advance by one tile. Speed is per tile, not per
   * crossing, so a phone and an ultrawide move at the same pace.
   * @default 4
   */
  speed?: number;
  /** Tile height, as a percentage of the hero's height. @default 26 */
  tileHeight?: number;
  /** Tile width divided by tile height. @default 16 / 9 */
  aspectRatio?: number;
  /**
   * Widest a tile may be, as a percentage of the hero's width, so a phone
   * still shows its neighbours. @default 55
   */
  maxWidth?: number;
  /** Space between tiles, as a percentage of a tile's height. @default 6 */
  gap?: number;
  /** Vertical centre of the row, as a percentage of the hero's height. @default 56 */
  axis?: number;
  /**
   * How far the row has bent round by the frame's edge, in degrees. Higher
   * curls the ends harder toward the viewer. Clamped to 5–85.
   * @default 80
   */
  curve?: number;
  /** Width of the fade at each end, as a percentage of the hero's width. @default 12 */
  fade?: number;
  /** Content rendered above the band. */
  children?: React.ReactNode;
  className?: string;
};

export function TiltedGridHero({
  images,
  speed = 4,
  tileHeight = 26,
  aspectRatio = 16 / 9,
  maxWidth = 55,
  gap = 6,
  axis = 56,
  curve = 80,
  fade = 12,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & TiltedGridHeroProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const orbit = `tgh-o-${id}`;
  const tile = `tgh-t-${id}`;
  const bend = (Math.min(85, Math.max(5, curve)) * Math.PI) / 180;
  const count = images.length;

  // Null until the observer has measured the hero. No tiles mount until
  // then, so a first paint laid out for the wrong size never shows.
  const [layout, setLayout] = React.useState<ReturnType<typeof measure> | null>(
    null,
  );

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const next = measure(width, height, tileHeight, aspectRatio, gap, bend, maxWidth, count);
      setLayout((prev) =>
        prev?.columns === next.columns &&
        prev.sweep === next.sweep &&
        prev.unit === next.unit
          ? prev
          : next,
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileHeight, aspectRatio, gap, bend, maxWidth, count]);

  const { columns, sweep, limit } =
    layout ??
    measure(1200, 560, tileHeight, aspectRatio, gap, bend, maxWidth, count);

  // Every length is a multiple of the tile's height, which follows the
  // hero's height until maxWidth caps it on narrow screens.
  const u = (n: number) =>
    `calc(${+n.toFixed(4)} * min(${tileHeight}cqh, ${+(
      maxWidth / aspectRatio
    ).toFixed(4)}cqw))`;

  const r = 100 * arc(bend);
  const radius = `${+r.toFixed(3)}cqw`;
  // Out to the axis, round it, back in: a box sits on the cylinder at the
  // angle rotateY gives it.
  const turn = (deg: number) =>
    `translateZ(${radius}) rotateY(${+deg.toFixed(4)}deg) translateZ(-${radius})`;

  // Beyond `limit` a tile is wholly off-screen, so it is hidden there. The
  // loop's ends, where it wraps, fall inside that stretch, and so do tiles
  // swinging round behind the camera.
  const hide = +(((sweep - limit) / (2 * sweep || 1)) * 100).toFixed(4);
  const css =
    `@keyframes ${orbit}{` +
    `from{transform:${turn(-sweep)}}to{transform:${turn(sweep)}}` +
    `0%,${hide}%,${100 - hide}%,100%{visibility:hidden}` +
    `${hide + 0.001}%,${100 - hide - 0.001}%{visibility:visible}}` +
    // Pausing rather than removing the motion keeps the band whole: every
    // tile is already placed by its negative delay, so it freezes as a
    // finished still.
    `@media(prefers-reduced-motion:reduce){.${tile}{animation-play-state:paused}}`;

  const share = aspectRatio / SLICES;
  const duration = columns * speed;

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
      style={{ containerType: "size", ...props.style }}
    >
      <style>{css}</style>

      <div
        // Tiles line up only by sharing a start time, so a change in their
        // number remounts them all rather than adding one that starts late.
        key={columns}
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: layout ? 1 : 0,
          // A shared vanishing point on the row's centre line, so the ends
          // grow evenly above and below it as they come toward the viewer.
          perspective: `${+(r * CAMERA).toFixed(3)}cqw`,
          perspectiveOrigin: `50% ${axis}%`,
        }}
      >
        {Array.from({ length: layout ? columns : 0 }, (_, t) => {
          // Tile `columns - 1` starts nearest the exit and tile 0 furthest
          // back, so this numbers tiles in the order they come on.
          const img = images[(columns - 1 - t) % Math.max(count, 1)];
          return (
            <div
              key={t}
              className={cn(tile, "absolute")}
              style={{
                left: `calc(50% - ${u(aspectRatio / 2)})`,
                top: `calc(${axis}% - ${u(0.5)})`,
                width: u(aspectRatio),
                height: u(1),
                // Tile t starts t tiles along the loop.
                animation: `${orbit} ${duration}s linear ${-t * speed}s infinite`,
              }}
            >
              {Array.from({ length: SLICES }, (_, k) => {
                return (
                <div
                  key={k}
                  className={cn(
                    "absolute top-0 overflow-hidden bg-muted",
                    k === 0 && "rounded-l-lg",
                    k === SLICES - 1 && "rounded-r-lg",
                  )}
                  style={{
                    // With one strip it is the tile itself: no 3D of its own.
                    left: u((aspectRatio - share) / 2),
                    width: u(share),
                    height: u(1),
                  }}
                >
                  {img ? (
                    <div
                      className="absolute top-0"
                      style={{
                        left: u(-k * share),
                        width: u(aspectRatio),
                        height: u(1),
                      }}
                    >
                      <img
                        src={img.src}
                        alt={k === 0 ? (img.alt ?? "") : ""}
                        draggable={false}
                        decoding="sync"
                        className="size-full max-w-none object-cover"
                      />
                      {img.overlay}
                    </div>
                  ) : null}
                </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          aria-hidden
          className="pointer-events-none absolute inset-y-0"
          style={{
            [side]: 0,
            width: `${fade}%`,
            background: `linear-gradient(to ${side === "left" ? "right" : "left"}, var(--background), transparent)`,
          }}
        />
      ))}

      {children}
    </div>
  );
}

export default TiltedGridHero;
