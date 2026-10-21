"use client";

import { useEffect, useState } from "react";
import { heroMarkColor, heroMarks } from "@/content/heroMarks";

const markClass = "mr-[0.28em] inline-block h-[1.15em] w-[1.15em] shrink-0 align-[-0.18em]";

function Mark({ name }: { name: string }) {
  if (name === "Microsoft") {
    return (
      <svg viewBox="0 0 24 24" className={markClass} aria-hidden="true">
        <path fill="#F25022" d="M0 0v11.408h11.408V0z" />
        <path fill="#7FBA00" d="M12.594 0v11.408H24V0z" />
        <path fill="#00A4EF" d="M0 12.594V24h11.408V12.594z" />
        <path fill="#FFB900" d="M12.594 12.594V24H24V12.594z" />
      </svg>
    );
  }
  const d = heroMarks[name];
  const fill = heroMarkColor[name];
  if (!d || !fill) return null;
  return (
    <svg viewBox="0 0 24 24" className={markClass} aria-hidden="true">
      <path fill={fill} d={d} />
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
