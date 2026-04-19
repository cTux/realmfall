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

export interface VoiceActorOptionDefinition {
  id: VoiceActorId;
  labelKey: string;
}

export type VoiceActorId =
  | 'alex-brodie'
  | 'ian-lampert'
  | 'karen-cenon'
  | 'meghan-christian'
  | 'sean-lenhart';

export const VOICE_ACTOR_OPTIONS: VoiceActorOptionDefinition[] = [
  {
    id: 'alex-brodie',
    labelKey: 'ui.settings.audio.voice.actors.alexBrodie',
  },
  {
    id: 'ian-lampert',
    labelKey: 'ui.settings.audio.voice.actors.ianLampert',
  },
  {
    id: 'karen-cenon',
    labelKey: 'ui.settings.audio.voice.actors.karenCenon',
  },
  {
    id: 'meghan-christian',
    labelKey: 'ui.settings.audio.voice.actors.meghanChristian',
  },
  {
    id: 'sean-lenhart',
    labelKey: 'ui.settings.audio.voice.actors.seanLenhart',
  },
];

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
    eager: true,
    import: 'default',
  },
) as Record<string, string>;

const VOICE_CLIP_LIBRARY = buildVoiceClipLibrary(voiceClipModules);

export function getVoiceClipUrls(
  actorId: VoiceActorId,
  category: VoiceClipCategory,
) {
  return VOICE_CLIP_LIBRARY[actorId][category];
}

export function isVoiceActorId(value: unknown): value is VoiceActorId {
  return VOICE_ACTOR_OPTIONS.some((option) => option.id === value);
}

function buildVoiceClipLibrary(modules: Record<string, string>) {
  const library = VOICE_ACTOR_OPTIONS.reduce<
    Record<VoiceActorId, Record<VoiceClipCategory, string[]>>
  >(
    (current, actor) => ({
      ...current,
      [actor.id]: createEmptyActorLibrary(),
    }),
    {} as Record<VoiceActorId, Record<VoiceClipCategory, string[]>>,
  );

  Object.entries(modules).forEach(([path, url]) => {
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

    library[actorId][category].push(url);
  });

  VOICE_ACTOR_OPTIONS.forEach((actor) => {
    const actorLibrary = library[actor.id];
    (Object.keys(actorLibrary) as VoiceClipCategory[]).forEach((category) => {
      actorLibrary[category].sort();
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
