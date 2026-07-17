import boys from './packs/boys.json';
import girls from './packs/girls.json';
import infamous from './packs/infamous.json';
import type { Question } from '../store/types';

/**
 * Question packs.
 *
 * A room is locked to exactly one pack for its whole life. All questions,
 * decoys and lobby previews come only from the room's pack. Question IDs are
 * namespaced by pack (boys 1000+, girls 2000+, infamous 1-999) so a decoy can
 * never leak across packs even though visible_question_ids is a flat int[].
 */
export type PackId = 'boys' | 'girls' | 'infamous';

export const PACK_IDS: PackId[] = ['boys', 'girls', 'infamous'];

export interface PackMeta {
  id: PackId;
  name: string;
  blurb: string;
  /** True for packs that require the 18+ content confirmation before entry. */
  mature: boolean;
}

export const PACK_META: Record<PackId, PackMeta> = {
  boys: {
    id: 'boys',
    name: 'Yeah the Boys',
    blurb: 'PG banter for the lads — find out who the group really rates.',
    mature: false,
  },
  girls: {
    id: 'girls',
    name: 'Yeah the Girls',
    blurb: 'PG chit-chat for the girls — settle every group debate.',
    mature: false,
  },
  infamous: {
    id: 'infamous',
    name: 'The Infamous Original',
    blurb: 'The no-holds-barred original. Adult themes and strong language.',
    mature: true,
  },
};

const BANKS: Record<PackId, Question[]> = {
  boys: boys as Question[],
  girls: girls as Question[],
  infamous: infamous as Question[],
};

/**
 * The content-warning text shown before entering a mature room, and the
 * version string stored alongside each player's confirmation. Bump the version
 * whenever the warning wording changes so prior confirmations can be identified.
 */
export const ADULT_WARNING_VERSION = 'infamous-v1-2026-07-16';

export const ADULT_WARNING_TEXT =
  'This pack contains strong language, sexual references, alcohol references and potentially uncomfortable questions.';

export const ADULT_CONFIRM_LABEL =
  'I confirm that I am at least 18 and want to play this pack.';

export function isValidPack(value: unknown): value is PackId {
  return value === 'boys' || value === 'girls' || value === 'infamous';
}

export function isMaturePack(pack: PackId | null | undefined): boolean {
  return !!pack && PACK_META[pack].mature;
}

/** All questions for a pack. Falls back to an empty list for unknown packs. */
export function getQuestions(pack: PackId | null | undefined): Question[] {
  if (!pack || !BANKS[pack]) return [];
  return BANKS[pack];
}

/**
 * Look up a single question by its ID.
 *
 * Prefers the room's pack, but falls back to a cross-pack search if the ID
 * isn't found there (or the pack is unknown on this client). Question IDs are
 * namespaced per pack — boys 1000+, girls 2000+, infamous 1–999 — so an ID maps
 * unambiguously to exactly one question. This keeps question text resolving even
 * if the room's pack hasn't reached this device yet.
 */
export function findQuestion(
  pack: PackId | null | undefined,
  id: number
): Question | undefined {
  if (pack && BANKS[pack]) {
    const hit = BANKS[pack].find((q) => q.id === id);
    if (hit) return hit;
  }
  for (const p of PACK_IDS) {
    if (p === pack) continue;
    const hit = BANKS[p].find((q) => q.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function questionText(
  pack: PackId | null | undefined,
  id: number
): string {
  return findQuestion(pack, id)?.text ?? '';
}
