"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { CheckIcon, DownloadIcon, FileSpreadsheetIcon, TriangleAlertIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/toaster";
import { cn } from "@/lib/utils";
import type { ImportCounts } from "@/lib/menu-import";
import { importMenu, type ImportState } from "./actions";

const plural = (n: number, one: string, many: string) => `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;
const kb = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

// Add many restaurants and dishes from an Excel sheet. Choosing a file checks it straight away: rows that need fixing are
// listed by their spreadsheet row, and a good sheet shows what an import would add before anything changes. The file stays
// in this component (not in a form), so confirming sends the very file that was checked.
export function ImportMenu() {
  const [state, dispatch, pending] = useActionState<ImportState, FormData>(async (_, data) => {
    const next = await importMenu(_, data);
    if (next.applied) toast("Menu imported");
    return next;
  }, {});
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function send(f: File, apply: boolean) {
    const data = new FormData();
    data.set("file", f);
    if (apply) data.set("apply", "1");
    startTransition(() => dispatch(data));
  }
  function choose(f: File | undefined) {
    if (!f) return;
    setFile(f);
    send(f, false);
  }
  function reset() {
    setFile(null);
    if (input.current) input.current.value = "";
  }

  const checking = pending && !!file && !state.counts?.dishes_new && !state.applied;
  const counts = state.counts;

  return (
    <div className="flex flex-col gap-4">
      <a href="/menu-template" download className="inline-flex w-fit min-h-10 items-center gap-2 rounded-md border border-hairline px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <DownloadIcon aria-hidden className="size-4 text-mustard" />
        Download the template
      </a>

      {!file ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            choose(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-[border-color,background-color] duration-150 has-focus-visible:ring-2 has-focus-visible:ring-ring",
            over ? "border-mustard bg-mustard/10" : "border-hairline hover:border-muted-foreground",
          )}
        >
          <span className="grid size-12 place-items-center rounded-full bg-raised">
            <UploadIcon aria-hidden className="size-6 text-mustard" />
          </span>
          <span className="font-semibold">Choose an Excel file</span>
          <span className="text-sm text-muted-foreground">or drop it here. An .xlsx with Restaurant, Area, City, Dish, Diet columns.</span>
          <input ref={input} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
        </label>
      ) : (
        <div className="flex flex-col gap-4 rounded-2xl border border-hairline bg-raised/40 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-raised">
              <FileSpreadsheetIcon aria-hidden className="size-5 text-mustard" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">{kb(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              aria-label="Remove this file"
              className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
            >
              <XIcon aria-hidden className="size-5" />
            </button>
          </div>

          <div aria-live="polite" className="flex flex-col gap-3">
            {checking ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Checking the file…
              </p>
            ) : state.error ? (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                {state.error}
              </p>
            ) : state.problems ? (
              <div className="flex flex-col gap-2">
                <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-destructive">
                  <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {plural(state.problems.length + (state.moreProblems ?? 0), "row needs", "rows need")} fixing. Nothing has been imported.
                </p>
                <ul className="max-h-56 divide-y divide-hairline overflow-y-auto rounded-lg border border-hairline text-sm">
                  {state.problems.map((p) => (
                    <li key={p.line} className="flex gap-3 px-3 py-2">
                      <span className="w-14 shrink-0 text-faint tabular-nums">Row {p.line}</span>
                      <span className="min-w-0 wrap-anywhere">{p.message}</span>
                    </li>
                  ))}
                </ul>
                {!!state.moreProblems && <p className="text-xs text-faint">…and {state.moreProblems} more. Fix these first and choose the file again.</p>}
              </div>
            ) : counts ? (
              <Summary counts={counts} applied={!!state.applied} />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {counts && !state.applied && !state.error && !state.problems && (
              <Button type="button" size="lg" disabled={pending || (counts.restaurants_new === 0 && counts.dishes_new === 0)} onClick={() => send(file, true)}>
                {pending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
                {counts.restaurants_new === 0 && counts.dishes_new === 0 ? "Nothing new to import" : `Import ${plural(counts.dishes_new + counts.restaurants_new, "new item", "new items")}`}
              </Button>
            )}
            <Button type="button" size="lg" variant={state.applied ? "default" : "ghost"} onClick={reset} disabled={pending}>
              {state.applied ? "Import another file" : "Choose a different file"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ counts: c, applied }: { counts: ImportCounts; applied: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={cn("flex items-center gap-2 text-sm font-semibold", applied ? "text-mustard" : "text-foreground")}>
        <CheckIcon aria-hidden className="size-4 shrink-0 text-mustard" strokeWidth={3} />
        {applied ? "Imported. These are live now." : "The file is fine. Here's what importing it will do:"}
      </p>
      <dl className="grid grid-cols-2 gap-2">
        {(
          [
            ["Restaurants", c.restaurants_new, c.restaurants_existing, "already listed"],
            ["Dishes", c.dishes_new, c.dishes_existing, "already on their menus"],
          ] as const
        ).map(([label, fresh, old, oldLabel]) => (
          <div key={label} className="rounded-xl border border-hairline bg-paper p-3">
            <dt className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">{label}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">
              {fresh.toLocaleString("en-IN")} <span className="text-sm font-medium text-muted-foreground">new</span>
            </dd>
            <dd className="text-xs text-muted-foreground tabular-nums">
              {old.toLocaleString("en-IN")} {oldLabel}
            </dd>
          </div>
        ))}
      </dl>
      {c.unknown_lists.length > 0 && (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-mustard" />
          <span>
            No food list called {c.unknown_lists.map((l) => `"${l}"`).join(", ")}. Those dishes are still added, and placed in a list by their name.
          </span>
        </p>
      )}
    </div>
  );
}
