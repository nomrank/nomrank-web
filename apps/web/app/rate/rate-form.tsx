"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { ImagePlusIcon, XIcon } from "lucide-react";
import type { DishDetail } from "@/lib/restaurants";
import { photoUrl } from "@/lib/ratings";
import { resizeToJpeg } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Disclaimer } from "@/components/disclaimer";
import { ScoreMeter } from "@/components/score-meter";
import { saveRating, type SaveRatingState } from "@/app/rating-actions";
import { PostedPanel } from "./posted-panel";

type Existing = { score: number; take: string | null; photos: string[] } | null;
type Photo = { key: string; path?: string; file?: File; preview: string };
const MAX_TAKE = 500;

export function RateForm({ dish, userId, existing, intro }: { dish: DishDetail; userId: string; existing: Existing; intro?: React.ReactNode }) {
  const [state, action, pending] = useActionState<SaveRatingState, FormData>(saveRating, {});
  const [score, setScore] = useState(existing?.score ?? 0);
  const [take, setTake] = useState(existing?.take ?? "");
  const [photos, setPhotos] = useState<Photo[]>(() => (existing?.photos ?? []).map((path) => ({ key: path, path, preview: photoUrl(path) })));
  const [photosChanged, setPhotosChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = pending || uploading;

  function addFiles(files: FileList | null) {
    const room = 4 - photos.length;
    const picked = [...(files ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, room);
    setPhotos((p) => [...p, ...picked.map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
    if (picked.length) setPhotosChanged(true);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!score) return setLocalError("Pick a score from 0.5 to 10.");
    setLocalError(undefined);
    const fd = new FormData(e.currentTarget);
    if (photosChanged) {
      setUploading(true);
      try {
        const supabase = createClient();
        const paths = await Promise.all(
          photos.map(async (p) => {
            if (p.path) return p.path;
            const path = `${userId}/${crypto.randomUUID()}.jpg`;
            const { error } = await supabase.storage.from("rating-photos").upload(path, await resizeToJpeg(p.file!), { contentType: "image/jpeg" });
            if (error) throw error;
            return path;
          }),
        );
        fd.set("photos_sent", "1");
        paths.forEach((path) => fd.append("photo", path));
      } catch {
        setUploading(false);
        return setLocalError("A photo didn't upload. Check your connection and try again.");
      }
      setUploading(false);
    }
    startTransition(() => action(fd));
  }

  const error = localError ?? state.error;
  if (state.posted) return <PostedPanel posted={state.posted} rateAnother="/rate" />;
  return (
    <>
    {intro}
      <form onSubmit={submit} className="flex flex-col gap-7 pb-6">
        <input type="hidden" name="dish_id" value={dish.id} />

        <ScoreMeter score={score} onChange={setScore} />

        <Field>
          <FieldLabel htmlFor="take" className="font-semibold">
            Hot take <span className="font-medium text-muted-foreground">(optional)</span>
          </FieldLabel>
          <AutoTextarea
            id="take"
            name="take"
            value={take}
            onChange={(e) => setTake(e.target.value.slice(0, MAX_TAKE))}
            rows={4}
            placeholder="What did you think?"
            aria-describedby="take-count"
            className="w-full rounded-md border border-input bg-raised px-3.5 py-3 text-base leading-relaxed focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
          <p id="take-count" className="text-right text-sm text-muted-foreground tabular-nums">
            {take.length}/{MAX_TAKE}
          </p>
        </Field>

        <div>
          <p className="mb-3 text-sm font-semibold">
            Photos <span className="font-medium text-muted-foreground">(up to 4)</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <span key={p.key} className="relative size-20 overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element -- local previews and Storage URLs */}
                <img src={p.preview} alt={`Photo ${i + 1}`} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPhotos((all) => all.filter((x) => x.key !== p.key));
                    setPhotosChanged(true);
                  }}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-1 right-1 grid size-7 place-items-center rounded-full bg-studio/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <XIcon className="size-4" />
                </button>
              </span>
            ))}
            {photos.length < 4 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid size-20 place-items-center rounded-md border border-dashed border-input text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <ImagePlusIcon className="size-6" />
                <span className="sr-only">Add photos</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
        </div>

        {error && <FieldError className="text-base">{error}</FieldError>}

        <Button type="submit" size="xl" className="w-full" disabled={busy}>
          {busy && <Spinner data-icon="inline-start" />}
          {uploading ? "Uploading photos" : pending ? "Posting" : take.trim() ? "Post it" : "Save score"}
        </Button>
        <Disclaimer className="justify-center text-center">
          Your score, take and photos are public. Rate what you actually ate, and keep it about the food.
        </Disclaimer>
      </form>
    </>
  );
}
