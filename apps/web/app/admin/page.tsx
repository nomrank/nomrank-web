import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CrownIcon,
  ClipboardListIcon,
  FlagIcon,
  LayoutDashboardIcon,
  SearchIcon,
  StoreIcon,
  SwordsIcon,
  UsersRoundIcon,
  UtensilsIcon,
} from "lucide-react";
import { appOrigin, getAdminBattles, getAdminStatus, getAdmins, getDishOptions, getInvites, getPersonContent, getPlace, type AdminAccount, type AdminInvite, type AdminPlace, type PersonContent } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { findPeople, getAdminCounts, getModerationLog, getOpenReports, getPendingDishes, type LogEntry } from "@/lib/admin";
import { dishHref } from "@/lib/dishes";
import { getRestaurants } from "@/lib/restaurants";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { REPORT_REASONS } from "@/lib/validation";
import { DietMark } from "@/components/diet-mark";
import { PageLoader } from "@/components/loader";
import { Input } from "@/components/ui/input";
import { approveDish, cancelInvite, deleteBattle, deleteRestaurant, dismissReports, removeAdmin, removeContent } from "./actions";
import { ActionButton, AddRestaurantForm, BanControls } from "./controls";
import { AddDishForm, CreateBattleForm, DishEditor, EditRestaurantForm, InviteAdminForm } from "./forms";
import { AdminShell, ChangeDefaultPassword, NotAdmin } from "./shell";

export const metadata: Metadata = { title: "Admin · Nomrank", robots: { index: false } };

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboardIcon },
  { key: "dishes", label: "Dishes", icon: UtensilsIcon },
  { key: "reports", label: "Reports", icon: FlagIcon },
  { key: "restaurants", label: "Restaurants", icon: StoreIcon },
  { key: "people", label: "People", icon: UsersRoundIcon },
  { key: "battles", label: "Battles", icon: SwordsIcon },
  { key: "admins", label: "Admins", icon: CrownIcon },
  { key: "log", label: "Log", icon: ClipboardListIcon },
] as const;
type Tab = (typeof TABS)[number]["key"];

const OVERLINE = "text-xs font-semibold tracking-[0.08em] text-faint uppercase";
const CARD = "rounded-2xl border border-hairline bg-paper p-4 sm:p-5";
const WHAT = { rating: "Take", comment: "Comment", dish: "Dish", space: "List" } as const;

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <AdminShell>
      <Suspense fallback={<PageLoader />}>
        <Admin searchParams={searchParams} />
      </Suspense>
    </AdminShell>
  );
}

async function Admin({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  // Signed out → the admin sign-in. Signed in but not an admin → say so (the database refuses the actions regardless).
  const { supabase, userId } = await getCurrentUser();
  const status = await getAdminStatus(supabase);
  if (!status.admin) return <NotAdmin />;
  if (status.default_password) return <ChangeDefaultPassword />; // the superadmin's first sign-in
  const params = await searchParams;
  const app = appOrigin((await headers()).get("host")); // links to public pages go to the app, not this site
  const place = typeof params.place === "string" ? params.place : "";
  const person = typeof params.person === "string" ? params.person : "";
  const tab: Tab = TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : "overview";
  const q = typeof params.q === "string" ? params.q : "";
  const counts = await getAdminCounts(supabase);
  const badge: Partial<Record<Tab, number>> = { dishes: counts.pending, reports: counts.reports };

  return (
    <div>
      <h1 className="sr-only">Nomrank admin</h1>
      <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-b border-hairline [scrollbar-width:none]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={key === "overview" ? "/" : `/?tab=${key}`}
            replace
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              tab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
            {badge[key] ? <span className="rounded-full bg-ketchup px-1.5 text-[0.6875rem] text-studio tabular-nums">{badge[key]}</span> : null}
            {tab === key && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-mustard" />}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "overview" ? (
          <Overview counts={counts} log={(await getModerationLog(supabase)).slice(0, 8)} />
        ) : tab === "dishes" ? (
          <Dishes dishes={await getPendingDishes(supabase)} app={app} />
        ) : tab === "reports" ? (
          <Reports groups={await getOpenReports(supabase)} app={app} />
        ) : tab === "restaurants" ? (
          place ? (
            <Place place={await getPlace(supabase, place)} app={app} />
          ) : (
            <Restaurants restaurants={await getRestaurants(supabase)} />
          )
        ) : tab === "people" ? (
          person ? (
            <Person content={await getPersonContent(supabase, person)} app={app} />
          ) : (
            <People q={q} people={await findPeople(supabase, q)} />
          )
        ) : tab === "battles" ? (
          <Battles battles={await getAdminBattles(supabase)} dishes={await getDishOptions(supabase)} />
        ) : tab === "admins" ? (
          <Admins admins={await getAdmins(supabase)} invites={status.super ? await getInvites(supabase) : []} me={userId} isSuper={status.super} />
        ) : (
          <Log entries={await getModerationLog(supabase)} />
        )}
      </div>
    </div>
  );
}

