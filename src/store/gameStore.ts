import { create } from 'zustand';
import type { GamePhase, Player, RoundAnswer, RoundResult } from './types';
import questionBank from '../data/questionBank.json';

/**
 * Game state store — manages the state machine and round data.
 *
 * In production, phase transitions are driven by Supabase broadcast events.
 * In prototype mode, transitions are driven locally via advancePhase().
 *
 * State machine: round_start → qm_active → answer_phase → round_results → leaderboard → round_start
 */

const PHASE_ORDER: GamePhase[] = [
  'round_start',
  'qm_active',
  'answer_phase',
  'round_results',
  'leaderboard',
];

interface GameState {
  // Session — populated by lobby (MVP dev) or mock setup
  roomCode: string | null;
  localPlayerId: string | null;
  players: Player[];

  // Round state
  phase: GamePhase;
  currentRound: number;
  qmPlayerId: string | null;
  questionId: number | null;
  visibleQuestionIds: number[];  // 10 IDs shown to answerers (1 real + 9 decoys)
  usedQuestionIds: number[];     // tracks used questions across session

  // Answers for current round
  submissions: Record<string, number>;  // playerId → guessedQuestionId

  // Scores
  scores: Record<string, number>;       // playerId → cumulative score

  // Round history
  roundResults: RoundResult[];
}

interface GameActions {
  // Derived
  isQM: () => boolean;
  getQMPlayer: () => Player | undefined;
  getNextQMPlayer: () => Player | undefined;

  // Phase transitions
  advancePhase: () => void;
  setPhase: (phase: GamePhase) => void;

  // Round lifecycle
  startRound: () => void;
  submitAnswer: (playerId: string, guessedQuestionId: number) => void;
  allAnswered: () => boolean;
  computeResults: () => RoundAnswer[];
  nextRound: () => void;

  // Setup
  initGame: (players: Player[], localPlayerId: string, roomCode?: string) => void;
  resetGame: () => void;
}

const pickQuestion = (usedIds: number[]): number => {
  const available = questionBank.filter((q) => !usedIds.includes(q.id));
  if (available.length === 0) return questionBank[0].id;
  return available[Math.floor(Math.random() * available.length)].id;
};

const pickDecoys = (correctId: number, usedIds: number[], count: number): number[] => {
  const pool = questionBank
    .filter((q) => q.id !== correctId && !usedIds.includes(q.id))
    .map((q) => q.id);
  // Shuffle and take `count`
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // Initial state
  roomCode: null,
  localPlayerId: null,
  players: [],
  phase: 'round_start',
  currentRound: 0,
  qmPlayerId: null,
  questionId: null,
  visibleQuestionIds: [],
  usedQuestionIds: [],
  submissions: {},
  scores: {},
  roundResults: [],

  // Derived
  isQM: () => {
    const { localPlayerId, qmPlayerId } = get();
    return localPlayerId === qmPlayerId;
  },

  getQMPlayer: () => {
    const { players, qmPlayerId } = get();
    return players.find((p) => p.id === qmPlayerId);
  },

  getNextQMPlayer: () => {
    const { players, qmPlayerId } = get();
    if (players.length === 0) return undefined;
    const currentIdx = players.findIndex((p) => p.id === qmPlayerId);
    const nextIdx = (currentIdx + 1) % players.length;
    return players[nextIdx];
  },

  // Phase transitions
  advancePhase: () => {
    const { phase } = get();
    const idx = PHASE_ORDER.indexOf(phase);
    const nextIdx = (idx + 1) % PHASE_ORDER.length;
    set({ phase: PHASE_ORDER[nextIdx] });
  },

  setPhase: (phase: GamePhase) => set({ phase }),

  // Start a round — picks QM, draws question, generates decoy set
  startRound: () => {
    const { players, currentRound, usedQuestionIds } = get();
    if (players.length === 0) return;

    const qmIdx = currentRound % players.length;
    const qmPlayerId = players[qmIdx].id;
    const questionId = pickQuestion(usedQuestionIds);
    const decoyIds = pickDecoys(questionId, usedQuestionIds, 9);
    const visibleQuestionIds = [questionId, ...decoyIds].sort(() => Math.random() - 0.5);

    // Initialise scores for new players
    const scores = { ...get().scores };
    players.forEach((p) => {
      if (!(p.id in scores)) scores[p.id] = 0;
    });

    set({
      qmPlayerId,
      questionId,
      visibleQuestionIds,
      usedQuestionIds: [...usedQuestionIds, questionId],
      submissions: {},
      scores,
      phase: 'round_start',
    });
  },

  // Submit an answer for a player
  submitAnswer: (playerId: string, guessedQuestionId: number) => {
    set((state) => ({
      submissions: { ...state.submissions, [playerId]: guessedQuestionId },
    }));
  },

  // Check if all non-QM players have answered
  allAnswered: () => {
    const { players, qmPlayerId, submissions } = get();
    const answerers = players.filter((p) => p.id !== qmPlayerId);
    return answerers.every((p) => p.id in submissions);
  },

  // Compute results for the current round
  computeResults: () => {
    const { players, qmPlayerId, questionId, submissions, scores, currentRound, roundResults } = get();
    const answers: RoundAnswer[] = players
      .filter((p) => p.id !== qmPlayerId)
      .map((p) => ({
        playerId: p.id,
        guessedQuestionId: submissions[p.id] ?? -1,
        isCorrect: submissions[p.id] === questionId,
      }));

    // Update scores
    const newScores = { ...scores };
    answers.forEach((a) => {
      if (a.isCorrect) newScores[a.playerId] = (newScores[a.playerId] ?? 0) + 1;
    });

    const result: RoundResult = {
      roundNumber: currentRound,
      questionId: questionId!,
      qmPlayerId: qmPlayerId!,
      answers,
    };

    set({
      scores: newScores,
      roundResults: [...roundResults, result],
    });

    return answers;
  },

  // Advance to next round
  nextRound: () => {
    set((state) => ({ currentRound: state.currentRound + 1 }));
    get().startRound();
  },

  // Initialise game with players
  initGame: (players, localPlayerId, roomCode) => {
    set({
      players,
      localPlayerId,
      roomCode: roomCode ?? null,
      currentRound: 0,
      usedQuestionIds: [],
      submissions: {},
      scores: {},
      roundResults: [],
      phase: 'round_start',
    });
    get().startRound();
  },

  // Full reset
  resetGame: () => {
    set({
      roomCode: null,
      localPlayerId: null,
      players: [],
      phase: 'round_start',
      currentRound: 0,
      qmPlayerId: null,
      questionId: null,
      visibleQuestionIds: [],
      usedQuestionIds: [],
      submissions: {},
      scores: {},
      roundResults: [],
    });
  },
}));
