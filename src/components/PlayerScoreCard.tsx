"use client";

import { motion } from "framer-motion";

interface PlayerScoreCardProps {
  rank: number;
  name: string;
  score: number;
  roundCorrect?: boolean; // did they guess correctly this round?
  isQuestionMaster?: boolean;
  delay?: number;
}

/**
 * Individual player score row in the leaderboard.
 */
export default function PlayerScoreCard({
  rank,
  name,
  score,
  roundCorrect,
  isQuestionMaster,
  delay = 0,
}: PlayerScoreCardProps) {
  const medalEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <motion.div
      className="game-card flex items-center gap-3 py-3 px-4"
      style={{
        background: rank === 1
          ? "linear-gradient(135deg, #3d2a7a, #5a3db0)"
          : "var(--bg-card)",
        borderColor: rank === 1 ? "var(--accent-yellow)" : undefined,
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {/* Rank */}
      <div className="text-2xl w-10 text-center font-black" style={{ color: "var(--accent-yellow)" }}>
        {medalEmoji ?? `#${rank}`}
      </div>

      {/* Name + round result */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base truncate">
          {name}
          {isQuestionMaster && (
            <span className="ml-2 text-xs opacity-50">👑 QM</span>
          )}
        </div>
        {roundCorrect !== undefined && (
          <div
            className="text-xs font-semibold"
            style={{
              color: roundCorrect ? "var(--accent-green)" : "var(--accent-red)",
            }}
          >
            {isQuestionMaster ? "Question Master" : roundCorrect ? "✓ Correct guess" : "✗ Wrong guess"}
          </div>
        )}
      </div>

      {/* Score */}
      <div
        className="text-2xl font-black"
        style={{ color: "var(--accent-blue)" }}
      >
        {score}
      </div>
    </motion.div>
  );
}
