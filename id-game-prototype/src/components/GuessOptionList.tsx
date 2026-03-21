"use client";

import { motion } from "framer-motion";
import { Question } from "@/data/gameData";

interface GuessOptionListProps {
  questions: Question[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

/**
 * Clickable list of question options for guessing players.
 * Only one option can be selected at a time.
 */
export default function GuessOptionList({ questions, selectedId, onSelect }: GuessOptionListProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {questions.map((q, i) => {
        const isSelected = selectedId === q.id;
        return (
          <motion.button
            key={q.id}
            onClick={() => onSelect(q.id)}
            className={`game-card text-left transition-all ${isSelected ? "glow-selected" : ""}`}
            style={{
              background: isSelected
                ? "linear-gradient(135deg, #3d2a7a, #4a3090)"
                : "var(--bg-card)",
              transform: isSelected ? "scale(1.02)" : "scale(1)",
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-start gap-3">
              {/* Number badge */}
              <div
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
                style={{
                  background: isSelected
                    ? "var(--accent-yellow)"
                    : "rgba(255,255,255,0.1)",
                  color: isSelected ? "#1a1035" : "var(--text-secondary)",
                }}
              >
                {q.id}
              </div>

              {/* Question text */}
              <p
                className="font-bold text-[0.95rem] leading-snug pt-1"
                style={{
                  color: isSelected ? "var(--accent-yellow)" : "var(--text-primary)",
                }}
              >
                {q.text}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
