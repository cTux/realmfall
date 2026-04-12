# IDEAS

## FEATURES

* Better hexes
    * Review canvas layers structure
    * Do better background for hexes + background image (transparent?)
    * Hexes are too bright in the daytime (light hex + light hex icon)
* Game settings (+window)
    * Graphic settings
        * Clouds enabling / disabling
        * Windows transparency (including left panel and tooltip transparency)
* Better tooltips
    * Diablo-like tooltip for items and enemies
* Better item stats
    * More stats
    * Colored stats view
* Global cooldown
    * All the battle entities should have global cooldown value that should be respected between casting abilities
    * Global cooldown values can be decreased by increasing corresponding stat rating value
* Abilities
    * Each ability should have mana amount to be spent on cast
    * Each ability has cooldown
* Recipe book (+window)
    * Should have right-side tabs with professions player can learn recipes for
    * Should look like a real book with animated pages
* Recipes as items to be learned
    * Already learned recipe should have proper red text that they're already learned
    * Learned recipe should appear
* Custom area borders
    * Player can claim a hex to become their territory
    * Player can claim further only the neighbour hexes of the already claimed one (so there wouldn't be several claimed territories, only solid one)
    * Player's territory should be shown as all the hexes overall border (white colored)
    * Player can't claim hex near another player's or neutral claimed hex
    * Claiming hex requires cloth and sticks as material to make a banner that will be placed on that hex (like, just a small banner icon top-left on the hex with a player's color)
* Buildings
    * Player can build specific buildings on their territory
    * Buildings provide additional opportunities for player
    * Buildings 
* Enchanting items for a gold
* Parties and mercenaries with their own eqipment
    * On death they should drop all their equipment
* Party vs party battles
* Summoner enemies
* World bosses
* Dungeons with their own map with (entrance + exit)
* Big cities
    * Have several (7-25) hexes to be located on
    * Have borders and noone can spawn inside its borders
* Guilds
* Server logic and multiplayer
    * Google Auth
    * Rename defaults, set profile picture
* CI and GitHub Actions
    * For Pull Requests
    * For pushes to the main branch

## IMPROVEMENTS

* Review the project
    * [+] Get review feeback document
    * Optimize the code
    * Optimize project structure
        * Split the bundle
            * Main bundle should contain only critical styles for loading screen
            * Loading phases should be shown on the loading screen on the left top (like the Linux systems load)
    * Write rules to be applied automatically
        * All the color (or position) transitions should be smoothest transitions ever spotted
* Review Chrome's performance recording
    * Review bottlenecks
    * Optimize code
* Battle balances
* Crafting
    * It should be possible to craft something without any requirement for the hex (hand-crafting recipes)
    * There should be possibility to build structures on the claimed hexed that provide additional crafting options
    * There should be additonal crafting building over the world that provide very unique set of addiotional craftings to the player
