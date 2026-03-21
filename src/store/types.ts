/**
 * Types matching the Supabase schema from BACKEND.md.
 * These mirror the database tables so the store is ready for real integration.
 */

/** Matches rooms.status enum from the backend */
export type GamePhase =
  | 'round_start'
  | 'qm_active'
  | 'answer_phase'
  | 'round_results'
  | 'leaderboard';

export interface Player {
  id: string;           // uuid — matches profiles.id / auth.users.id
  displayName: string;  // matches profiles.display_name
  isHost: boolean;      // matches room_players.is_host
}

export interface Question {
  id: number;           // matches question bank index
  text: string;
}

export interface RoundAnswer {
  playerId: string;
  guessedQuestionId: number;
  isCorrect: boolean;
}

export interface RoundResult {
  roundNumber: number;
  questionId: number;
  qmPlayerId: string;
  answers: RoundAnswer[];
}
