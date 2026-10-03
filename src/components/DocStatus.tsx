import { protocolMeta } from "@/content/protocolMeta";

export type SourceKind = "canonical" | "proposal" | "experiment";

const sourceLabels: Record<SourceKind, string> = {
  canonical: "source",
  proposal: "proposal",
  experiment: "experiment",
};

/**
 * Compact protocol provenance. Ideas first; metadata second.
 * Never label a proposal/experiment path as “Canonical source.”
 */
export function DocStatus({
  source,
  sourceKind = "canonical",
  status = protocolMeta.status,
}: {
  source?: string;
  sourceKind?: SourceKind;
  status?: string;
}) {
  return (
    <p className="doc-status" aria-label="Document status">
      Missionism Protocol v{protocolMeta.version}
      {" · "}
      {status}
      {" · "}
      {protocolMeta.lastUpdated}
      {source ? (
        <>
          {" · "}
          {sourceLabels[sourceKind]}: <code>{source}</code>
        </>
      ) : null}
    </p>
  );
}
