"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * Flow Selector — Landing screen for the prototype.
 * Allows the user to preview either the Question Flow or Answer Flow.
 */
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] px-6 py-10">
      {/* Logo / Title area */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Game icon */}
        <motion.div
          className="text-7xl mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        >
          🎴
        </motion.div>

        <h1
          className="text-4xl font-black tracking-tight mb-2"
          style={{ color: "var(--accent-yellow)" }}
        >
          The ID Game
        </h1>

        <p className="text-sm opacity-50 font-semibold max-w-[260px] mx-auto">
          Interactive flow prototype — choose a flow to preview
        </p>
      </motion.div>

      {/* Flow buttons */}
      <div className="flex flex-col gap-4 w-full max-w-[320px]">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/question-flow" className="block">
            <button className="btn-game btn-primary w-full text-lg">
              👑 Question Flow
            </button>
          </Link>
          <p className="text-xs text-center mt-2 opacity-40 font-semibold">
            The Question Master&apos;s device experience
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Link href="/answer-flow" className="block">
            <button className="btn-game btn-secondary w-full text-lg">
              🤔 Answer Flow
            </button>
          </Link>
          <p className="text-xs text-center mt-2 opacity-40 font-semibold">
            The guessing players&apos; device experience
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        className="text-[10px] opacity-20 mt-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 0.8 }}
      >
        Prototype v0.1 — Frontend Only
      </motion.p>
    </div>
  );
}
