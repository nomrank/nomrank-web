"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// A thin ketchup bar along the top while a tapped link loads, so a tap never looks ignored. It creeps towards the end
// while waiting and fills when the new page arrives. Any same-site link counts, except new tabs and same-page anchors.
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page (or an #anchor)
      setState("loading");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The new page is here (the URL changed): fill the bar, then fade it out.
  const url = `${pathname}?${search}`;
  const [seen, setSeen] = useState(url);
  if (url !== seen) {
    setSeen(url);
    if (state === "loading") setState("done");
  }
  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => setState("idle"), 400);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className="h-full origin-left bg-ketchup shadow-[0_0_8px_rgb(255_75_58/0.6)]"
        style={{
          transform: `scaleX(${state === "idle" ? 0 : state === "loading" ? 0.85 : 1})`,
          opacity: state === "done" ? 0 : state === "idle" ? 0 : 1,
          // Loading creeps slowly (it can't know how long the server takes); done snaps to full, then fades.
          transition:
            state === "loading"
              ? "transform 8s cubic-bezier(0.1, 0.7, 0.2, 1), opacity 150ms"
              : state === "done"
                ? "transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms 150ms"
                : "none",
        }}
      />
    </div>
  );
}