function Overview({ counts, log }: { counts: Awaited<ReturnType<typeof getAdminCounts>>; log: LogEntry[] }) {
  const stats = [
    { label: "Dishes to review", value: counts.pending, href: "/?tab=dishes", icon: UtensilsIcon, urgent: counts.pending > 0 },
    { label: "Open reports", value: counts.reports, href: "/?tab=reports", icon: FlagIcon, urgent: counts.reports > 0 },
    { label: "Banned accounts", value: counts.banned, href: "/?tab=people", icon: AlertTriangleIcon, urgent: false },
    { label: "People", value: counts.people, href: "/?tab=people", icon: UsersRoundIcon, urgent: false },
  ];
  return (
    <div className="flex flex-col gap-8">
      <ul className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon, urgent }) => (
          <li key={label}>
            <Link href={href} className={cn(CARD, "flex flex-col gap-2 transition-colors hover:border-input", urgent && "border-ketchup/50")}>
              <Icon aria-hidden className={cn("size-5", urgent ? "text-ketchup" : "text-mustard")} />
              <span className="text-3xl font-bold tabular-nums">{value}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-labelledby="recent">
        <h2 id="recent" className={OVERLINE}>
          Recent admin actions
        </h2>
        <LogList entries={log} />
      </section>
    </div>
  );
}

