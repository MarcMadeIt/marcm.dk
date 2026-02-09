"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress } from "@react-three/drei";

export default function SplashScreen() {
  const { progress } = useProgress();
  const [hideSplash, setHideSplash] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const t = setTimeout(() => setHideSplash(true), 300);
      return () => clearTimeout(t);
    }
  }, [progress]);

  // Fjern splash helt på mobil
  if (isMobile) return null;

  return (
    <AnimatePresence>
      {!hideSplash && (
        <motion.div
          className="fixed inset-0 z-50 bg-base-100 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.img
            src="/icon-512x512.png"
            alt="Logo"
            className="w-32 h-32 md:w-40 md:h-40"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
