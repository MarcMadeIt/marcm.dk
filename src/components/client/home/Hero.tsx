"use client";

import Image from "next/image";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import FloatingBadge from "./elements/FloatingBadge";

type ChipPos = {
  top: string;
  side: "left" | "right";
  xMobile: string;
  xDesktop: string;
  delay: string;
  dur: string;
  opacity: number;
  scale?: number;
  hideOnMobile?: boolean; // 👈 NY
};

const Hero = () => {
  const { t } = useTranslation();

  const chips = [
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Supabase",
    "Node.js",
    "API Design",
    "UI Engineering",
  ];

  const chipPositions: ChipPos[] = [
    {
      top: "22%",
      side: "left",
      xMobile: "-10px",
      xDesktop: "-170px",
      delay: "0s",
      dur: "5.2s",
      opacity: 0.35,
      scale: 0.95,
    },
    {
      top: "33%",
      side: "left",
      xMobile: "-20px",
      xDesktop: "-220px",
      delay: "0.2s",
      dur: "5.8s",
      opacity: 0.28,
      scale: 0.9,
    },
    {
      top: "45%",
      side: "left",
      xMobile: "-20px",
      xDesktop: "-185px",
      delay: "0.4s",
      dur: "5.4s",
      opacity: 0.32,
      scale: 0.95,
    },
    {
      top: "62%",
      side: "left",
      xMobile: "-36px",
      xDesktop: "-240px",
      delay: "0.6s",
      dur: "6.1s",
      opacity: 0.22,
      scale: 0.9,
      hideOnMobile: true,
    },

    {
      top: "24%",
      side: "right",
      xMobile: "16px",
      xDesktop: "170px",
      delay: "0.1s",
      dur: "5.6s",
      opacity: 0.33,
      scale: 0.95,
    },
    {
      top: "36%",
      side: "right",
      xMobile: "20px",
      xDesktop: "220px",
      delay: "0.3s",
      dur: "6.0s",
      opacity: 0.26,
      scale: 0.9,
    },
    {
      top: "50%",
      side: "right",
      xMobile: "14px",
      xDesktop: "185px",
      delay: "0.5s",
      dur: "5.5s",
      opacity: 0.3,
      scale: 0.95,
    },
    {
      top: "66%",
      side: "right",
      xMobile: "36px",
      xDesktop: "240px",
      delay: "0.7s",
      dur: "6.2s",
      opacity: 0.2,
      scale: 0.9,
      hideOnMobile: true,
    }, // 👈 skjul
  ];

  return (
    <section className="relative overflow-hidden px-4 md:py-20">
      <div className="relative mx-auto flex min-h-[640px] md:min-h-[780px] max-w-6xl flex-col items-center justify-center">
        {/* Hello pill */}
        <motion.div
          className="mb-4 badge badge-soft badge-primary badge-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {t("Hero.hello")}
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-center font-bold leading-tight text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="block text-4xl md:text-6xl lg:text-7xl">
            {t("Hero.titleIntro")} <span className="text-white">{t("Hero.name")}</span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <span className="block text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-secondary">
            {t("Hero.subtitle")}
          </span>
        </motion.div>

        {/* Center image + floating badges */}
        <motion.div
          className="relative mt-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="relative h-[380px] w-[380px] md:h-[540px] md:w-[520px]">
            {/* Image wrapper */}
            <div className="relative h-full w-full overflow-hidden rounded-2xl">
              <Image
                src="/me/profile-website.png"
                alt="Portrait"
                fill
                priority
                className="object-cover"
              />

              {/* Fade overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-[#0A0E0A] via-[#0a0e0a55] to-transparent" />
            </div>

            {/* DaisyUI badges */}
            {chips.map((label, i) => {
              const p = chipPositions[i] ?? chipPositions[0];

              return (
                <FloatingBadge
                  key={label}
                  label={label}
                  side={p.side}
                  top={p.top}
                  opacity={p.opacity}
                  xMobile={p.xMobile}
                  xDesktop={p.xDesktop}
                  delay={parseFloat(p.delay)}
                  duration={parseFloat(p.dur)}
                  scale={p.scale}
                  hideOnMobile={p.hideOnMobile}
                />
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
