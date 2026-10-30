"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { CheckIcon, FlagIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { REPORT_REASONS } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { sendReport, type ReportState } from "@/app/report-actions";

type Props = {
  targetType: "rating" | "comment" | "dish" | "space";
  targetId: string;
  what: string; // "this take", "this comment", "this dish"
  signedIn: boolean;
  className?: string;
};

// A quiet "Report" that opens a short form: a reason, an optional note, send. Signed out, it leads to sign-in.
export function ReportButton({ targetType, targetId, what, signedIn, className }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState<ReportState, FormData>(sendReport, {});
  const [reason, setReason] = useState("");
  const cls = cn(
    "inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
    className,
  );

  if (!signedIn)
    return (
      <Link href="/login" className={cls}>
        <FlagIcon aria-hidden className="size-3.5" />
        Report
      </Link>
    );

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={cls}>
        <FlagIcon aria-hidden className="size-3.5" />
        Report
      </button>
      <dialog
        ref={dialog}
        aria-label={`Report ${what}`}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-hairline bg-paper p-0 text-foreground backdrop:animate-[fade-in_200ms_var(--ease-out)] backdrop:bg-studio/80 backdrop:backdrop-blur-sm open:animate-[rise-in_220ms_var(--ease-out)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline p-4">
          <h2 className="font-semibold">Report {what}</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <XIcon aria-hidden className="size-4" />
          </button>
        </div>

        {state.sent ? (
          <div className="p-4" role="status">
            <p className="flex items-center gap-2 font-semibold">
              <CheckIcon aria-hidden className="size-4 animate-[check-pop_420ms_var(--ease-out)_both] text-mustard" />
              Thanks, we&apos;ll take a look.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Reports are private. The person won&apos;t know it was you.</p>
            <Button type="button" variant="secondary" size="lg" className="mt-4" onClick={() => dialog.current?.close()}>
              Done
            </Button>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4 p-4">
            <input type="hidden" name="target_type" value={targetType} />
            <input type="hidden" name="target_id" value={targetId} />
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">What&apos;s wrong?</legend>
              <div className="flex flex-col gap-1.5">
                {REPORT_REASONS[targetType].map((r) => (
                  <label
                    key={r.value}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      reason === r.value ? "border-mustard bg-mustard/10" : "border-hairline hover:bg-muted",
                    )}
                  >
                    <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="accent-[var(--mustard)]" />
                    <span className="min-w-0">
                      <span className="block font-semibold">{r.label}</span>
                      {r.hint && <span className="block text-xs text-muted-foreground">{r.hint}</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              <span>
                Anything else? <span className="font-medium text-muted-foreground">(optional)</span>
              </span>
              <AutoTextarea
                name="note"
                rows={2}
                maxLength={300}
                className="w-full rounded-md border border-input bg-raised px-3 py-2 text-base font-normal focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
            </label>
            {state.error && <FieldError>{state.error}</FieldError>}
            <Button type="submit" size="lg" disabled={pending || !reason}>
              {pending && <Spinner data-icon="inline-start" />}
              Send report
            </Button>
          </form>
        )}
      </dialog>
    </>
  );
}
