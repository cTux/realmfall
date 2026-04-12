# IMPROVEMENTS

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
* Optimizing
    * Optimize images in "src/assets/" directory
* Loading
    * Initial loading should include loading images for initial state of loaded world
    * Loading images after the initial loading should show loading spinner in the place where that image should be shown
* Better hexes
    * Review canvas layers structure
    * Do better background for hexes + background image (transparent?)
    * Hexes are too bright in the daytime (light hex + light hex icon)
* Using consumables should check if they will be useful
    * If consumable will do nothing (nothing to heal or nothing to increase) they shound not be consumed (+log warning message about it)
