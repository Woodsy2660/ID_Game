"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  PLAYERS,
  DEFAULT_CORRECT_QUESTION_ID,
  SIMULATED_CORRECT_GUESSERS,
  SIMULATED_BASE_SCORES,
} from "@/data/gameData";

// ============================================================
// Shared game state used by both Question Flow and Answer Flow
// ============================================================

interface GameState {
  /** Index into PLAYERS array for the current Question Master */
  questionMasterIndex: number;
  /** The question ID that was assigned (shared correct answer) */
  correctQuestionId: number;
  /** IDs of guessers who answered correctly this round */
  correctGuessers: number[];
  /** Cumulative scores keyed by player id */
  scores: Record<number, number>;
}

interface GameContextValue extends GameState {
  /** Get the current Question Master player */
  questionMaster: (typeof PLAYERS)[number];
  /** Advance to the next Question Master */
  nextRound: () => void;
  /** Reset everything */
  resetGame: () => void;
  /** Compute total scores including this round */
  totalScores: Record<number, number>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    questionMasterIndex: 0,
    correctQuestionId: DEFAULT_CORRECT_QUESTION_ID,
    correctGuessers: SIMULATED_CORRECT_GUESSERS,
    scores: SIMULATED_BASE_SCORES,
  });

  const questionMaster = PLAYERS[state.questionMasterIndex];

  // Total scores = base + 1 point per correct guesser this round
  const totalScores: Record<number, number> = {};
  PLAYERS.forEach((p) => {
    totalScores[p.id] = state.scores[p.id] ?? 0;
    if (state.correctGuessers.includes(p.id)) {
      totalScores[p.id] += 1;
    }
  });

  const nextRound = () => {
    setState((prev) => ({
      ...prev,
      questionMasterIndex: (prev.questionMasterIndex + 1) % PLAYERS.length,
      scores: { ...totalScores }, // carry forward
    }));
  };

  const resetGame = () => {
    setState({
      questionMasterIndex: 0,
      correctQuestionId: DEFAULT_CORRECT_QUESTION_ID,
      correctGuessers: SIMULATED_CORRECT_GUESSERS,
      scores: SIMULATED_BASE_SCORES,
    });
  };

  return (
    <GameContext.Provider
      value={{
        ...state,
        questionMaster,
        nextRound,
        resetGame,
        totalScores,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
