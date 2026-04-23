export type VoiceClipCategory =
  | 'completion'
  | 'confirmation'
  | 'damage'
  | 'death'
  | 'farewell'
  | 'greeting'
  | 'grunting'
  | 'miscellaneous'
  | 'refusal'
  | 'shouting';

import { VOICE_ACTOR_OPTIONS, type VoiceActorId } from './voiceActors';

const ACTOR_NAME_TO_ID: Record<string, VoiceActorId> = {
  'Alex Brodie': 'alex-brodie',
  'Ian Lampert': 'ian-lampert',
  'Karen Cenon': 'karen-cenon',
  'Meghan Christian': 'meghan-christian',
  'Sean Lenhart': 'sean-lenhart',
};

const voiceClipModules = import.meta.glob(
  '../../assets/dialogue-audio-pack/**/*.wav',
  {
    import: 'default',
  },
) as Record<string, () => Promise<string>>;

const VOICE_CLIP_LIBRARY = buildVoiceClipLibrary(voiceClipModules);

export function getVoiceClipCount(
  actorId: VoiceActorId,
  category: VoiceClipCategory,
) {
  return VOICE_CLIP_LIBRARY[actorId][category].length;
}

export async function getVoiceClipUrls(
  actorId: VoiceActorId,
  category: VoiceClipCategory,
) {
  return Promise.all(
    VOICE_CLIP_LIBRARY[actorId][category].map((clip) => clip.loadUrl()),
  );
}

export async function pickVoiceClipUrl(
  actorId: VoiceActorId,
  category: VoiceClipCategory,
  previousClipIndexes: Partial<Record<VoiceClipCategory, number>>,
) {
  const clips = VOICE_CLIP_LIBRARY[actorId][category];
  if (clips.length === 0) {
    return null;
  }

  if (clips.length === 1) {
    previousClipIndexes[category] = 0;
    return clips[0]?.loadUrl() ?? null;
  }

  const previousIndex = previousClipIndexes[category] ?? -1;
  let nextIndex = Math.floor(Math.random() * clips.length);
  if (nextIndex === previousIndex) {
    nextIndex = (nextIndex + 1) % clips.length;
  }

  previousClipIndexes[category] = nextIndex;
  return clips[nextIndex]?.loadUrl() ?? null;
}

interface VoiceClipEntry {
  loadUrl: () => Promise<string>;
  path: string;
}

function buildVoiceClipLibrary(modules: Record<string, () => Promise<string>>) {
  const library = VOICE_ACTOR_OPTIONS.reduce<
    Record<VoiceActorId, Record<VoiceClipCategory, VoiceClipEntry[]>>
  >(
    (current, actor) => ({
      ...current,
      [actor.id]: createEmptyActorLibrary(),
    }),
    {} as Record<VoiceActorId, Record<VoiceClipCategory, VoiceClipEntry[]>>,
  );

  Object.entries(modules).forEach(([path, loadUrl]) => {
    const normalizedPath = path.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const actorName = parts[parts.length - 2];
    const category = parts[parts.length - 4];

    if (!actorName || !category) {
      return;
    }

    const actorId = ACTOR_NAME_TO_ID[actorName];
    if (!actorId || !isVoiceClipCategory(category)) {
      return;
    }

    library[actorId][category].push({ loadUrl, path: normalizedPath });
  });

  VOICE_ACTOR_OPTIONS.forEach((actor) => {
    const actorLibrary = library[actor.id];
    (Object.keys(actorLibrary) as VoiceClipCategory[]).forEach((category) => {
      actorLibrary[category].sort((left, right) =>
        left.path.localeCompare(right.path),
      );
    });
  });

  return library;
}

function createEmptyActorLibrary() {
  return {
    completion: [],
    confirmation: [],
    damage: [],
    death: [],
    farewell: [],
    greeting: [],
    grunting: [],
    miscellaneous: [],
    refusal: [],
    shouting: [],
  } satisfies Record<VoiceClipCategory, string[]>;
}

function isVoiceClipCategory(value: string): value is VoiceClipCategory {
  return (
    value === 'completion' ||
    value === 'confirmation' ||
    value === 'damage' ||
    value === 'death' ||
    value === 'farewell' ||
    value === 'greeting' ||
    value === 'grunting' ||
    value === 'miscellaneous' ||
    value === 'refusal' ||
    value === 'shouting'
  );
}
