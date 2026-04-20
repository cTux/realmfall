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

export function isVoiceActorId(value: unknown): value is VoiceActorId {
  return VOICE_ACTOR_OPTIONS.some((option) => option.id === value);
}
