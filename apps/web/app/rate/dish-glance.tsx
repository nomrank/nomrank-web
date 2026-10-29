import { formatScore, photoUrl, scoreColor, summarize, type Review } from "@/lib/ratings";

// Desktop side panel on the rating step: what everyone else has said about this dish so far.
export function DishGlance({ dish, ratings }: { dish: string; ratings: Review[] }) {
  const { count, average, spread } = summarize(ratings.map((r) => r.score));
  const peak = Math.max(1, ...spread);
  const poster = ratings.find((r) => r.photos[0])?.photos[0];
  const takes = ratings.filter((r) => r.take).slice(0, 2);

  return (
    <aside aria-label={`What others think of the ${dish}`} className="hidden overflow-hidden rounded-2xl border border-hairline bg-paper lg:sticky lg:top-6 lg:block">
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage
        <img src={photoUrl(poster.path)} alt={`Photo of ${dish}`} className="aspect-[4/3] w-full object-cover" />
      )}
      <div className="p-5">
        {count === 0 ? (
          <>
            <h2 className="text-base font-bold">No scores yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Yours sets the first one.</p>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-muted-foreground">What others gave it</h2>
            <div className="mt-3 flex items-end gap-5">
              <div className="shrink-0">
                <p className="flex items-center gap-2 text-4xl leading-none font-bold tabular-nums">
                  <span aria-hidden className="size-2.5 rounded-full" style={{ background: scoreColor(average!) }} />
                  {formatScore(Number(average!.toFixed(1)))}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{count === 1 ? "1 rating" : `${count} ratings`}</p>
              </div>
              <div className="flex h-14 flex-1 items-end gap-[3px]" role="img" aria-label={`Scores: ${spread.map((n, i) => `${n} rated ${i + 1}`).join(", ")}`}>
                {spread.map((n, i) => (
                  <span key={i} className="flex-1 rounded-t-[2px] bg-[#4a4052]" style={{ height: `${Math.max(3, (n / peak) * 56)}px` }} />
                ))}
              </div>
            </div>
          </>
        )}
        {takes.length > 0 && (
          <ul className="mt-5 flex flex-col gap-4 border-t border-hairline pt-4">
            {takes.map((r) => (
              <li key={r.id}>
                <blockquote className="line-clamp-3 text-[0.9375rem] leading-relaxed wrap-anywhere">{r.take}</blockquote>
                <p className="mt-1 text-sm text-muted-foreground">
                  @{r.author.username} · <span className="font-semibold tabular-nums" style={{ color: scoreColor(r.score) }}>{formatScore(r.score)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