function Dishes({ dishes, app }: { dishes: Awaited<ReturnType<typeof getPendingDishes>>; app: string }) {
  if (!dishes.length) return <Empty icon={UtensilsIcon}>No dishes waiting. New ones people add show up here.</Empty>;
  return (
    <ul className="stagger grid gap-3 lg:grid-cols-2">
      {dishes.map((d) => (
        <li key={d.id} className={CARD}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`${app}${dishHref(d.restaurant.slug, d.name)}`} className="flex items-center gap-1.5 font-semibold hover:underline">
                <DietMark diet={d.diet} className="size-3 shrink-0" />
                <span className="wrap-anywhere">{d.name}</span>
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground wrap-anywhere">
                {d.restaurant.name}, {d.restaurant.area}
              </p>
              <p className="mt-1 text-xs text-faint">
                Added {d.by ? <Link href={`/?tab=people&person=${d.by}`} className="font-semibold text-muted-foreground hover:underline">by @{d.by}</Link> : "by a deleted account"} ·{" "}
                {timeAgo(d.created_at)}
              </p>
            </div>
          </div>
          {d.similar.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-mustard/10 px-3 py-2 text-sm">
              <AlertTriangleIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-mustard" />
              <span>Possible duplicate. Already on this menu: {d.similar.join(", ")}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton run={approveDish} args={[d.id]} label="Approve" icon="approve" done={`${d.name} is live`} tone="primary" />
            <ActionButton run={removeContent} args={["dish", d.id, "Rejected in review"]} label="Remove" icon="remove" done="Dish removed" confirm="Remove this dish and its ratings?" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Reports({ groups, app }: { groups: Awaited<ReturnType<typeof getOpenReports>>; app: string }) {
  if (!groups.length) return <Empty icon={FlagIcon}>No open reports. All clear.</Empty>;
  return (
    <ul className="stagger flex flex-col gap-3">
      {groups.map((g) => {
        const reasons = Map.groupBy(g.reports, (r) => r.reason);
        const label = (value: string) => REPORT_REASONS[g.target_type].find((r) => r.value === value)?.label ?? value;
        return (
          <li key={`${g.target_type}:${g.target_id}`} className={CARD}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-raised px-2 py-0.5 font-semibold">{WHAT[g.target_type]}</span>
              <span className="font-semibold text-ketchup">
                {g.reports.length} {g.reports.length === 1 ? "report" : "reports"}
              </span>
              <span className="text-faint">latest {timeAgo(g.latest)}</span>
            </div>
            {g.target ? (
              <div className="mt-3">
                <p className="line-clamp-4 text-[0.9375rem] whitespace-pre-line wrap-anywhere">&ldquo;{g.target.text}&rdquo;</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {g.target.context}
                  {g.target.author && (
                    <>
                      {" · by "}
                      <Link href={`/?tab=people&person=${g.target.author}`} className="font-semibold text-foreground hover:underline">
                        @{g.target.author}
                      </Link>
                    </>
                  )}
                  {g.target.href && (
                    <>
                      {" · "}
                      <Link href={`${app}${g.target.href}`} className="font-semibold text-foreground underline-offset-4 hover:underline">
                        Open
                      </Link>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Already removed.</p>
            )}
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {[...reasons].map(([reason, list]) => (
                <li key={reason} className="rounded-full border border-hairline px-2.5 py-1 text-xs font-semibold">
                  {label(reason)} {list.length > 1 && <span className="text-faint">×{list.length}</span>}
                </li>
              ))}
            </ul>
            {g.reports.some((r) => r.note) && (
              <ul className="mt-3 flex flex-col gap-1.5 border-l-2 border-hairline pl-3 text-sm text-muted-foreground">
                {g.reports
                  .filter((r) => r.note)
                  .map((r) => (
                    <li key={r.id} className="wrap-anywhere">
                      {r.note} <span className="text-faint">· @{r.by ?? "deleted"}</span>
                    </li>
                  ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap items-start gap-2">
              {g.target && (
                <ActionButton
                  run={removeContent}
                  args={[g.target_type, g.target_id, label(g.reports[0].reason)]}
                  label="Remove"
                  icon="remove"
                  done={`${WHAT[g.target_type]} removed`}
                  confirm={`Remove this ${WHAT[g.target_type].toLowerCase()}?`}
                  tone="danger"
                />
              )}
              <ActionButton run={dismissReports} args={[g.target_type, g.target_id]} label="Dismiss" icon="dismiss" done="Reports dismissed" />
              {g.target?.author_id && g.target.author && <BanControls account={g.target.author_id} handle={g.target.author} banned={false} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Restaurants({ restaurants }: { restaurants: Awaited<ReturnType<typeof getRestaurants>> }) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="add-place" className={CARD}>
        <h2 id="add-place" className="font-semibold">
          Add a restaurant
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">It goes live straight away. People can then add its dishes.</p>
        <AddRestaurantForm />
      </section>
      <section aria-labelledby="places">
        <h2 id="places" className={OVERLINE}>
          {restaurants.length} restaurants
        </h2>
        <ul className="mt-2 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <li key={r.id} className="border-b border-hairline">
              <Link href={`/?tab=restaurants&place=${r.slug}`} className="-mx-2 flex min-h-14 items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-faint">
                    {r.area}, {r.city}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{r.dishes.length} dishes</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function People({ q, people }: { q: string; people: Awaited<ReturnType<typeof findPeople>> }) {
  return (
    <div className="flex flex-col gap-4">
      <form action="/" className="relative max-w-md">
        <input type="hidden" name="tab" value="people" />
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" name="q" defaultValue={q} placeholder="Search by handle" aria-label="Search people by handle" className="h-11 bg-raised pl-10" />
      </form>
      <p className={OVERLINE}>{q ? `Matching "${q}"` : "Newest accounts"}</p>
      {people.length ? (
        <ul className="stagger grid gap-3 lg:grid-cols-2">
          {people.map((p) => (
            <li key={p.id} className={cn(CARD, p.banned_at && "border-destructive/40")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/?tab=people&person=${p.username}`} className="font-semibold hover:underline">
                    @{p.username}
                  </Link>
                  {p.display_name && <span className="ml-1.5 text-sm text-muted-foreground">{p.display_name}</span>}
                  <p className="mt-0.5 text-xs text-faint">
                    Joined {timeAgo(p.created_at)} · {p.ratings} ratings · {p.comments} comments
                  </p>
                </div>
                {p.banned_at && <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">Banned</span>}
              </div>
              <div className="mt-3">
                <BanControls account={p.id} handle={p.username} banned={Boolean(p.banned_at)} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty icon={UsersRoundIcon}>No one matches that handle.</Empty>
      )}
    </div>
  );
}

function Log({ entries }: { entries: LogEntry[] }) {
  return entries.length ? <LogList entries={entries} /> : <Empty icon={ClipboardListIcon}>Nothing yet. Admin actions are recorded here.</Empty>;
}

const VERBS: Record<string, string> = {
  approve: "approved",
  delete: "removed",
  dismiss: "dismissed reports on",
  ban: "banned",
  unban: "unbanned",
  add: "added",
  edit: "edited",
  invite_admin: "invited an admin:",
  cancel_invite: "cancelled an admin invitation",
  accept_admin: "joined as an admin",
  make_admin: "made an admin:",
  remove_admin: "removed an admin:",
};
const NOUNS: Record<string, string> = { dish: "a dish", rating: "a take", comment: "a comment", account: "an account", restaurant: "a restaurant", space: "a list" };

function LogList({ entries }: { entries: LogEntry[] }) {
  if (!entries.length) return <p className="mt-2 text-sm text-muted-foreground">Nothing yet.</p>;
  return (
    <ul className="mt-2 divide-y divide-hairline">
      {entries.map((e) => {
        const note = e.detail && typeof e.detail.reason === "string" ? e.detail.reason : e.detail && typeof e.detail.note === "string" ? e.detail.note : null;
        const name = e.detail && typeof e.detail.name === "string" ? e.detail.name : null;
        return (
          <li key={e.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0 wrap-anywhere">
              <span className="font-semibold">@{e.admin ?? "former admin"}</span> {VERBS[e.action] ?? e.action} {name ?? NOUNS[e.target_type] ?? e.target_type}
              {note && <span className="text-muted-foreground"> · {note}</span>}
            </span>
            <time dateTime={e.created_at} className="shrink-0 text-xs text-faint">
              {timeAgo(e.created_at)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-raised">
        <Icon aria-hidden className="size-5 text-mustard" />
      </span>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

// One restaurant: fix its details, manage its menu, or delete it.
function Place({ place, app }: { place: AdminPlace | null; app: string }) {
  if (!place) return <Empty icon={StoreIcon}>That restaurant doesn&apos;t exist (it may have been deleted).</Empty>;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/?tab=restaurants" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← All restaurants
        </Link>
        <Link href={`${app}/r/${place.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          See it on Nomrank <ArrowUpRightIcon aria-hidden className="size-4" />
        </Link>
      </div>
      <section aria-labelledby="place-details" className={CARD}>
        <h2 id="place-details" className="mb-4 font-semibold">
          {place.name}
        </h2>
        <EditRestaurantForm place={place} />
      </section>
      <section aria-labelledby="menu" className={CARD}>
        <h2 id="menu" className="font-semibold">
          Menu · {place.dishes.length} {place.dishes.length === 1 ? "dish" : "dishes"}
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Dishes you add go live straight away and join their food list by name.</p>
        <AddDishForm restaurantId={place.id} />
        {place.dishes.length > 0 && (
          <ul className="mt-5 divide-y divide-hairline border-t border-hairline">
            {place.dishes.map((d) => (
              <li key={d.id} className="py-3">
                <DishEditor dish={d}>
                  <span className="text-xs text-faint tabular-nums">
                    {d.approved_at ? `${d.rating_count} ${d.rating_count === 1 ? "rating" : "ratings"}` : "Waiting for review"}
                  </span>
                  <ActionButton run={removeContent} args={["dish", d.id, "Removed by an admin"]} label="Remove" icon="remove" done="Dish removed" confirm="Remove this dish and its ratings?" />
                </DishEditor>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="danger" className={cn(CARD, "border-destructive/40")}>
        <h2 id="danger" className="font-semibold">
          Delete this restaurant
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Removes it with every dish, take, photo and comment on it. This can&apos;t be undone.</p>
        <ActionButton run={deleteRestaurant} args={[place.id]} label="Delete restaurant" icon="remove" done={`${place.name} deleted`} confirm={`Delete ${place.name}?`} tone="danger" />
      </section>
    </div>
  );
}

// One person: ban or unban, and remove any of their takes or comments.
function Person({ content, app }: { content: PersonContent | null; app: string }) {
  if (!content) return <Empty icon={UsersRoundIcon}>No one has that handle.</Empty>;
  const { person, takes, comments } = content;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/?tab=people" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
          ← All people
        </Link>
        <Link href={`${app}/u/${person.username}`} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          See their profile <ArrowUpRightIcon aria-hidden className="size-4" />
        </Link>
      </div>
      <section className={cn(CARD, person.banned_at && "border-destructive/40")}>
        <h2 className="font-semibold">
          @{person.username}
          {person.display_name && <span className="ml-1.5 font-normal text-muted-foreground">{person.display_name}</span>}
          {person.banned_at && <span className="ml-2 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">Banned</span>}
        </h2>
        <div className="mt-3">
          <BanControls account={person.id} handle={person.username} banned={Boolean(person.banned_at)} />
        </div>
      </section>
      <section aria-labelledby="their-takes">
        <h2 id="their-takes" className={OVERLINE}>
          Takes and ratings · {takes.length}
        </h2>
        {takes.length ? (
          <ul className="mt-2 divide-y divide-hairline">
            {takes.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link href={`${app}/review/${t.id}`} className="text-sm font-semibold hover:underline">
                    {t.score}/10 · {t.dish?.name ?? "a dish"}
                    {t.dish && <span className="font-normal text-muted-foreground"> at {t.dish.restaurant.name}</span>}
                  </Link>
                  {t.take && <p className="mt-0.5 line-clamp-3 text-sm wrap-anywhere text-muted-foreground">{t.take}</p>}
                  <p className="mt-0.5 text-xs text-faint">{timeAgo(t.created_at)}</p>
                </div>
                <ActionButton run={removeContent} args={["rating", t.id, "Removed by an admin"]} label="Remove" icon="remove" done="Take removed" confirm="Remove this take?" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Nothing rated yet.</p>
        )}
      </section>
      <section aria-labelledby="their-comments">
        <h2 id="their-comments" className={OVERLINE}>
          Comments · {comments.length}
        </h2>
        {comments.length ? (
          <ul className="mt-2 divide-y divide-hairline">
            {comments.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link href={`${app}/review/${c.rating_id}#comments`} className="line-clamp-3 text-sm wrap-anywhere hover:underline">
                    {c.body}
                  </Link>
                  <p className="mt-0.5 text-xs text-faint">{timeAgo(c.created_at)}</p>
                </div>
                <ActionButton run={removeContent} args={["comment", c.id, "Removed by an admin"]} label="Remove" icon="remove" done="Comment removed" confirm="Remove this comment?" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No comments yet.</p>
        )}
      </section>
    </div>
  );
}

// Who can use this site. Only the superadmin invites or removes admins; everyone else sees the list.
function Admins({ admins, invites, me, isSuper }: { admins: AdminAccount[]; invites: AdminInvite[]; me: string; isSuper: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {isSuper ? (
        <section aria-labelledby="invite-admin" className={CARD}>
          <h2 id="invite-admin" className="font-semibold">
            Invite an admin
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            We email them a link that works for 7 days. They sign in with the Nomrank account for that email address and accept.
          </p>
          <InviteAdminForm />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">Only the superadmin can invite or remove admins.</p>
      )}
      {isSuper && invites.length > 0 && (
        <section aria-labelledby="open-invites">
          <h2 id="open-invites" className={OVERLINE}>
            Waiting for a reply · {invites.length}
          </h2>
          <ul className="mt-2 divide-y divide-hairline">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="font-semibold wrap-anywhere">{i.email}</span>
                  <span className="block text-xs text-faint">Sent {timeAgo(i.created_at)}</span>
                </span>
                <ActionButton run={cancelInvite} args={[i.id]} label="Cancel" icon="dismiss" done="Invitation cancelled" />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="admin-list">
        <h2 id="admin-list" className={OVERLINE}>
          {admins.length} {admins.length === 1 ? "admin" : "admins"}
        </h2>
        <ul className="mt-2 divide-y divide-hairline">
          {admins.map((a) => (
            <li key={a.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0">
                <span className="font-semibold">@{a.username}</span>
                {a.is_super && <span className="ml-2 rounded-full bg-mustard/15 px-2 py-0.5 text-xs font-semibold text-mustard">Superadmin</span>}
                {a.display_name && !a.is_super && <span className="ml-1.5 text-sm text-muted-foreground">{a.display_name}</span>}
                <span className="block text-xs text-faint">Admin since {timeAgo(a.created_at)}</span>
              </span>
              {a.user_id === me ? (
                <span className="text-xs font-semibold text-faint">You</span>
              ) : (
                isSuper &&
                !a.is_super && (
                  <ActionButton run={removeAdmin} args={[a.user_id]} label="Remove admin" icon="remove" done={`@${a.username} is no longer an admin`} confirm={`Remove @${a.username} as an admin? We'll email them.`} />
                )
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Head-to-head matchups people vote on. Voting is one person, one pick; deleting a battle clears its votes.
function Battles({ battles, dishes }: { battles: Awaited<ReturnType<typeof getAdminBattles>>; dishes: Awaited<ReturnType<typeof getDishOptions>> }) {
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="new-battle" className={CARD}>
        <h2 id="new-battle" className="font-semibold">
          Create a battle
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Two live dishes. It shows in their city, or everywhere if they&apos;re in different cities.</p>
        <CreateBattleForm dishes={dishes} />
      </section>
      <section aria-labelledby="battle-list">
        <h2 id="battle-list" className={OVERLINE}>
          {battles.length} {battles.length === 1 ? "battle" : "battles"}
        </h2>
        {battles.length ? (
          <ul className="mt-2 divide-y divide-hairline">
            {battles.map((b) => {
              const n = b.votes.a + b.votes.b;
              return (
                <li key={b.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold wrap-anywhere">{b.tag}</p>
                    <p className="text-sm text-muted-foreground wrap-anywhere">
                      {b.a} <span className="text-faint">vs</span> {b.b}
                    </p>
                    <p className="mt-0.5 text-xs text-faint tabular-nums">
                      {b.city ?? "City war"} · {n} {n === 1 ? "vote" : "votes"}
                      {n > 0 && ` (${b.votes.a} to ${b.votes.b})`}
                    </p>
                  </div>
                  <ActionButton run={deleteBattle} args={[b.id]} label="Delete" icon="remove" done="Battle deleted" confirm={n ? `Delete this battle and its ${n} votes?` : "Delete this battle?"} />
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty icon={SwordsIcon}>No battles yet. Create the first one above.</Empty>
        )}
      </section>
    </div>
  );
}
