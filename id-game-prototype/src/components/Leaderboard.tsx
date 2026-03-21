"use client";

import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { PLAYERS } from "@/data/gameData";
import PlayerScoreCard from "./PlayerScoreCard";

interface LeaderboardProps {
  onBackHome: () => void;
}

/**
 * Shared leaderboard component used by both Question Flow and Answer Flow.
 * Shows round results and cumulative scores.
 */
export default function Leaderboard({ onBackHome }: LeaderboardProps) {
  const { totalScores, correctGuessers, questionMaster, questionMasterIndex } = useGame();

  // Sort players by total score descending
  const sorted = [...PLAYERS].sort((a, b) => (totalScores[b.id] ?? 0) - (totalScores[a.id] ?? 0));

  // Next Question Master
  const nextQMIndex = (questionMasterIndex + 1) % PLAYERS.length;
  const nextQM = PLAYERS[nextQMIndex];

  return (
    <div className="flex flex-col min-h-[100dvh] px-5 py-8">
      {/* Title */}
      <motion.h1
        className="text-3xl font-black text-center mb-1"
        style={{ color: "var(--accent-yellow)" }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🏆 Leaderboard
      </motion.h1>

      <motion.p
        className="text-sm text-center mb-6 opacity-50 font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.1 }}
      >
        Round Results & Total Scores
      </motion.p>

      {/* Player scores */}
      <div className="flex flex-col gap-2.5 mb-8">
        {sorted.map((player, i) => {
          const isQM = player.id === questionMaster.id;
          const roundCorrect = isQM ? undefined : correctGuessers.includes(player.id);
          return (
            <PlayerScoreCard
              key={player.id}
              rank={i + 1}
              name={player.name}
              score={totalScores[player.id] ?? 0}
              roundCorrect={roundCorrect}
              isQuestionMaster={isQM}
              delay={0.15 + i * 0.08}
            />
          );
        })}
      </div>

      {/* Next QM */}
      <motion.div
        className="game-card text-center mb-6"
        style={{ borderColor: "var(--accent-purple)" }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-xs uppercase tracking-wider font-bold opacity-50 mb-1">
          Next Question Master
        </p>
        <p className="text-xl font-black" style={{ color: "var(--accent-purple)" }}>
          👑 {nextQM.name}
        </p>
      </motion.div>

      {/* Back button */}
      <motion.button
        className="btn-game btn-secondary w-full mt-auto"
        onClick={onBackHome}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        whileTap={{ scale: 0.96 }}
      >
        Back to Home
      </motion.button>
    </div>
  );
}
