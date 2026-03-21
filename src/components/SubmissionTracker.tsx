"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GUESSER_COUNT } from "@/data/gameData";

interface SubmissionTrackerProps {
  /** Called when all players have submitted */
  onAllSubmitted: () => void;
}

/**
 * Simulates guessing players submitting their answers over time.
 * Shows a progress bar + count (0/4 → 4/4).
 */
export default function SubmissionTracker({ onAllSubmitted }: SubmissionTrackerProps) {
  const [submitted, setSubmitted] = useState(0);

  useEffect(() => {
    // Simulate players submitting at intervals
    const delays = [2000, 4500, 7000, 9000]; // ms after mount
    const timers: NodeJS.Timeout[] = [];

    delays.forEach((delay, i) => {
      const t = setTimeout(() => {
        setSubmitted(i + 1);
        if (i + 1 === GUESSER_COUNT) {
          onAllSubmitted();
        }
      }, delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [onAllSubmitted]);

  const progress = submitted / GUESSER_COUNT;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold opacity-70">Answers Submitted</span>
        <span className="text-lg font-black" style={{ color: "var(--accent-blue)" }}>
          {submitted}/{GUESSER_COUNT}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-4 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: submitted === GUESSER_COUNT
              ? "linear-gradient(90deg, var(--accent-green), #69f0ae)"
              : "linear-gradient(90deg, var(--accent-blue), var(--accent-purple))",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Status text */}
      <motion.p
        className="text-xs mt-2 text-center font-semibold"
        style={{ color: submitted === GUESSER_COUNT ? "var(--accent-green)" : "var(--text-secondary)" }}
        key={submitted}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {submitted === GUESSER_COUNT
          ? "✅ All players have submitted!"
          : submitted === 0
            ? "Waiting for players to guess..."
            : `${submitted} player${submitted > 1 ? "s" : ""} submitted so far...`}
      </motion.p>
    </div>
  );
}
