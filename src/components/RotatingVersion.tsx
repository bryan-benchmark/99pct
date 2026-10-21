"use client";

import { useEffect, useState } from "react";
import { heroMarkBox, heroMarkColor, heroMarkSrc, heroMarks } from "@/content/heroMarks";

const markClass = "ml-[0.45em] inline-block h-[1.15em] w-auto max-w-[3.2em] shrink-0 align-[-0.18em] object-contain object-left";

const markClassByName: Record<string, string> = {
  Walmart: "ml-[0.45em] inline-block h-[1.15em] w-[4.3em] max-w-none shrink-0 align-[-0.18em]",
  Visa: "ml-[0.45em] inline-block h-[1.15em] w-[3.35em] max-w-none shrink-0 align-[-0.18em]",
  Mastercard: "ml-[0.45em] inline-block h-[1.15em] w-[1.72em] max-w-none shrink-0 align-[-0.18em] object-contain object-left",
  Instagram: "ml-[0.45em] inline-block h-[1.15em] w-[1.15em] max-w-none shrink-0 align-[-0.18em] object-contain object-left",
  X: "ml-[0.45em] inline-block h-[1.15em] w-[1.15em] max-w-none shrink-0 align-[-0.18em]",
  NFL: "ml-[0.45em] inline-block h-[1.15em] w-[0.85em] max-w-none shrink-0 align-[-0.18em] object-contain object-left",
};

function Mark({ name }: { name: string }) {
  const className = markClassByName[name] ?? markClass;
  const src = heroMarkSrc[name];
  if (src) {
    // Tiny static SVGs in /public/hero, sized to the headline.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} />;
  }
  if (name === "Microsoft") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
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
    <svg viewBox={heroMarkBox[name] ?? "0 0 24 24"} className={className} aria-hidden="true" preserveAspectRatio="xMinYMid meet">
      <path fill={fill} d={d} />
    </svg>
  );
}

export function useRotatingName(names: readonly string[]) {
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

  return names[index] ?? names[0];
}

export function VersionLine({ name }: { name: string }) {
  return (
    <span aria-hidden="true">
      Let&apos;s Taylor&apos;s <span className="whitespace-nowrap">Version:<Mark name={name} /></span>
    </span>
  );
}

export function RotatingVersion({ names }: { names: readonly string[] }) {
  return <VersionLine name={useRotatingName(names)} />;
}
