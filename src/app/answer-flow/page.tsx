"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { QUESTIONS, VISIBLE_RANGE_LABEL } from "@/data/gameData";
import QuestionMasterAnnouncement from "@/components/QuestionMasterAnnouncement";
import GuessOptionList from "@/components/GuessOptionList";
import ResultScreen from "@/components/ResultScreen";
import Leaderboard from "@/components/Leaderboard";

/**
 * Answer Flow — the guessing players' device experience.
 *
 * Screen 1: Question Master announcement
 * Screen 2: Guess the question
 * Screen 3: Correct / Incorrect result
 * Screen 4: Leaderboard
 */
type Screen = "announce" | "guess" | "result" | "leaderboard";

export default function AnswerFlowPage() {
  const [screen, setScreen] = useState<Screen>("announce");
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const { correctQuestionId, questionMaster } = useGame();
  const router = useRouter();

  const handleContinueFromAnnounce = () => {
    setScreen("guess");
  };

  const handleSubmitGuess = () => {
    if (selectedQuestionId === null) return;
    setIsCorrect(selectedQuestionId === correctQuestionId);
    setScreen("result");
  };

  const handleResultTimeout = useCallback(() => {
    setScreen("leaderboard");
  }, []);

  const handleBackHome = () => {
    router.push("/");
  };

  return (
    <AnimatePresence mode="wait">
      {/* Screen 1: Question Master Announcement */}
      {screen === "announce" && (
        <motion.div
          key="announce"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <QuestionMasterAnnouncement
            playerName={questionMaster.name}
            onContinue={handleContinueFromAnnounce}
          />
        </motion.div>
      )}

      {/* Screen 2: Guess the Question */}
      {screen === "guess" && (
        <motion.div
          key="guess"
          className="flex flex-col min-h-[100dvh] px-5 py-8"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <motion.h1
            className="text-2xl font-black text-center mb-1"
            style={{ color: "var(--accent-yellow)" }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Guess the Question!
          </motion.h1>

          <motion.p
            className="text-sm text-center opacity-50 font-semibold mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.1 }}
          >
            Which question did {questionMaster.name} receive?
          </motion.p>

          {/* Range label */}
          <motion.div
            className="text-center mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{
                background: "rgba(79,195,247,0.15)",
                color: "var(--accent-blue)",
                border: "1px solid rgba(79,195,247,0.3)",
              }}
            >
              {VISIBLE_RANGE_LABEL}
            </span>
          </motion.div>

          {/* Question list */}
          <GuessOptionList
            questions={QUESTIONS}
            selectedId={selectedQuestionId}
            onSelect={setSelectedQuestionId}
          />

          {/* Submit button */}
          <motion.button
            className={`btn-game w-full mt-6 ${selectedQuestionId !== null ? "btn-primary" : "btn-secondary"}`}
            disabled={selectedQuestionId === null}
            onClick={handleSubmitGuess}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={selectedQuestionId !== null ? { scale: 0.96 } : undefined}
          >
            {selectedQuestionId !== null ? "Submit Guess →" : "Select a Question"}
          </motion.button>
        </motion.div>
      )}

      {/* Screen 3: Result (correct or incorrect) */}
      {screen === "result" && (
        <motion.div
          key="result"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ResultScreen correct={isCorrect} onTimeout={handleResultTimeout} />
        </motion.div>
      )}

      {/* Screen 4: Leaderboard */}
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
