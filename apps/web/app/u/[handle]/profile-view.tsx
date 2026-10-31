import Link from "next/link";
import {
  AwardIcon,
  CameraIcon,
  CompassIcon,
  FlameIcon,
  HandshakeIcon,
  LockIcon,
  MapPinIcon,
  MoonIcon,
  PenLineIcon,
  PencilIcon,
  ScaleIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import { canSee, DIETS, palate, type Diet, type Favourite, type ProfileStats, type PublicProfile, type SavedDish, type Visibility } from "@/lib/profiles";
import { formatScore, photoUrl, scoreColor, summarize, type Review, type Vote } from "@/lib/ratings";
import { dishHref } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { BackLink } from "@/components/back-link";
import { Avatar } from "@/components/avatar";
import { DietMark, type DietKind } from "@/components/diet-mark";
import { DishAvg } from "@/components/dish-avg";
import { ReviewCard, Score } from "@/components/review-card";
import { FollowButton } from "@/components/follow-button";
import { ShareButton } from "@/components/share-button";
import { Row } from "@/components/row";
import { OwnFavourites } from "./favourites-picker";
import { AgreeIcon } from "@/components/food-icons";
import { badges, profileFacts, UNLOCK_AT, type Badge, type Facts, type TasteMatch } from "@/lib/taste";

type Props = {
  profile: PublicProfile;
  stats: ProfileStats;
  favourites: Favourite[];
  ratings: Review[]; // everything they've rated, newest first
  votes: Record<string, Vote>;
  saveStates: Record<string, boolean>; // dish id → "Want to try", for the viewer
  viewer: string | null;
  tab: "takes" | "diary" | "saved";
  saves: SavedDish[]; // their "Want to try" list
  following: boolean; // does the viewer follow this person
  match: TasteMatch | null; // viewer vs this person; null on your own profile or signed out
};

// Dates in India time, so a late-night rating lands on the day it was eaten.
const MONTH = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const DAY = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" });
const JOINED = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

const OVERLINE = "text-xs font-semibold tracking-[0.08em] text-faint uppercase";

// Like a Letterboxd profile: who they are, their numbers and four favourites, then their takes and a diary of everything rated.
export function ProfileView({ profile: p, stats, favourites, ratings, votes, saveStates, viewer, tab, saves, following, match }: Props) {
  const own = viewer === p.username;
  const diaryOpen = canSee(p.diary_visibility, { own, follows: following });
  const savesOpen = canSee(p.saves_visibility, { own, follows: following });
  const facts = profileFacts(ratings);
  const stated = DIETS.find((d) => d.value === p.diet); // what they say they eat beats what we infer
  const earned = badges(ratings, stats.trust);
  const takes = ratings.filter((r) => r.take);
  const name = p.display_name ?? `@${p.username}`;

  return (
    <PageShell wide>
      {/* Desktop: the person pinned on the left, their takes and diary on the right. */}
      <div className="lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-14 xl:gap-20">
        <div className="flex flex-col lg:sticky lg:top-6">
          <BackLink href="/" />

          <header className="mt-3">
            {/* Top row: the picture on the left, the action (Edit / Follow) and Share on the right. */}
            <div className="flex items-start justify-between gap-3">
              <Avatar handle={p.username} code={p.avatar} photo={p.avatar_path} size={80} label={`${name}'s profile picture`} className="-ml-1" />
              <div className="flex shrink-0 items-center gap-2">
                <ShareButton path={`/u/${p.username}`} title={`${name} on Nomrank`} />
                {own ? (
                  <Link
                    href="/settings/profile"
                    aria-label="Edit profile"
                    className="inline-flex min-h-10 items-center gap-2 rounded-md border border-hairline px-3 text-sm font-semibold transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <PencilIcon aria-hidden className="size-4" />
                    <span className="hidden sm:inline">Edit profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                ) : (
                  <FollowButton followeeId={p.id} handle={p.username} following={following} signedIn={viewer !== null} />
                )}
              </div>
            </div>
            {/* Long names step down a size so a 20-character handle still fits on one line. */}
            <h1 className={cn("mt-3 leading-tight font-bold tracking-[-0.02em] wrap-anywhere", name.length > 20 ? "text-xl" : "text-[1.625rem]")}>{name}</h1>
            {p.display_name && <p className="mt-0.5 text-sm font-semibold wrap-anywhere text-muted-foreground">@{p.username}</p>}
            <p className="mt-1 text-sm text-faint">
              {p.regions && <>Home: {p.regions.name} · </>}Joined {JOINED.format(new Date(p.created_at))}
            </p>
          </header>
          {p.bio && <p className="mt-4 leading-relaxed whitespace-pre-line wrap-anywhere">{p.bio}</p>}
          <FactChips facts={stated ? { ...facts, diet: undefined } : facts} stated={stated} instagram={p.instagram} />

          <nav aria-label="Followers and following" className="mt-3 -ml-2 flex gap-1 text-sm text-muted-foreground">
            {(
              [
                ["followers", stats.followers, stats.followers === 1 ? "follower" : "followers"],
                ["following", stats.following, "following"],
              ] as const
            ).map(([kind, count, label]) => (
              <Link
                key={kind}
                href={`/u/${p.username}/${kind}`}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="font-semibold text-foreground tabular-nums">{count}</span> {label}
              </Link>
            ))}
          </nav>

          <TasteCard stats={stats} scores={ratings.map((r) => r.score)} own={own} />
          {match && <MatchCard match={match} handle={p.username} />}

          <Favourites favourites={favourites} own={own} ratings={ratings} />
          <Badges earned={earned} own={own} />
        </div>

        <section aria-label={tab === "takes" ? "Takes" : tab === "diary" ? "Diary" : "Want to try"} className="mt-8 pb-10 lg:mt-0 lg:pt-14">
          <nav aria-label="Profile sections" className="flex gap-6 border-b border-hairline">
            {(
              [
                ["takes", "Takes", takes.length, true],
                ["diary", "Diary", ratings.length, diaryOpen],
                ["saved", "Want to try", saves.length, savesOpen],
              ] as const
            ).map(([key, label, count, open]) => (
              <Link
                key={key}
                href={key === "takes" ? `/u/${p.username}` : `/u/${p.username}?tab=${key}`}
                replace
                scroll={false}
                aria-current={tab === key ? "page" : undefined}
                className={cn(
                  "relative -mb-px inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  tab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                {open ? <span className="text-faint tabular-nums">{count}</span> : <LockIcon aria-label="private" className="size-3.5 text-faint" />}
                {tab === key && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-mustard" />}
              </Link>
            ))}
          </nav>

          {tab === "takes" ? (
            takes.length ? (
              <ul className="stagger divide-y divide-hairline">
                {takes.map((r) => (
                  <li key={r.id}>
                    <ReviewCard review={r} vote={votes[r.id]} saved={saveStates[r.dish.id]} viewer={viewer} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>{own ? "Rate a dish and say what you thought. Your takes show up here." : `@${p.username} hasn't written a take yet.`}</Empty>
            )
          ) : tab === "diary" ? (
            !diaryOpen ? (
              <Locked handle={p.username} visibility={p.diary_visibility} what="diary" />
            ) : ratings.length ? (
              <Diary ratings={ratings} />
            ) : (
              <Empty>{own ? "Everything you rate lands here, by date." : `@${p.username} hasn't rated anything yet.`}</Empty>
            )
          ) : !savesOpen ? (
            <Locked handle={p.username} visibility={p.saves_visibility} what="Want to try list" />
          ) : saves.length ? (
            <WantToTry saves={saves} />
          ) : (
            <Empty>{own ? "Tap \u201cWant to try\u201d on any dish to save it here for later." : `@${p.username} hasn't saved any dishes yet.`}</Empty>
          )}
          {own && tab !== "takes" && (tab === "diary" ? p.diary_visibility : p.saves_visibility) !== "everyone" && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-faint">
              <LockIcon aria-hidden className="size-3.5" />
              {(tab === "diary" ? p.diary_visibility : p.saves_visibility) === "only_me" ? "Only you can see this." : "Only you and your followers can see this."}{" "}
              <Link href="/settings#privacy" className="font-semibold text-foreground underline-offset-4 hover:underline">
                Change
              </Link>
            </p>
          )}
        </section>
      </div>
    </PageShell>
  );
}

// Someone else's private list: who can see it, and the way in (following) when that's what it takes.
function Locked({ handle, visibility, what }: { handle: string; visibility: Visibility; what: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-raised">
        <LockIcon aria-hidden className="size-5 text-mustard" />
      </span>
      <p className="font-semibold">@{handle} keeps their {what} private</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {visibility === "followers" ? "Only people who follow them can see it. Follow them to take a look." : "Only they can see it."}
      </p>
    </div>
  );
}

// Their palate at a glance: average as a score sticker, a one-line read, how their scores spread from 1 to 10, and trust.
// The read stays locked until there are enough ratings to mean something.
function TasteCard({ stats, scores, own }: { stats: ProfileStats; scores: number[]; own: boolean }) {
  const { spread } = summarize(scores);
  const peak = Math.max(1, ...spread);
  const unlocked = stats.rated >= UNLOCK_AT;
  const left = UNLOCK_AT - stats.rated;
  return (
    <section aria-label="Taste" className="mt-5 rounded-2xl border border-hairline bg-paper p-4">
      {unlocked && stats.average !== null ? (
        <div className="flex items-center gap-4">
          <Score score={stats.average} size={64} />
          <div className="min-w-0">
            <p className="text-lg leading-tight font-bold">{palate(stats.average, stats.rated)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">{stats.rated}</span> dishes rated · avg {formatScore(stats.average)}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <LockIcon aria-hidden className="size-4 text-faint" />
            {own ? `Rate ${left} more ${left === 1 ? "dish" : "dishes"} to unlock your taste` : "Still tasting"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {own ? "Your average, palate and score spread show up after " : "Their taste shows up after "}
            {UNLOCK_AT} ratings.
          </p>
          <div
            role="progressbar"
            aria-label="Ratings towards unlocking taste"
            aria-valuemin={0}
            aria-valuemax={UNLOCK_AT}
            aria-valuenow={stats.rated}
            className="mt-3 flex gap-1.5"
          >
            {Array.from({ length: UNLOCK_AT }, (_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{ background: i < stats.rated ? scoreColor(4 + (i * 5.5) / (UNLOCK_AT - 1)) : "var(--hairline)" }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-end justify-between gap-4 border-t border-hairline pt-3">
        <Trust value={stats.trust} />
        {unlocked && (
          <div className="w-32">
            <p aria-hidden className="mb-1.5 text-right text-[0.625rem] font-semibold tracking-[0.06em] text-faint uppercase">
              Score spread
            </p>
            <div
              role="img"
              aria-label={`How they score: ${spread.map((n, i) => `${n} rated ${i + 1}`).join(", ")}`}
              className="flex h-8 items-end gap-[2px]"
            >
              {spread.map((n, i) => (
                <span
                  key={i}
                  className="flex-1 origin-bottom animate-[bar-grow_320ms_var(--ease-out)_both] rounded-t-[2px]"
                  style={{
                    height: n ? `${Math.max(12, (n / peak) * 100)}%` : "2px",
                    background: n ? scoreColor(i + 1) : "var(--hairline)",
                    animationDelay: `${i * 25}ms`,
                  }}
                />
              ))}
            </div>
            <div aria-hidden className="mt-1 flex justify-between text-[0.625rem] text-faint tabular-nums">
              <span>1</span>
              <span>10</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// Trust: agrees on their takes and likes on their comments, minus disagrees and dislikes.
function Trust({ value }: { value: number }) {
  return (
    <p className="flex items-center gap-1.5" title="Agrees on their takes and likes on their comments, minus disagrees and dislikes">
      <HandshakeIcon aria-hidden className={cn("size-5", value > 0 ? "text-mustard" : value < 0 ? "text-ketchup" : "text-faint")} />
      <span className={cn("text-xl leading-none font-bold tabular-nums", value < 0 && "text-ketchup")}>{value > 0 ? `+${value}` : value}</span>
      <span className="text-sm text-muted-foreground">trust</span>
    </p>
  );
}

// Lines worked out from what they've rated: their regular spot, veg or not, and their signature dish family.
function FactChips({ facts, stated, instagram }: { facts: Facts; stated?: { value: Diet; label: string; mark: DietKind }; instagram: string | null }) {
  if (!facts.regularAt && !facts.diet && !facts.signature && !stated && !instagram) return null;
  const chip = "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-hairline bg-paper px-3 text-sm";
  return (
    <ul aria-label="Taste facts" className="mt-4 flex flex-wrap gap-2">
      {facts.regularAt && (
        <li>
          <Link href={`/r/${facts.regularAt.slug}`} className={cn(chip, "transition-colors hover:border-mustard focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}>
            <MapPinIcon aria-hidden className="size-3.5 text-mustard" />
            <span className="text-muted-foreground">Regular at</span> <span className="font-semibold wrap-anywhere">{facts.regularAt.name}</span>
          </Link>
        </li>
      )}
      {facts.diet && (
        <li className={chip}>
          {facts.diet === "Eats both" ? (
            <span className="flex gap-0.5">
              <DietMark diet="veg" className="size-3" />
              <DietMark diet="non_veg" className="size-3" />
            </span>
          ) : (
            <DietMark diet={facts.diet === "Mostly veg" ? "veg" : "non_veg"} className="size-3" />
          )}
          <span className="font-semibold">{facts.diet}</span>
        </li>
      )}
      {stated && (
        <li className={chip}>
          <DietMark diet={stated.mark} className="size-3" />
          <span className="font-semibold">{stated.label}</span>
        </li>
      )}
      {instagram && (
        <li>
          <a
            href={`https://www.instagram.com/${instagram}/`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={cn(chip, "transition-colors hover:border-mustard focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}
          >
            <InstagramGlyph />
            <span className="font-semibold">@{instagram}</span>
            <span className="sr-only">(Instagram, opens in a new tab)</span>
          </a>
        </li>
      )}
      {facts.signature && (
        <li className={chip}>
          <SparklesIcon aria-hidden className="size-3.5 text-mustard" />
          <span className="text-muted-foreground">Signature:</span> <span className="font-semibold">{facts.signature}</span>
        </li>
      )}
    </ul>
  );
}

// You vs them, on the dishes you've both rated.
function MatchCard({ match, handle }: { match: TasteMatch; handle: string }) {
  if (match.percent === null) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-hairline px-4 py-3 text-sm text-muted-foreground">
        {match.common
          ? `You've both rated ${match.common} ${match.common === 1 ? "dish" : "dishes"}. Rate ${3 - match.common} more in common to see your taste match.`
          : `Rate a few dishes @${handle} has rated to see your taste match.`}
      </p>
    );
  }
  return (
    <section aria-label="Taste match" className="mt-3 rounded-2xl border border-hairline bg-paper p-4">
      <p className="flex items-baseline gap-2">
        <span className="bg-(image:--score-gradient) bg-clip-text text-3xl leading-none font-bold text-transparent tabular-nums">{match.percent}%</span>
        <span className="font-semibold">taste match</span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        On {match.common} dishes you&apos;ve both rated.
      </p>
      {match.split && (
        <p className="mt-3 border-t border-hairline pt-3 text-sm">
          <span className="text-muted-foreground">You split on </span>
          <span className="font-semibold">{match.split.dish}</span>
          <span className="text-muted-foreground"> at {match.split.place}: </span>
          <span className="font-semibold tabular-nums">you {formatScore(match.split.mine)}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="font-semibold tabular-nums">them {formatScore(match.split.theirs)}</span>
        </p>
      )}
    </section>
  );
}

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "first-take": PenLineIcon,
  "ten-dishes": UtensilsIcon,
  explorer: CompassIcon,
  trusted: HandshakeIcon,
  "dosa-devotee": AgreeIcon,
  "biryani-buff": FlameIcon,
  "all-rounder": ScaleIcon,
  "night-owl": MoonIcon,
  shutterbug: CameraIcon,
};

// Earned milestones as little medals. Others see only what's earned; you also get a nudge when there's none yet.
function Badges({ earned, own }: { earned: Badge[]; own: boolean }) {
  if (!earned.length && !own) return null;
  return (
    <section aria-labelledby="badges" className="mt-6">
      <h2 id="badges" className={OVERLINE}>
        Badges
      </h2>
      {earned.length ? (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {earned.map((b) => {
            const Icon = BADGE_ICONS[b.id] ?? AwardIcon;
            return (
              <li key={b.id} title={b.detail} className="flex flex-col items-center gap-1.5 rounded-xl border border-hairline bg-paper px-1 py-3 text-center">
                <span className="grid size-10 place-items-center rounded-full bg-(image:--score-gradient) text-studio shadow-[0_4px_12px_-4px_var(--ketchup)]">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="text-xs leading-tight font-semibold">{b.label}</span>
                <span className="sr-only">: {b.detail}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Write a take, rate 10 dishes or try 5 places to earn your first badge.</p>
      )}
    </section>
  );
}

// Four pinned dishes, each with its photo (or a tile in the score's colour) and the score sticker.
// On your own profile, the Edit button and empty slots open a picker right here.
function Favourites({ favourites, own, ratings }: { favourites: Favourite[]; own: boolean; ratings: Review[] }) {
  if (!favourites.length && !own) return null;
  const heading = (
    <h2 id="favourites" className={OVERLINE}>
      Favourites
    </h2>
  );
  const tiles = favourites.map(({ rating: r }) => {
    const photo = r.photos.toSorted((a, b) => a.position - b.position)[0];
    return (
      <li key={r.id} className="min-w-0">
        <Link
          href={dishHref(r.dish.restaurant.slug, r.dish.name)}
          className="group block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="relative block aspect-[3/4]">
            <span className="absolute inset-0 overflow-hidden rounded-lg bg-raised">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage
                <img
                  src={photoUrl(photo.path)}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-300 ease-[var(--ease-out)] group-hover:scale-105"
                />
              ) : (
                // No photo: the dish's initial on a tile tinted with its score colour.
                <span
                  aria-hidden
                  className="grid size-full place-items-center text-3xl font-bold text-foreground/85"
                  style={{ background: `color-mix(in oklab, ${scoreColor(r.score)} 24%, var(--raised))` }}
                >
                  {r.dish.name[0]}
                </span>
              )}
            </span>
            <Score score={r.score} size={30} className="absolute -right-1.5 -bottom-1.5" />
          </span>
          <span className="mt-2 flex items-start gap-1 text-xs leading-snug font-semibold">
            <DietMark diet={r.dish.diet} className="mt-px size-3" />
            <span className="line-clamp-2 wrap-anywhere group-hover:underline">{r.dish.name}</span>
          </span>
          <span className="mt-0.5 block truncate text-[0.6875rem] text-faint">{r.dish.restaurant.name}</span>
          <DishAvg avg={r.dish.avg_score} count={r.dish.rating_count} className="mt-1 text-[0.6875rem]" />
        </Link>
      </li>
    );
  });

  if (own) {
    return (
      <OwnFavourites
        heading={heading}
        tiles={tiles}
        pinned={favourites.map((f) => f.rating.id)}
        rated={ratings.map((r) => ({ id: r.id, score: r.score, dish: r.dish }))}
      />
    );
  }
  return (
    <section aria-labelledby="favourites" className="mt-6">
      {heading}
      <ol className="mt-3 grid grid-cols-4 gap-2.5">{tiles}</ol>
    </section>
  );
}

// Their "Want to try" list: dishes saved for later, newest first.
function WantToTry({ saves }: { saves: SavedDish[] }) {
  return (
    <ul className="stagger divide-y divide-hairline pt-2">
      {saves.map(({ dish: d }) => (
        <li key={d.id}>
          <Row href={dishHref(d.restaurant.slug, d.name)} title={d.name} meta={<>{d.restaurant.name} · <DishAvg avg={d.avg_score} count={d.rating_count} orEmpty /></>} diet={d.diet} />
        </li>
      ))}
    </ul>
  );
}

// Instagram's camera mark, drawn to sit beside lucide icons (lucide no longer ships brand logos).
function InstagramGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-3.5 text-mustard">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  );
}

// Everything rated, newest first, grouped by month like a diary.
function Diary({ ratings }: { ratings: Review[] }) {
  const months = Map.groupBy(ratings, (r) => MONTH.format(new Date(r.created_at)));
  return (
    <div className="flex flex-col gap-6 pt-5">
      {[...months].map(([month, list]) => (
        <section key={month} aria-label={month}>
          <h3 className={OVERLINE}>{month}</h3>
          <ol className="stagger mt-1 divide-y divide-hairline">
            {list.map((r) => (
              <li key={r.id}>
                <Link
                  href={r.take ? `/review/${r.id}` : dishHref(r.dish.restaurant.slug, r.dish.name)}
                  className="-mx-2 flex min-h-16 items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <time dateTime={r.created_at} className="w-7 shrink-0 text-center text-lg font-bold text-muted-foreground tabular-nums">
                    {DAY.format(new Date(r.created_at))}
                  </time>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <DietMark diet={r.dish.diet} className="size-3" />
                      <span className="truncate">{r.dish.name}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-faint">
                      {r.dish.restaurant.name}
                      {r.dish.rating_count > 0 && <DishAvg avg={r.dish.avg_score} count={r.dish.rating_count} className="ml-1.5" />}
                      {r.take && " · wrote a take"}
                    </span>
                  </span>
                  <Score score={r.score} size={38} />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
