"use client";

import { useState } from "react";
import Image from "next/image";
import { Score } from "@/components/score";
import { VoteButtons } from "@/components/vote-buttons";
import { Verdict } from "@/components/verdict";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_COMMENT = 500; // same limit as the app's comments
const SHOWN = 3; // the card keeps the latest few, so it never grows past the stage
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
          People can agree, disagree or reply. Try replying to this one.
        </p>
        <form data-reveal style={{ "--i": 2 } as React.CSSProperties} onSubmit={post} className="mt-8 flex flex-col gap-2">
          <label htmlFor="demo-comment" className="text-[0.875rem] font-semibold">
            Add a comment
          </label>
          <textarea
            id="demo-comment"
            value={draft}
            maxLength={MAX_COMMENT}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post(e);
            }}
            placeholder="Add a comment"
            className="w-full resize-none rounded-md border border-input bg-raised px-3.5 py-3 text-base leading-relaxed text-spotlight caret-ketchup outline-none placeholder:text-faint focus-visible:border-mustard focus-visible:ring-2 focus-visible:ring-mustard/40"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.875rem] text-faint tabular-nums">{draft.length > 400 ? `${draft.length}/${MAX_COMMENT}` : ""}</p>
            <Button type="submit" size="lg" disabled={!draft.trim()} className="transition-transform active:scale-[0.97]">
              Post
            </Button>
          </div>
        </form>
      </div>

      <div data-reveal style={{ "--i": 1 } as React.CSSProperties} className="rounded-3xl bg-spotlight p-5 sm:p-10 lg:col-span-7 lg:p-12">
        <article data-ui aria-label="A take with its comments" className="mx-auto w-full max-w-[28rem] rounded-2xl bg-studio p-5 text-[0.875rem] text-spotlight">
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
            <VoteButtons ratingId="demo" facts={128} cap={9} mode="demo" />
          </div>

          <section /* taste-skill-ignore: the app's own comment divider, inside this data-ui card */ aria-labelledby="demo-comments-title" className="mt-4 border-t border-hairline pt-4">
            <h3 id="demo-comments-title" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
              Comments <span className="tabular-nums">· {total}</span>
            </h3>
            {/* Newest last, like the app; a new one rises in and is announced. */}
            <ul aria-live="polite" className="mt-1">
              {notes.slice(-SHOWN).map((n) => (
                <li key={n.id} className={cn("py-2.5", n.mine && "animate-[rise-in_260ms_var(--ease-out)]")}>
                  <p className="flex items-center gap-2">
                    <span aria-hidden className={cn("grid size-6 place-items-center rounded-full text-[0.75rem] font-semibold uppercase", n.mine ? "bg-mustard text-studio" : "bg-raised")}>
                      {n.handle[0]}
                    </span>
                    <span className="font-semibold">@{n.handle}</span>
                    <span className="text-faint">{n.when}</span>
                  </p>
                  <p className="mt-1 pl-8 text-[0.9375rem] leading-relaxed whitespace-pre-line wrap-anywhere">{n.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}
