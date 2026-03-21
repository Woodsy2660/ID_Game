"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SecretQuestionCardProps {
  questionNumber: number;
  questionText: string;
}

/**
 * Displays the secret question with a minimize/expand toggle.
 * Warns the Question Master that this screen is private.
 */
export default function SecretQuestionCard({ questionNumber, questionText }: SecretQuestionCardProps) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="w-full">
      {/* Minimize toggle button */}
      <button
        onClick={() => setMinimized(!minimized)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl mb-2 font-bold text-sm"
        style={{
          background: "rgba(255,255,255,0.08)",
          color: "var(--accent-yellow)",
        }}
      >
        <span>{minimized ? "👁 Show Question" : "🙈 Hide Question"}</span>
        <span className="text-xs opacity-60">{minimized ? "TAP TO REVEAL" : "TAP TO HIDE"}</span>
      </button>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            className="game-card"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {/* Private warning */}
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-3 py-1.5 rounded-full inline-block"
              style={{
                background: "rgba(255,23,68,0.15)",
                color: "var(--accent-red)",
              }}
            >
              🔒 Private — Question Master Only
            </div>

            {/* Question number */}
            <motion.div
              className="text-5xl font-black mb-2"
              style={{ color: "var(--accent-yellow)" }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            >
              #{questionNumber}
            </motion.div>

            {/* Question text */}
            <motion.p
              className="text-xl font-bold leading-snug"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {questionText}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
