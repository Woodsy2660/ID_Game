// ============================================================
// Placeholder game data — easy to swap out later
// ============================================================

export interface Player {
  id: number;
  name: string;
}

export interface Question {
  id: number;
  text: string;
}

/** The five players in the game */
export const PLAYERS: Player[] = [
  { id: 1, name: "Player 1" },
  { id: 2, name: "Player 2" },
  { id: 3, name: "Player 3" },
  { id: 4, name: "Player 4" },
  { id: 5, name: "Player 5" },
];

/** Placeholder questions shown in the Answer Flow */
export const QUESTIONS: Question[] = [
  { id: 1, text: "Who is most likely to survive longest in the wild?" },
  { id: 2, text: "Who is most likely to become famous?" },
  { id: 3, text: "Who is most likely to accidentally start drama in a group chat?" },
  { id: 4, text: "Who is most likely to cry during a movie?" },
];

/** The visible range label shown to guessing players */
export const VISIBLE_RANGE_LABEL = "Questions 1–10";

/** Default correct question (shared between both flows) */
export const DEFAULT_CORRECT_QUESTION_ID = 3;

/** Number of guessing players */
export const GUESSER_COUNT = 4;

/** Simulated round results — which guesser IDs guessed correctly */
export const SIMULATED_CORRECT_GUESSERS = [2, 4]; // Player 2 and Player 4 guessed right

/** Simulated cumulative scores heading into this round */
export const SIMULATED_BASE_SCORES: Record<number, number> = {
  1: 2,
  2: 1,
  3: 3,
  4: 0,
  5: 1,
};
