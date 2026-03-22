import { create } from 'zustand';
import type { GamePhase, Player, RoundAnswer, RoundResult, RoundStartedPayload } from './types';
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
  roundId: string | null;        // UUID of the current rounds row
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
  setNextRound: (payload: RoundStartedPayload) => void;
  submitAnswer: (playerId: string, guessedQuestionId: number) => void;
  syncSubmissions: (submissions: Record<string, number>) => void;
  allAnswered: () => boolean;
  computeResults: () => RoundAnswer[];
  nextRound: () => void;

  // Setup
  initGame: (
    players: Player[],
    localPlayerId: string,
    roomCode?: string,
    initialRound?: { qmPlayerId: string; questionId: number; visibleQuestionIds: number[]; roundId: string }
  ) => void;
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
  roundId: null,
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

  // Replace local submissions with the authoritative complete set from the results:ready broadcast.
  // Ensures all devices compute results from identical data regardless of which individual
  // answer:submitted broadcasts they may have missed.
  syncSubmissions: (submissions: Record<string, number>) => {
    set({ submissions });
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

  // Apply server-assigned next round state (from start-round edge function broadcast).
  // Preserves scores and round history; resets only per-round fields.
  setNextRound: (payload: RoundStartedPayload) => {
    set((state) => ({
      currentRound: payload.roundNumber - 1, // store is 0-indexed
      roundId: payload.roundId,
      qmPlayerId: payload.qmPlayerId,
      questionId: payload.questionId,
      visibleQuestionIds: payload.visibleQuestionIds,
      usedQuestionIds: [...state.usedQuestionIds, payload.questionId],
      players: payload.players,
      submissions: {},
      phase: 'round_start',
    }));
  },

  // Advance to next round (client-side fallback — used in dev/single-device mode)
  nextRound: () => {
    set((state) => ({ currentRound: state.currentRound + 1 }));
    get().startRound();
  },

  // Initialise game with players.
  // When initialRound is provided (from the start-game edge function), use those
  // server-assigned values so all devices share the same QM and question.
  // When omitted, fall back to client-side selection (single-device / dev mode).
  initGame: (players, localPlayerId, roomCode, initialRound) => {
    const baseScores: Record<string, number> = {};
    players.forEach((p) => { baseScores[p.id] = 0; });

    set({
      players,
      localPlayerId,
      roomCode: roomCode ?? null,
      currentRound: 0,
      roundId: null,
      usedQuestionIds: [],
      submissions: {},
      scores: baseScores,
      roundResults: [],
      phase: 'round_start',
    });

    if (initialRound) {
      set({
        roundId: initialRound.roundId,
        qmPlayerId: initialRound.qmPlayerId,
        questionId: initialRound.questionId,
        visibleQuestionIds: initialRound.visibleQuestionIds,
        usedQuestionIds: [initialRound.questionId],
      });
    } else {
      get().startRound();
    }
  },

  // Full reset
  resetGame: () => {
    set({
      roomCode: null,
      localPlayerId: null,
      players: [],
      phase: 'round_start',
      currentRound: 0,
      roundId: null,
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
