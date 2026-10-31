import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockIcon, UsersRoundIcon } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { canSeeFollowList, getFollowList, getProfileByHandle, getProfileStats, isFollowing, type FollowKind, type FollowPerson } from "@/lib/profiles";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/avatar";
import { BackLink } from "@/components/back-link";
import { FollowButton } from "@/components/follow-button";
import { PageLoader } from "@/components/loader";
import { PageShell } from "@/components/page-shell";

const KINDS = ["followers", "following"] as const;
const asKind = (value: string): FollowKind | null => (KINDS as readonly string[]).includes(value) ? (value as FollowKind) : null;

export async function generateMetadata({ params }: PageProps<"/u/[handle]/[kind]">): Promise<Metadata> {
  const { handle, kind } = await params;
  const k = asKind(kind);
  if (!k) return { title: "Not found · Nomrank" };
  return { title: `${k === "followers" ? "Followers" : "Following"} of @${decodeURIComponent(handle)} · Nomrank`, robots: { index: false } };
}

export default function FollowListPage({ params }: PageProps<"/u/[handle]/[kind]">) {
  return (
    <PageShell>
      <Suspense fallback={<PageLoader />}>
        <FollowList params={params} />
      </Suspense>
    </PageShell>
  );
}

async function FollowList({ params }: Pick<PageProps<"/u/[handle]/[kind]">, "params">) {
  const { handle, kind: rawKind } = await params;
  const kind = asKind(rawKind);
  if (!kind) notFound();
  const { supabase, userId, profile: viewer } = await getViewer();
  const profile = await getProfileByHandle(supabase, decodeURIComponent(handle).toLowerCase());
  if (!profile) notFound();

  const own = userId === profile.id;
  const [stats, open, follows] = await Promise.all([
    getProfileStats(supabase, profile.id),
    canSeeFollowList(supabase, profile.id, kind),
    userId && !own ? isFollowing(supabase, userId, profile.id) : false,
  ]);
  const people = open ? await getFollowList(supabase, profile.id, kind, viewer ? userId : null) : [];
  const visibility = kind === "followers" ? profile.followers_visibility : profile.following_visibility;
  const name = profile.display_name ?? `@${profile.username}`;

  return (
    <div className="mx-auto w-full max-w-xl pb-10">
      <BackLink href={`/u/${profile.username}`} />
      <header className="mt-3">
        <h1 className="text-2xl leading-tight font-bold tracking-tight wrap-anywhere">{name}</h1>
        {profile.display_name && <p className="mt-0.5 text-sm font-semibold wrap-anywhere text-muted-foreground">@{profile.username}</p>}
      </header>

      <nav aria-label="Followers and following" className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-hairline bg-raised p-1">
        {(
          [
            ["followers", stats.followers, stats.followers === 1 ? "Follower" : "Followers"],
            ["following", stats.following, "Following"],
          ] as const
        ).map(([k, count, label]) => (
          <Link
            key={k}
            href={`/u/${profile.username}/${k}`}
            replace
            aria-current={k === kind ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-[background-color,color] duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              k === kind ? "bg-mustard text-studio" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="tabular-nums">{count}</span> {label}
          </Link>
        ))}
      </nav>

      <div className="mt-5">
        {!open ? (
          <Locked kind={kind} visibility={visibility} handle={profile.username} followeeId={profile.id} following={follows} signedIn={viewer !== null} />
        ) : people.length === 0 ? (
          <Empty kind={kind} own={own} handle={profile.username} />
        ) : (
          <ul className="stagger divide-y divide-hairline">
            {people.map((p) => (
              <li key={p.id}>
                <Person person={p} self={userId === p.id} signedIn={viewer !== null} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Person({ person: p, self, signedIn }: { person: FollowPerson; self: boolean; signedIn: boolean }) {
  const name = p.display_name ?? `@${p.username}`;
  return (
    <div className="flex items-center gap-3 py-3">
      <Link
        href={`/u/${p.username}`}
        className="-m-1 flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Avatar handle={p.username} code={p.avatar} photo={p.avatar_path} size={48} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{name}</span>
          {p.display_name && <span className="block truncate text-sm text-muted-foreground">@{p.username}</span>}
        </span>
      </Link>
      {!self && <FollowButton followeeId={p.id} handle={p.username} following={p.following} signedIn={signedIn} />}
    </div>
  );
}

function Empty({ kind, own, handle }: { kind: FollowKind; own: boolean; handle: string }) {
  const who = own ? "You" : `@${handle}`;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-raised">
        <UsersRoundIcon aria-hidden className="size-6 text-mustard" />
      </span>
      <p className="font-semibold">{kind === "followers" ? "No followers yet" : `${who} ${own ? "aren't" : "isn't"} following anyone yet`}</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {kind === "followers" ? (own ? "Rate a few dishes and write a take. People find you through what you've said." : "Be the first to follow them.") : "Follow people whose taste you trust and their takes land in your feed."}
      </p>
    </div>
  );
}

// A list its owner keeps private: say who can see it, and the way in (following) when that's what it takes.
function Locked({ kind, visibility, handle, followeeId, following, signedIn }: { kind: FollowKind; visibility: string; handle: string; followeeId: string; following: boolean; signedIn: boolean }) {
  const needsFollow = visibility === "followers";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-paper px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-raised">
        <LockIcon aria-hidden className="size-6 text-mustard" />
      </span>
      <p className="font-semibold">{kind === "followers" ? "Their followers are private" : "Who they follow is private"}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{needsFollow ? `Only people who follow @${handle} can see this. Follow them to take a look.` : `Only @${handle} can see this.`}</p>
      {needsFollow && <FollowButton followeeId={followeeId} handle={handle} following={following} signedIn={signedIn} />}
    </div>
  );
}
