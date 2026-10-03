import type { Metadata } from "next";
import Link from "next/link";
import { Page, Section } from "@/components/Page";
import {
  deepSpecPointers,
  experimentPredictions,
  leanSpecFiles,
  maturityExplainer,
  openVsCanonical,
} from "@/content/specification";
import { MaturityBadge } from "@/components/MaturityBadge";

export const metadata: Metadata = { title: "Specification" };

export default function SpecificationPage() {
  return (
    <Page
      title="Specification"
      lede="The website explains. The files under /spec are the canonical protocol. Forking is allowed. Claiming the name without compatibility is not."
      source="spec/canonical.json"
    >
      <Section title="Canonical specification">
        <p>
          Normative short claims live in{" "}
          <code className="mono">spec/canonical.json</code>. Markdown files
          under <code className="mono">spec/</code> expand context. The
          repository containing these documents will be published when a public
          source URL exists; until then, filenames below are repository paths.
        </p>
      </Section>

      <Section title="Open vs canonical">
        <p>
          <strong className="text-[var(--ink)]">Open</strong> — what people may
          freely use, fork, and improve.
        </p>
        <ul className="list-disc pl-5">
          {openVsCanonical.open.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4">
          <strong className="text-[var(--ink)]">Canonical / protected</strong> —
          what may not be claimed casually.
        </p>
        <ul className="list-disc pl-5">
          {openVsCanonical.canonical.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title="Maturity labels">
        <dl className="space-y-3">
          {maturityExplainer.map((row) => (
            <div key={row.label}>
              <dt className="font-medium text-[var(--ink)]">{row.label}</dt>
              <dd className="text-[var(--body)]">{row.body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Lean canonical surface (v0.1)">
        <ul className="list-none space-y-2 pl-0">
          {leanSpecFiles.map((file) => (
            <li key={file.path}>
              <code className="mono text-[var(--ink)]">{file.path}</code>
              <span className="text-[var(--muted)]"> — {file.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[var(--muted)]">
          Deeper design notes still live alongside these files, including{" "}
          {deepSpecPointers.map((name, i) => (
            <span key={name}>
              {i > 0 ? ", " : null}
              <code className="mono">{name}</code>
            </span>
          ))}
          . See <code className="mono">spec/README.md</code> for the map.
        </p>
      </Section>

      <Section title="Compatibility">
        <p>
          An implementation may claim Missionism compatibility only against a
          published version and its canonical requirements. Certification, when
          used, is about inspectable commitments—not moral approval. See{" "}
          <code className="mono">spec/COMPATIBILITY.md</code> and{" "}
          <code className="mono">spec/CERTIFICATION.md</code>.
        </p>
      </Section>

      <Section
        title={experimentPredictions.title}
        badge={<MaturityBadge level={experimentPredictions.maturity} />}
      >
        <p>{experimentPredictions.lead}</p>
        <p className="font-semibold text-[var(--ink)]">
          {experimentPredictions.hypothesis}
        </p>
        <p>If Missionism structure is working, we should tend to see:</p>
        <ul className="list-disc pl-5">
          {experimentPredictions.ifWorking.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="font-semibold text-[var(--ink)]">
          {experimentPredictions.ifNot}
        </p>
        <p>
          Design constraint:{" "}
          <strong className="text-[var(--ink)]">
            {experimentPredictions.designConstraint}
          </strong>
        </p>
        <p className="text-[var(--muted)]">
          Not Canonical. This is how the experiment stays falsifiable. See{" "}
          <Link href="/why-now">Why now</Link> and{" "}
          <Link href="/open-questions">Open questions</Link>.
        </p>
      </Section>

      <Section title="Related">
        <p>
          <Link href="/changes">Changelog</Link>
          {" · "}
          <Link href="/why-now">Why now</Link>
          {" · "}
          <Link href="/open-questions">Open questions</Link>
          {" · "}
          <Link href="/principles">Principles</Link>
        </p>
      </Section>
    </Page>
  );
}
