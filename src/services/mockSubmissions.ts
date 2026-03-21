import { useGameStore } from '../store/gameStore';
import { getGameChannel } from './mockBroadcast';

/**
 * Simulates other players submitting answers over time.
 * In production, this is handled by Supabase edge functions and broadcast events.
 *
 * Call startMockSubmissions() when the QM screen mounts.
 * It will simulate answerers submitting at staggered intervals.
 */

let timers: NodeJS.Timeout[] = [];

export function startMockSubmissions(): void {
  stopMockSubmissions();

  const store = useGameStore.getState();
  const { players, qmPlayerId, questionId, visibleQuestionIds } = store;
  const answerers = players.filter((p) => p.id !== qmPlayerId);
  const channel = getGameChannel();

  // Stagger submissions at 2s, 4.5s, 7s, 9s, etc.
  const delays = [2000, 4500, 7000, 9000, 11000, 13000, 15000];

  answerers.forEach((player, i) => {
    const delay = delays[i % delays.length];
    const t = setTimeout(() => {
      // Simulate: 40% chance of guessing correctly
      const isCorrect = Math.random() < 0.4;
      const guess = isCorrect
        ? questionId!
        : visibleQuestionIds.find((id) => id !== questionId) ?? visibleQuestionIds[0];

      useGameStore.getState().submitAnswer(player.id, guess);
      channel.emit('answer:submitted', { playerId: player.id });

      // Check if all answered
      if (useGameStore.getState().allAnswered()) {
        channel.emit('round:all_answered', {});
      }
    }, delay);
    timers.push(t);
  });
}

export function stopMockSubmissions(): void {
  timers.forEach(clearTimeout);
  timers = [];
}
