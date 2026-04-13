# FEATURES

* Better context menu for items
    * Locking items to be excluded from prospecting / selling it
    * Unlocking items
    * Using items for different party members (sliding sub-menu to choose party member), if no party members except the player only, there should not be sub-menu, only Use action to use it on the player
* Ga(m)e settings (+window and its button working with hotkey)
    * Contains tabs:
        * Graphic settings
            * Clouds enabling / disabling
* Better item stats
    * More stats
        * Attack Speed (decreases global cooldown and cooldown of abilities)
        * Critical Strike Chance
            * Default Critical Strike Damage is 150%
        * Critical Strike Damage
        * Lifesteal Chance
            * Default Lifesteal Amount is 0.5%
        * Lifesteal Amount
    * If player has more than 100% of some stats it means that it procs 1 time for sure and has a chance to proc one more time (Chance - 100%)
* Global cooldown
    * Every battle entity should have global cooldown
    * Global cooldown value should be respected between casting abilities
    * Default global cooldown value is 1.5s
    * Global cooldown values can be decreased by increasing Attack Speed stat
* Abilities
    * Default battle entity ability (player + enemies) is Kick
    * Each ability should have mana amount to be spent on cast
    * Each ability has cooldown
    * Each ability has its casting time (or be instant)
    * Common and Uncommon and Rare enemies should have one additional random ability
    * Epic enemies should have two additional random abilities
    * Legendary enemies should have three additional random abilities
    * Abilities that are available in the game:
        * Kick
            * CD: 1s
            * Instant
            * Regular damage
            * Target: first available enemy in the enemy group
        * Knockback
            * CD: 5s
            * Instant
            * Small damage
            * Causing debuff "Stunned" that doesn't allow to take actions for 3s
        * Fireball
            * CD: 3s
            * Casting time: 1.5s
            * Regular damage
            * Doing AOE damage (10% of initial) on hit to all the party members
        * Frostbolt
            * CD: 4s
            * Casting time: 1s
            * Regular damage
            * Causing debuff "Chilled" that increases the time of battle entity's global cooldown by 20%
        * Flash Heal
            * CD: 3s
            * Casting time: 1.5s
            * 5% of HP healed to the caster
        * Great Heal
            * CD: 10s
            * Casting time: 3s
            * 15% of HP healed to the caster
        * Interrupt
            * CD: 10s
            * Instant
            * Can be casted on the enemy that is casting something right now
            * Interrupts the cast for enemy and causing debuff "Silence" that prevents from casting for 5s
        * Slash
            * CD: 2s
            * Instant
            * Small damage to all of the enemies party members
        * Warcry
            * CD: 10s
            * Instant
            * Buffs all your party members with "Constitution" which grants 20% HP
        * Battlecry
            * CD: 10s
            * Instant
            * Buffs all your party members with "Motivation" which grants 10% of attack damage and 10% of magical damage
    * When battle starts player and enemies start casting their abilities simultaneously (not depending on each other)
* (R)ecipe book (+window and its button working with hotkey)
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
* Corrupting item
* Parties and mercenaries with their own eqipment
    * On death they should drop all their equipment
* Summoner enemies
* World bosses
    * Takes 7 hexes to be rendered (centered one and 6 neighbours)
    * World boss icon should be rendered as a size of 7 hexes diameter
    * Should have x100 more HP
    * Should have x5 more attack damage
    * Should have more defense
    * Guarantee to drop epic / legendary rarity item and a lot of gold
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
* (T)alent tree (+window and its button working with hotkey)
    * Similar to "Hero Siege", "Path of exile" talent tree
    * It should contain at least 2000 nodes to choose from
    * There should be several "root" nodes to start allocating talents from
    * Next nodes can be allocated only after allocating previous neighbour nodes
    * One hero level adds one talent point
    * Should be rendered with canvas
    * Window should be resizable, canvas should adapt to the window size
    * Should have "rendering window" which means that user is focused on the center of the talent tree and a lot of tree nodes are rendered outside of "rendering window" and hidden
    * Holding LMB and dragging outside of any tree node should scroll (move) the canvas "rendering window"
    * Nodes should be visually linked with the dependent nodes
* Resizable windows
    * Inventory
    * Log
* Co(n)tent talent tree (+window and its button working with hotkey)
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
* (Q)uests (+window and its button working with hotkey)
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
* Rep(u)tation (+window and its button working with hotkey)
    * Instead of killing neutral NPCs and ruining buildings player can complete quests and increase reputation with this fraction
    * Increasing reputation above neutral causes NPCs to become friendly and non-targetable for a battle
    * Killing neutral NPCs causes decreasing reputation for this fraction
    * Decreasing reputation below neutral causes NPCs to become aggressive and initialize auto-battle with player
    * Increasing reputation causes NPCs prices and buildings services to become cheaper
* Game stages
    * Some game mechanics should be available after reaching specific requirements (game stage)
* Researches
* Every trader should have its own gold capacity to buy player's stuff
* Trading
    * SHIFT+LMB should buy x5 items (pressing and holding SHIFT should change text to "Buy x5")
    * CTRL+LMB should buy/sell x100 items (pressing and holding SHIFT should change text to "Buy x100")
* Harvest moon (+message in log with cyan color, +moon, moon shafts and game background in cyan shades)
    * 10% to appear
    * Resources (that can be gathered) are appearing around
    * Empty hex should not have resources while initialization
    * Herbs can be gathered via hex type = herbs with this icon https://game-icons.net/1x1/delapouite/herbs-bundle.html
    * Gathering logs can also have a chance to gather sticks
    * Gathering ore can also have a chance to gather stone
* Every morning there is a 5% chance that earthshake appear
    * Dungeon openes nearby on an empty hex
