"use client";

import { useState } from "react";

export function CopyLink({ label = "Copy proposal link" }: { label?: string }) {
  const [message, setMessage] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Link copied");
    } catch {
      setMessage("Copy the URL from your browser address bar.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 font-[family-name:var(--font-sans)] text-sm">
      <button type="button" onClick={copy} className="border border-[var(--ink)] px-4 py-2">{label}</button>
      <span role="status">{message}</span>
    </div>
  );
}
