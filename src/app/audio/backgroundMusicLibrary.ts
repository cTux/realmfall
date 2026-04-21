import ambientFindingMithral from '../../assets/music/ambient/geoffharvey-finding-mithral-openworld-game-375527.mp3';
import ambientHopeless from '../../assets/music/ambient/guilhermebernardes-hopeless-119866.mp3';
import ambientNeverAgain from '../../assets/music/ambient/guilhermebernardes-never-again-108445.mp3';
import combatBattleOfTheDragons from '../../assets/music/combat/17406877-battle-of-the-dragons-8037.mp3';
import combatTheTournament from '../../assets/music/combat/emmraan-the-tournament-280277.mp3';
import dungeonWhiteLion from '../../assets/music/dungeon/guilhermebernardes-the-white-lion-10379.mp3';
import townRuins from '../../assets/music/town/nojisuma-ruins-168316.mp3';
import townRpgCity from '../../assets/music/town/phantasticbeats-rpg-city-8381.mp3';
import type { BackgroundMusicMood } from './backgroundMusic';

export const BACKGROUND_MUSIC_PLAYLISTS = {
  ambient: [ambientFindingMithral, ambientHopeless, ambientNeverAgain],
  combat: [combatBattleOfTheDragons, combatTheTournament],
  dungeon: [dungeonWhiteLion],
  town: [townRuins, townRpgCity],
} as const satisfies Record<BackgroundMusicMood, readonly string[]>;
