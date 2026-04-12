# IDEAS

## FEATURES

* Better context menu for items
    * Locking items to be excluded from prospecting / selling it
    * Unlocking items
    * Using items for different party members (sliding sub-menu to choose party member), if no party members except the player only, there should not be sub-menu, only Use action to use it on the player
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
    * Player can only claim the empty hex
    * Player can't claim not-passable hexes
    * Player can claim further only the neighbour hexes of the already claimed one (so there wouldn't be several claimed territories, only solid one)
    * Player's territory should be shown as all the hexes overall border (white colored)
    * Player can't claim hex near another player's or neutral claimed hex
    * Claiming hex requires cloth and sticks as material to make a banner that will be placed on that hex (like, just a small banner icon top-left on the hex with a player's color)
* Buildings
    * Player can build specific buildings on their territory
    * Buildings provide additional opportunities for player
    * Buildings require resources to be build
* Enchanting items for a gold
    * There should be additional random stat on an item
    * Enchanting item one more time just replaces previous enchant
    * Enchanteded stat should have another color (cyan) to be visible between regular stats
* Reforging items for a gold
    * Reforging can be available only by visiting specific types of building
    * Choosing stat to reforge and paying money causes this stat to be replaced with the random one
    * Reforging the same item again should be limited by choosing the already reforged stat, not all the item stats
    * Reforged stat should have another color (pink) to be visible between regular stats
* Parties and mercenaries with their own eqipment
    * On death they should drop all their equipment
* Party vs party battles
* Summoner enemies
* World bosses
* Dungeons with their own map with (entrance + exit)
* Fractions
    * Have several (7-25) hexes to be located on
    * Have borders and noone can spawn inside its borders
    * Has neutral NPCs
    * Has buildings
* Guilds
* Server logic and multiplayer
    * Google Auth
    * Rename defaults, set profile picture
* Adaptive game design for mobile
    * Focuses on tap
    * Context menu opening on holding tap
* Talent tree
    * Similar to "Hero Siege", "Path of exile" talent tree
    * It should contain at least 2000 nodes to choose from
    * There should be several "root" nodes to start allocating talents from
    * Next nodes can be allocated only after allocating previous neighbour nodes
    * One hero level adds one talent point
* Content talent tree
    * The same as "talent tree", but for the content player facing in the world
    * Content talent tree should have at least 1000 nodes to be allocated from
        * Dungeons
        * Raids
        * Neutral big cities
        * Regular enemies
        * Chests and chance to get a mimic instead of looting chest
    * Completing different content types in the game provides one content talent tree point to be allocated
* Achievements
    * Bonuses for completed achievements
* Steam integration
* Minimap
    * Shows player, hexes content, other players
    * Shows claimed area borders and owner name
* Quests (+Quest Book Window)
    * Fractions provide quests to be complete
    * Quest types varies
        * Gather resources
            * Can be completed immediately if player has enough resources in inventory
        * Killing speficic amount of specific enemies
        * Complete dungeons
        * Craft specific item
    * Upon completing quest should be returned to the same NPC where this quest has been taken from
    * Quest provides rewards
        * Gold
        * Random item
        * Resources
            * Rewarding resources should differ from resources as a requirement for a quest (if this quest type is gathering)
    * Quest can provide different rewards to be choosen from
    * If quest is completed player can claim rewards
    * Taken quest should be shown in Quest Book
        * Additional information about NPC name, its location, quest requirements and rewards should be also shown
    * There should be a possibility to abandon the quest
        * Abandonned quest can be taken one more time from the source NPC
* Reputation
    * Instead of killing neutral NPCs and ruining buildings player can complete quests and increase reputation with this fraction
    * Increasing reputation above neutral causes NPCs to become friendly and non-targetable for a battle
    * Killing neutral NPCs causes decreasing reputation for this fraction
    * Decreasing reputation below neutral causes NPCs to become aggressive and initialize auto-battle with player
    * Increasing reputation causes NPCs prices and buildings services to become cheaper
* Game stages
    * Some game mechanics should be available after reaching specific requirements (game stage)
* Researches

## IMPROVEMENTS

* Review the project
    * Review pixi.js and canvas rendering for possible improvements to the performance
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
* Game favicon
    * Light and dark favicons based on the selected browser's theme
    * Game title in index.html
* Window's loading spinner should be shown only if loading takes more than 1s
* Rename Jerky Pack -> Apple
* Trading
    * SHIFT+LMB should buy x5 items (pressing and holding SHIFT should change text to "Buy x5")
    * CTRL+LMB should buy/sell x100 items (pressing and holding SHIFT should change text to "Buy x100")
* Optimizing
    * Optimize .png images
