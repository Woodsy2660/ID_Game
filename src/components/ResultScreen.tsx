"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface ResultScreenProps {
  correct: boolean;
  /** Called after the display timeout (4 seconds) */
  onTimeout: () => void;
}

/**
 * Full-screen result feedback — green checkmark for correct, red X for wrong.
 * Auto-advances after 4 seconds.
 */
export default function ResultScreen({ correct, onTimeout }: ResultScreenProps) {
  useEffect(() => {
    const t = setTimeout(onTimeout, 4000);
    return () => clearTimeout(t);
  }, [onTimeout]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center"
      style={{
        background: correct
          ? "linear-gradient(180deg, #00c853, #009624)"
          : "linear-gradient(180deg, #ff1744, #b71c1c)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Icon */}
      <motion.div
        className="text-[120px] leading-none mb-4"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        {correct ? "✅" : "❌"}
      </motion.div>

      {/* Text */}
      <motion.h1
        className="text-4xl font-black text-white mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {correct ? "Correct!" : "Wrong Answer"}
      </motion.h1>

      <motion.p
        className="text-lg text-white/70 font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {correct ? "Nice guess! +1 point" : "Better luck next time!"}
      </motion.p>

      {/* Progress indicator */}
      <motion.div
        className="mt-10 w-48 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.2)" }}
      >
        <motion.div
          className="h-full rounded-full bg-white/60"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4, ease: "linear" }}
        />
      </motion.div>
      <p className="text-xs text-white/50 mt-2 font-semibold">
        Moving to leaderboard...
      </p>
    </motion.div>
  );
}
