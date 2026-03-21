"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { QUESTIONS } from "@/data/gameData";
import SlotMachine from "@/components/SlotMachine";
import SecretQuestionCard from "@/components/SecretQuestionCard";
import SubmissionTracker from "@/components/SubmissionTracker";
import Leaderboard from "@/components/Leaderboard";

/**
 * Question Flow — the Question Master's device experience.
 *
 * Screen 1: Slot machine number reveal
 * Screen 2: Secret question + submission tracker
 * Screen 3: Leaderboard
 */
type Screen = "slot" | "question" | "leaderboard";

export default function QuestionFlowPage() {
  const [screen, setScreen] = useState<Screen>("slot");
  const [allSubmitted, setAllSubmitted] = useState(false);
  const { correctQuestionId, questionMaster } = useGame();
  const router = useRouter();

  // Find the actual question object
  const question = QUESTIONS.find((q) => q.id === correctQuestionId) ?? QUESTIONS[0];

  const handleSlotComplete = useCallback(() => {
    setScreen("question");
  }, []);

  const handleAllSubmitted = useCallback(() => {
    setAllSubmitted(true);
  }, []);

  const handleContinue = () => {
    setScreen("leaderboard");
  };

  const handleBackHome = () => {
    router.push("/");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "slot" && (
        <motion.div
          key="slot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <SlotMachine
            targetNumber={correctQuestionId}
            onComplete={handleSlotComplete}
          />
        </motion.div>
      )}

      {screen === "question" && (
        <motion.div
          key="question"
          className="flex flex-col min-h-[100dvh] px-5 py-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs uppercase tracking-wider font-bold opacity-50 mb-1">
              Question Master
            </p>
            <h2 className="text-xl font-black" style={{ color: "var(--accent-yellow)" }}>
              👑 {questionMaster.name}
            </h2>
          </motion.div>

          {/* Secret Question Card */}
          <SecretQuestionCard
            questionNumber={question.id}
            questionText={question.text}
          />

          {/* Spacer + instructions */}
          <motion.p
            className="text-xs text-center opacity-40 font-semibold mt-6 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.3 }}
          >
            Arrange the ID cards on the table while waiting for guesses
          </motion.p>

          {/* Submission Tracker */}
          <div className="game-card mb-6">
            <SubmissionTracker onAllSubmitted={handleAllSubmitted} />
          </div>

          {/* Continue Button */}
          <motion.button
            className={`btn-game w-full mt-auto ${allSubmitted ? "btn-primary" : "btn-secondary"}`}
            disabled={!allSubmitted}
            onClick={handleContinue}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileTap={allSubmitted ? { scale: 0.96 } : undefined}
          >
            {allSubmitted ? "Continue to Leaderboard →" : "Waiting for answers..."}
          </motion.button>
        </motion.div>
      )}

      {screen === "leaderboard" && (
        <motion.div
          key="leaderboard"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Leaderboard onBackHome={handleBackHome} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
