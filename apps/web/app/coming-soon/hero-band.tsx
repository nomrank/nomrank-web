import { TiltedGridHero, type TiltedGridImage } from "@/components/ui/tilted-grid-hero";
import { Score } from "@/components/score";

// Sample scores, one plate per launch city in turn. The label says so: nothing here is a real rating yet.
const PLATES = [
  { photo: "plates/pav-bhaji.jpg", dish: "Pav bhaji", city: "Mumbai", score: 9.3 },
  { photo: "plates/mutton-biryani.jpg", dish: "Mutton biryani", city: "Hyderabad", score: 9.6 },
  { photo: "idli-sambar.jpg", dish: "Idli sambar", city: "Bengaluru", score: 8.8 },
  { photo: "plates/butter-chicken.jpg", dish: "Butter chicken", city: "Delhi", score: 9.1 },
  { photo: "plates/ragda-chaat.jpg", dish: "Ragda chaat", city: "Mumbai", score: 8.4 },
  { photo: "plates/chicken-biryani.jpg", dish: "Chicken biryani", city: "Bengaluru", score: 8.6 },
  { photo: "plates/paneer-tikka.jpg", dish: "Paneer tikka", city: "Delhi", score: 7.9 },
  { photo: "plates/samosa.jpg", dish: "Samosa", city: "Hyderabad", score: 8.2 },
];

const IMAGES: TiltedGridImage[] = PLATES.map((p) => ({
  src: `/coming-soon/${p.photo}`,
  overlay: (
    <>
      <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-studio/85 to-transparent" />
      <span className="absolute right-[7%] bottom-[8%] left-[6%] text-left text-spotlight">
        <span className="block text-[0.875rem] leading-tight font-semibold tracking-[-0.01em] sm:text-[1.125rem]">{p.dish}</span>
        <span className="block text-[0.6875rem] text-spotlight/75 sm:text-[0.8125rem]">{p.city}</span>
      </span>
      <Score score={p.score} size={68} className="absolute top-[6%] right-[6%] origin-top-right scale-[0.72] sm:scale-100" />
    </>
  ),
}));

// The hero's moving row: real plates curving past with their scores printed on them.
export function HeroBand() {
  return (
    <TiltedGridHero
      images={IMAGES}
      aspectRatio={6 / 5}
      tileHeight={76}
      maxWidth={66}
      gap={2}
      axis={50}
      curve={44}
      fade={7}
      speed={3.5}
      className="h-[19rem] w-full sm:h-[24rem] lg:h-[clamp(22rem,42svh,30rem)]"
    />
  );
}
