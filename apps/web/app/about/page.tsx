import type { Metadata } from "next";
import Link from "next/link";
import {
  BanIcon,
  CameraIcon,
  FlagIcon,
  HandshakeIcon,
  HouseHeartIcon,
  LockIcon,
  MessageCircleIcon,
  ScaleIcon,
  SproutIcon,
  StarIcon,
  TrophyIcon,
  UsersRoundIcon,
  UtensilsIcon,
} from "lucide-react";
import { BackLink } from "@/components/back-link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "How Nomrank works · Nomrank", description: "How scores, rankings and Tastes like home work, and how we keep it fair.", alternates: { canonical: "/about" } };

type Point = { icon: React.ElementType; title: string; text: React.ReactNode };

const BASICS: Point[] = [
  { icon: UtensilsIcon, title: "Rate the dish, not the place", text: "Every score is for one dish at one place. The same restaurant can make a great dosa and a forgettable vada." },
  { icon: StarIcon, title: "Scores from 0.5 to 10", text: "In half steps. The overall rating on a dish is the plain average of everyone's scores." },
  { icon: MessageCircleIcon, title: "Takes, votes and comments", text: "Add a short take with your score. Others can Agree or Disagree and reply. You can't vote on your own." },
  { icon: HouseHeartIcon, title: "Tastes like home", text: "How people from a food's home region rate it, e.g. 8.7 from 12 Kannadigas on a masala dosa. It shows once 3 of them have rated a dish." },
];

const RANKINGS: Point[] = [
  { icon: TrophyIcon, title: "One list per food", text: "Dosa, Biryani, Idli and more. Each dish joins its food's list automatically." },
  { icon: ScaleIcon, title: "Weighted, not a plain average", text: "Every dish starts from a neutral 7 that real ratings pull up or down, so one perfect 10 can't take the top spot on its own." },
  { icon: SproutIcon, title: "New accounts count half", text: "For their first week, so a burst of fresh accounts can't push a dish up." },
  { icon: BanIcon, title: "Nobody can pay for a spot", text: "Not restaurants, not anyone. The order comes only from people's ratings." },
];

const GUIDELINES: Point[] = [
  { icon: UtensilsIcon, title: "Rate what you actually ate", text: "One honest rating per dish. Change it any time if your take changes." },
  { icon: HandshakeIcon, title: "Keep it about the food", text: "Roast the dish, never the people. No harassment, hate or personal attacks, and never region vs region." },
  { icon: CameraIcon, title: "Your own photos only", text: "Of the food you had. No photos of other people without their say-so." },
  { icon: BanIcon, title: "No fakes or paid takes", text: "Don't rate for a restaurant you own or work for, or for something in return." },
  { icon: FlagIcon, title: "See something off? Report it", text: "Every take, comment and dish has a Report button. Reports are private." },
];

const PRIVACY: Point[] = [
  { icon: UsersRoundIcon, title: "Public", text: "Your handle, name, picture, bio, food preference, home region, ratings, takes and comments." },
  { icon: LockIcon, title: "Only you", text: "Your email, date of birth and gender. Your Want to try list and Diary can be limited from Settings." },
  {
    icon: HandshakeIcon,
    title: "Yours to take or delete",
    text: (
      <>
        Download everything or delete your account from{" "}
        <Link href="/settings#account" className="font-semibold text-foreground underline-offset-4 hover:underline">
          Settings
        </Link>
        .
      </>
    ),
  },
];

export default function AboutPage() {
  return (
    <PageShell wide>
      <div className="pb-6">
        <BackLink href="/" />
        <h1 className="mt-2 text-[1.75rem] leading-tight font-bold tracking-[-0.02em]">How Nomrank works</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Nomrank is where people rate individual dishes, argue about them, and find what&apos;s worth eating. Here&apos;s how the numbers
          work and how we keep it fair.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-2 lg:gap-6">
          <Section id="basics" title="The basics" points={BASICS} />
          <Section id="rankings" title="How rankings work" points={RANKINGS} />
          <Section id="guidelines" title="Community guidelines" points={GUIDELINES} />
          <Section id="privacy" title="What's public, what's private" points={PRIVACY} />
        </div>

        <section id="disclaimer" aria-labelledby="disclaimer-title" className="mt-5 scroll-mt-6 rounded-2xl border border-hairline p-4 sm:p-5 lg:mt-6">
          <h2 id="disclaimer-title" className="font-semibold">
            The fine print
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Scores, rankings and takes are the personal opinions of people on Nomrank, not reviews by Nomrank. Nomrank isn&apos;t affiliated
            with, sponsored by, or paid by any restaurant listed. Menus, places and dish details are added by the community and may be out of
            date, so check with the restaurant about ingredients and allergens.
          </p>
        </section>
      </div>
    </PageShell>
  );
}

function Section({ id, title, points }: { id: string; title: string; points: Point[] }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-2xl border border-hairline bg-paper p-4 sm:p-5">
      <h2 id={`${id}-title`} className="font-semibold">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-4">
        {points.map(({ icon: Icon, title: heading, text }) => (
          <li key={heading} className="flex gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-mustard/12 text-mustard">
              <Icon aria-hidden className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{heading}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
