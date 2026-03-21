"use client";

import { motion } from "framer-motion";

interface QuestionMasterAnnouncementProps {
  playerName: string;
  onContinue: () => void;
}

/**
 * Answer Flow intro screen — announces who the Question Master is.
 */
export default function QuestionMasterAnnouncement({
  playerName,
  onContinue,
}: QuestionMasterAnnouncementProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80dvh] px-6 text-center">
      {/* Crown icon */}
      <motion.div
        className="text-7xl mb-4"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        👑
      </motion.div>

      {/* Player name */}
      <motion.h1
        className="text-3xl font-black mb-2"
        style={{ color: "var(--accent-yellow)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {playerName}
      </motion.h1>

      <motion.h2
        className="text-xl font-bold mb-4 opacity-90"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        is the Question Master!
      </motion.h2>

      <motion.p
        className="text-sm opacity-60 mb-10 max-w-[280px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5 }}
      >
        They&apos;ve received a secret question and are arranging the ID cards.
        Your job is to guess which question they got!
      </motion.p>

      <motion.button
        className="btn-game btn-primary w-full max-w-[280px]"
        onClick={onContinue}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.96 }}
      >
        Continue
      </motion.button>
    </div>
  );
}
