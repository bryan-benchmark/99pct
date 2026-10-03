import type { Metadata } from "next";
import { Page, Section } from "@/components/Page";
import { changes } from "@/content/changes";

export const metadata: Metadata = { title: "Changes" };

export default function ChangesPage() {
  return (
    <Page
      title="Changes"
      lede="Public changelog for the Missionism specification surface. Major changes should eventually link to an RFC or discussion."
      source="spec/"
    >
      {changes.map((entry) => (
        <Section key={entry.version} title={`v${entry.version}`}>
          <p className="text-[var(--muted)]">{entry.date}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {entry.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      ))}
    </Page>
  );
}
