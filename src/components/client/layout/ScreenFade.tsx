// app/components/ScreenFade.tsx
"use client";
import { useEffect, useRef } from "react";

export default function ScreenFade() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const docH = document.documentElement.scrollHeight;
      const distanceFromBottom = docH - (window.scrollY + window.innerHeight);

      const fadeStart = 300;
      const opacity = Math.min(1, Math.max(0, distanceFromBottom / fadeStart));
      el.style.opacity = opacity.toString();
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <div ref={ref} className="screen-fade-bottom hidden md:block" />;
}
