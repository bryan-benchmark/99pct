"use client";

import { useState } from "react";

function copyPrompt(prompt: string) {
  const area = document.createElement("textarea");
  area.value = prompt;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  return ok;
}

export function AgentHandoff({ prompt, label, quiet = false }: { prompt: string; label: string; quiet?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className={quiet ? "mt-2" : "mt-4"}>
      <button
        type="button"
        className="inline-flex min-h-11 items-center font-[family-name:var(--font-sans)] text-sm font-semibold text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4"
        onClick={() => {
          void navigator.clipboard.writeText(prompt).then(() => setCopied(true)).catch(() => {
            if (copyPrompt(prompt)) setCopied(true);
            else setOpen(true);
          });
        }}
      >
        {copied ? "Copied" : label}
      </button>
      {quiet ? null : (
        <details className="mt-2" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
          <summary className="min-h-11 cursor-pointer font-[family-name:var(--font-sans)] text-sm text-[var(--muted)]">See the instructions</summary>
          <pre className="mt-2 whitespace-pre-wrap font-[family-name:var(--font-sans)] text-sm text-[var(--body)]">{prompt}</pre>
        </details>
      )}
    </div>
  );
}
