"use client";

import { useEffect, useState } from "react";
import { heroMarks } from "@/content/heroMarks";

function Mark({ name }: { name: string }) {
  const d = heroMarks[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" className="mx-[0.18em] inline-block h-[0.82em] w-[0.82em] translate-y-[-0.06em] fill-current" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function RotatingVersion({ names }: { names: readonly string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % names.length);
    }, 2400);
    const stop = () => {
      if (media.matches) window.clearInterval(id);
    };
    media.addEventListener("change", stop);
    return () => {
      window.clearInterval(id);
      media.removeEventListener("change", stop);
    };
  }, [names]);

  const name = names[index] ?? names[0];
  return (
    <span aria-hidden="true">
      The Taylor&apos;s version <span className="whitespace-nowrap">of <Mark name={name} />{name}.</span>
    </span>
  );
}
