"use client";

import { useEffect, useState } from "react";

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
      The Taylor&apos;s version <span className="whitespace-nowrap">of {name}.</span>
    </span>
  );
}
