import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = { title: "Credits · Nomrank", description: "The photos Nomrank uses and who made them.", alternates: { canonical: "/credits" } };

// Photos on the coming-soon page. Their Creative Commons licences require this attribution to stay reachable.
const PHOTOS = [
  {
    title: "Dum Biryani Plate",
    by: "Umesh Tongbra",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    url: "https://commons.wikimedia.org/w/index.php?curid=10799461",
  },
  {
    title: "Idli sambar",
    by: "Shobha Elizabeth John",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    url: "https://commons.wikimedia.org/w/index.php?curid=40989946",
  },
];

const LINK = "font-semibold text-foreground underline-offset-4 hover:underline";

const SECTIONS: LegalSection[] = [
  {
    id: "photos",
    title: "Photos",
    body: (
      <ul>
        {PHOTOS.map((p) => (
          <li key={p.url}>
            <a href={p.url} className={LINK}>
              “{p.title}”
            </a>{" "}
            by {p.by}, licensed under{" "}
            <a href={p.licenceUrl} className={LINK}>
              {p.licence}
            </a>
            , via Wikimedia Commons. Shown cropped.
          </li>
        ))}
        <li>
          The other food photos on the coming-soon page come from{" "}
          <a href="https://unsplash.com" className={LINK}>
            Unsplash
          </a>
          , used under the{" "}
          <a href="https://unsplash.com/license" className={LINK}>
            Unsplash License
          </a>
          . Shown cropped.
        </li>
      </ul>
    ),
  },
];

export default function CreditsPage() {
  return (
    <LegalPage
      title="Credits"
      updated="24 October 2026"
      intro={<p>Nomrank uses these photos under their licences. Thank you to the people who made them.</p>}
      sections={SECTIONS}
    />
  );
}
