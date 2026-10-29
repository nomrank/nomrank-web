"use client";

import { useActionState, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowBigDownIcon, ArrowBigUpIcon } from "lucide-react";
import type { Comment, CommentVote, Thread } from "@/lib/comments";
import { toggleVote } from "@/lib/votes";
import { AGREE_CRUMBS, DISAGREE_CRUMBS, burst } from "@/lib/burst";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Spinner } from "@/components/ui/spinner";
import { RollingCount } from "@/components/vote-buttons";
import { PersonLink } from "@/components/avatar";
import { ReportButton } from "@/components/report-button";
import { addComment, castCommentVote, deleteComment, type CommentState } from "@/app/comment-actions";
import { toast } from "@/components/toaster";

type Props = { ratingId: string; threads: Thread[]; votes: Record<string, CommentVote>; viewer: string | null };

export function Comments({ ratingId, threads, votes, viewer }: Props) {
  // Comments already here on arrival stay still; ones that appear afterwards rise in.
  const [seen] = useState(() => new Set(threads.flatMap((t) => [t.id, ...t.replies.map((r) => r.id)])));
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const total = threads.reduce((n, t) => n + 1 + t.replies.length, 0);

  return (
    <section id="comments" aria-labelledby="comments-title" className="mt-2 border-t border-hairline pt-5">
      <h2 id="comments-title" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
        Comments {total > 0 && <span className="tabular-nums">· {total}</span>}
      </h2>

      {viewer ? (
        <Composer ratingId={ratingId} placeholder="Add a comment" className="mt-4" />
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
            Sign in
          </Link>{" "}
          to join in.
        </p>
      )}

      {threads.length ? (
        <ul className="mt-2">
          {threads.map((t) => (
            <li key={t.id} className={cn("py-3", !seen.has(t.id) && "animate-[rise-in_260ms_var(--ease-out)]")}>
              <CommentItem comment={t} mine={votes[t.id]} viewer={viewer} onReply={viewer ? () => setReplyTo(replyTo === t.id ? null : t.id) : undefined} />
              {(t.replies.length > 0 || replyTo === t.id) && (
                <ul className="mt-3 ml-3.5 border-l border-hairline pl-4">
                  {t.replies.map((r) => (
                    <li key={r.id} className={cn("py-2", !seen.has(r.id) && "animate-[rise-in_260ms_var(--ease-out)]")}>
                      <CommentItem comment={r} mine={votes[r.id]} viewer={viewer} />
                    </li>
                  ))}
                  {replyTo === t.id && (
                    <li className="py-2">
                      <Composer
                        ratingId={ratingId}
                        parentId={t.id}
                        placeholder={`Reply to @${t.author.username}`}
                        autoFocus
                        onDone={() => setReplyTo(null)}
                      />
                    </li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-sm text-muted-foreground">No comments yet.</p>
      )}
    </section>
  );
}

type ItemProps = { comment: Comment; mine?: CommentVote; viewer: string | null; onReply?: () => void };

function CommentItem({ comment: c, mine, viewer, onReply }: ItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const own = viewer === c.author.username;

  return (
    <article className={cn(deleting && "opacity-50")}>
      <header className="flex items-center gap-2 text-sm">
        <PersonLink handle={c.author.username} avatar={c.author.avatar} photo={c.author.avatar_path} />
        <time dateTime={c.created_at} className="shrink-0 text-faint">
          {timeAgo(c.created_at)}
        </time>
      </header>
      <p className="mt-1.5 pl-8 text-[0.9375rem] leading-relaxed whitespace-pre-line wrap-anywhere">{c.body}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1 pl-6 text-sm text-muted-foreground">
        <CommentVotes comment={c} mine={mine} mode={!viewer ? "signed-out" : own ? "own" : "vote"} />
        {onReply && (
          <button type="button" onClick={onReply} className="min-h-9 rounded-md px-2 font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            Reply
          </button>
        )}
        {viewer && !own && <ReportButton targetType="comment" targetId={c.id} what="this comment" signedIn className="ml-auto" />}
        {own &&
          (confirming ? (
            <>
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    await deleteComment(c.id);
                    toast("Comment deleted");
                  })
                }
                className="min-h-9 rounded-md px-2 font-semibold text-destructive hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                Delete it
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="min-h-9 rounded-md px-2 font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                Keep
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="min-h-9 rounded-md px-2 font-medium hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              Delete
            </button>
          ))}
      </div>
    </article>
  );
}

const SIDES = {
  like: { label: "Like", Icon: ArrowBigUpIcon, on: "text-mustard", crumbs: AGREE_CRUMBS },
  dislike: { label: "Dislike", Icon: ArrowBigDownIcon, on: "text-ketchup", crumbs: DISAGREE_CRUMBS },
};

// One score per comment: likes minus dislikes (negative when dislikes win), between an up and a down arrow.
// Signed out → the arrows link to sign-in; your own comment → the score only, arrows dimmed.
function CommentVotes({ comment: c, mine, mode }: { comment: Comment; mine?: CommentVote; mode: "vote" | "signed-out" | "own" }) {
  const [, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic({ counts: { like: c.like_count, dislike: c.dislike_count }, mine });
  const fx = useRef<HTMLSpanElement>(null);
  const score = state.counts.like - state.counts.dislike;

  function press(kind: CommentVote, button: HTMLElement) {
    const next = toggleVote(state.counts, state.mine, kind);
    if (next.mine) burst(fx.current, button, SIDES[kind].crumbs); // a new vote, not a cleared one
    startTransition(async () => {
      setOptimistic(next);
      await castCommentVote(c.id, next.mine ?? null);
    });
  }

  function arrow(kind: CommentVote) {
    const { label, Icon, on } = SIDES[kind];
    const active = state.mine === kind;
    const icon = <Icon aria-hidden className={cn("size-[18px] transition-transform duration-150 ease-[var(--ease-out)]", active && "scale-110 fill-current")} />;
    const cls = cn(
      "grid size-9 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
      active ? on : "hover:bg-muted hover:text-foreground",
    );
    if (mode === "vote")
      return (
        <button type="button" aria-pressed={active} aria-label={label} onClick={(e) => press(kind, e.currentTarget)} className={cn(cls, "active:scale-90")}>
          {icon}
        </button>
      );
    if (mode === "signed-out")
      return (
        <Link href="/login" aria-label={`${label}. Sign in to vote`} className={cls}>
          {icon}
        </Link>
      );
    return <span className={cn(cls, "opacity-40")}>{icon}</span>;
  }

  return (
    <span role="group" aria-label={`Comment score ${score}`} className="relative inline-flex items-center">
      {arrow("like")}
      <RollingCount
        value={score}
        className={cn(
          "min-w-[2ch] justify-center font-semibold tabular-nums",
          state.mine === "like" ? "text-mustard" : state.mine === "dislike" ? "text-ketchup" : "text-foreground",
        )}
      />
      {arrow("dislike")}
      <span ref={fx} aria-hidden className="pointer-events-none absolute inset-0" />
    </span>
  );
}

type ComposerProps = { ratingId: string; parentId?: string; placeholder: string; autoFocus?: boolean; className?: string; onDone?: () => void };

function Composer({ ratingId, parentId, placeholder, autoFocus, className, onDone }: ComposerProps) {
  const [state, action, pending] = useActionState<CommentState, FormData>(async (prev, data) => {
    const next = await addComment(prev, data);
    if (next.ok !== prev.ok) {
      toast(parentId ? "Reply posted" : "Comment posted");
      onDone?.(); // closes a reply form; the parent's state can't be set while this component renders, so it's done here
    }
    return next;
  }, {});
  const [body, setBody] = useState("");
  const [seenOk, setSeenOk] = useState(state.ok);

  // A successful post comes back with a new `ok`: clear the box.
  if (state.ok !== seenOk) {
    setSeenOk(state.ok);
    setBody("");
  }

  return (
    <form action={action} className={cn("flex flex-col gap-2", className)}>
      <input type="hidden" name="rating_id" value={ratingId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <AutoTextarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 500))}
        rows={parentId ? 2 : 3}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-invalid={Boolean(state.error) || undefined}
        className="w-full rounded-md border border-input bg-raised px-3 py-2.5 text-base leading-relaxed focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p role={state.error ? "alert" : undefined} className={cn("text-sm", state.error ? "text-destructive" : "text-faint tabular-nums")}>
          {state.error ?? (body.length > 400 ? `${body.length}/500` : "")}
        </p>
        <div className="flex gap-2">
          {onDone && (
            <Button type="button" variant="ghost" size="lg" onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="lg" disabled={pending || !body.trim()}>
            {pending && <Spinner data-icon="inline-start" />}
            {parentId ? "Reply" : "Post"}
          </Button>
        </div>
      </div>
    </form>
  );
}
