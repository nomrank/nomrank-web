"use client";

import { useState } from "react";
import Image from "next/image";
import { Score } from "@/components/score";
import { VoteButtons } from "@/components/vote-buttons";
import { Verdict } from "@/components/verdict";
import { SendHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_COMMENT = 500; // same limit as the app's comments
const SHOWN = 3; // the card keeps the latest few, so it never grows past the stage
const REPLIES = ["4 is rookie numbers fr", "chutney > sambar, fight me", "underrated, go early"];
type Note = { id: number; handle: string; when: string; body: string; mine?: boolean };

// A take as it lands in the feed, with its comment thread. What the visitor posts joins the thread on the card,
// styled like the app's comments; nothing is sent anywhere.
export function TakeDemo() {
  const [draft, setDraft] = useState("4 is rookie numbers fr");
  const [notes, setNotes] = useState<Note[]>([{ id: 0, handle: "ExtraChutneyPls", when: "2h", body: "chutney > sambar here, don't @ me" }]);
  const total = notes.length;

  function post(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setNotes((all) => [...all, { id: all.length, handle: "you", when: "now", body, mine: true }]);
    setDraft("");
  }

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5">
        <h2 data-reveal className="text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance">
          Every take is up for debate.
        </h2>
        <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-5 max-w-[42ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          People can agree, disagree or reply. Type a reply on the card, or tap one of these.
        </p>
        <div data-reveal style={{ "--i": 2 } as React.CSSProperties} className="mt-8 flex flex-wrap gap-2">
          {REPLIES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDraft(r)}
              className="min-h-10 rounded-full border border-hairline bg-paper px-4 text-[0.875rem] font-medium text-muted-foreground transition-[border-color,color,transform] duration-150 hover:border-mustard hover:text-foreground focus-visible:ring-2 focus-visible:ring-mustard focus-visible:outline-none active:scale-[0.97]"
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div data-reveal style={{ "--i": 1 } as React.CSSProperties} className="rounded-3xl bg-spotlight light:bg-raised p-5 sm:p-10 lg:col-span-7 lg:p-12">
        <article data-ui aria-label="A take with its comments" className="mx-auto w-full max-w-[28rem] rounded-2xl bg-background p-5 text-[0.875rem] ring-1 ring-hairline text-foreground">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-10 place-items-center rounded-full bg-raised text-[1rem] font-semibold">
              S
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">@SambarSupremacist</p>
              <p className="text-muted-foreground">2d</p>
            </div>
            <Score score={8.5} size={52} />
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-[1rem] font-semibold">
            Idli sambar <Verdict score={8.5} />
          </p>
          <p className="text-muted-foreground">from Udupi Corner Tiffins</p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed">ordered 2, ended up eating 4. sambar refills just kept coming</p>
          <div className="mt-4 overflow-hidden rounded-lg">
            <Image
              src="/coming-soon/idli-sambar.jpg"
              alt="Idli with sambar on a banana leaf"
              width={560}
              height={373}
              sizes="(min-width: 640px) 28rem, 90vw"
              className="drift aspect-[2/1] w-full object-cover"
            />
          </div>
          <div className="mt-4">
            <VoteButtons ratingId="demo" facts={14} cap={6} mode="demo" />
          </div>

          <section /* taste-skill-ignore: the app's own comment divider, inside this data-ui card */ aria-labelledby="demo-comments-title" className="mt-4 border-t border-hairline pt-4">
            <h3 id="demo-comments-title" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
              Comments <span className="tabular-nums">· {total}</span>
            </h3>
            {/* Newest last, like the app; a new one rises in and is announced. */}
            <ul aria-live="polite" className="mt-3 flex flex-col gap-3">
              {notes.slice(-SHOWN).map((n) => (
                <li key={n.id} className={cn("flex items-start gap-2.5", n.mine && "animate-[rise-in_260ms_var(--ease-out)]")}>
                  <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[0.75rem] font-semibold uppercase", n.mine ? "bg-mustard text-studio" : "bg-raised")}>
                    {n.handle[0]}
                  </span>
                  <div className={cn("min-w-0 rounded-2xl rounded-tl-sm px-3 py-2", n.mine ? "bg-mustard/15 ring-1 ring-mustard/40" : "bg-raised")}>
                    <p className="flex items-center gap-2 text-[0.8125rem]">
                      <span className="font-semibold">@{n.handle}</span>
                      <span className="text-faint">{n.when}</span>
                    </p>
                    <p className="mt-0.5 text-[0.9375rem] leading-snug whitespace-pre-line wrap-anywhere">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <form onSubmit={post} className="mt-3 flex items-end gap-1.5 rounded-2xl border border-input bg-raised p-1.5 transition-colors focus-within:border-mustard">
              <textarea
                value={draft}
                maxLength={MAX_COMMENT}
                rows={1}
                aria-label="Add a comment"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) post(e);
                }}
                placeholder="Add a comment"
                className="max-h-24 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2.5 py-2 text-base leading-snug text-foreground caret-ketchup outline-none placeholder:text-faint [field-sizing:content]"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Post comment"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-ketchup text-studio transition-[transform,opacity] duration-150 focus-visible:ring-2 focus-visible:ring-mustard focus-visible:outline-none enabled:active:scale-90 disabled:opacity-40"
              >
                <SendHorizontalIcon aria-hidden className="size-4" />
              </button>
            </form>
          </section>
        </article>
      </div>
    </div>
  );
}
