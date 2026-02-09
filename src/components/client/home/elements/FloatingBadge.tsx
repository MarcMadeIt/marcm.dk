"use client";

import React from "react";

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

type Props = {
  label: string;
  side: "left" | "right";
  top: string;
  opacity: number;
  xMobile: string;
  xDesktop: string;
  delay: number; // seconds
  duration: number; // seconds
  scale?: number;
  hideOnMobile?: boolean;
};

export default function FloatingBadge({
  label,
  side,
  top,
  opacity,
  xMobile,
  xDesktop,
  delay,
  duration,
  scale = 1,
  hideOnMobile, // ✅ vigtig: modtag den
}: Props) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const isMdUp = useMediaQuery("(min-width: 768px)");

  const x = isMdUp ? xDesktop : xMobile;

  React.useEffect(() => {
    if (!ref.current) return;

    const keyframes: Keyframe[] = [
      { transform: `translateX(${x}) translateY(0px) scale(${scale})` },
      { transform: `translateX(${x}) translateY(-10px) scale(${scale})` },
      { transform: `translateX(${x}) translateY(0px) scale(${scale})` },
    ];

    const anim = ref.current.animate(keyframes, {
      duration: duration * 1000,
      iterations: Infinity,
      easing: "ease-in-out",
      delay: delay * 1000,
    });

    return () => anim.cancel();
  }, [x, delay, duration, scale]);

  // ✅ fjern helt på mobil, hvis den er markeret
  if (!isMdUp && hideOnMobile) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={[
        "absolute z-20",
        side === "left" ? "left-0" : "right-0",
        "badge badge-outline",
        "border-white/30 bg-white/5 text-white/90 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        "px-3 py-3 text-xs md:text-sm font-medium",
      ].join(" ")}
      style={{
        top,
        opacity,
        filter: "blur(0.2px)",
      }}
    >
      {label}
    </div>
  );
}
