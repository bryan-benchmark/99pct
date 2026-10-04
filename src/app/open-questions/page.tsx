import type { Metadata } from "next";
import { MaturityBadge } from "@/components/MaturityBadge";
import { Page, Section } from "@/components/Page";
import {
  openQuestions,
  openQuestionsIntro,
} from "@/content/openQuestions";

export const metadata: Metadata = { title: "Open Questions" };

export default function OpenQuestionsPage() {
  return (
    <Page
      title="Open questions"
      lede={openQuestionsIntro}
      source="spec/RIGHTS_AND_CONSTRAINTS.md"
    >
      <Section title="Active research">
        <ol className="list-decimal space-y-5 pl-5">
          {openQuestions.map((item) => (
            <li key={item.question} className="pl-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[var(--ink)]">{item.question}</span>
                <MaturityBadge level={item.maturity} />
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Where ideas go">
        <p>
          Preferred directions that are not yet canonical belong in{" "}
          <code className="mono">docs/proposals/</code>. Things we want
          implementations to test belong in{" "}
          <code className="mono">docs/experiments/</code>. Solved items move
          into <code className="mono">spec/</code> with a{" "}
          <code className="mono">/changes</code> entry—not silently into website
          copy.
        </p>
      </Section>
    </Page>
  );
}
