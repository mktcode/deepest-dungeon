# TODO

- BUGS/ISSUES:
  - death animation doesn't trigger sometimes
  - timeeater countdown and other cooldowns (shield, torch) don't stop when pausing the game
  - idle narrative can overlap other narrative pieces
  - buggy animation when running into candlestands
- IDEAS:
  - ENEMIES/TRAPS/PUZZLES:
    - trapdoors, random tiles change after standing on them too long, instant death
    - more enemies
    - white giant spider as end boss
    - let spiders shoot webs to slow down
  - more story
  - implement global high score
  - make torches usable on demand
  - use seeds as sharable "sessions" and saved games
  - stamina for running (and attacking)
  - attack combo with second attack animation
  - increase hp/mana/damage automatically on level up, instead choose gameplay mechanic (shield damage, fireball bounces to other enemies, etc.)
  - steem blockchain as storage
  - when you find an item, make the level depending on that item:
    - find pathfinder: make levels bigger
    - find shield: more enemies running at you
    - find fireball: make flamable stuff you need to break to reach the doors
    - etc
  - destruction of dungeon when timeeater coundown passed (animate tiles do drop down)
  - NFTs (STEEM)
  - make it possible to go back up (needs adjustments in wake function)
  - the "heart of evil": an item that is carried deepper and deeper into the dungeon by players (presistently)
    - tint player black while having it
    - put a "fake player" in the deepest dungeon (room next to safe room), you need to kill that player to enter the safe room and get the heart
    - needs to be placed in safe room on the shrine to be saved and get only be picked up there
    - initially first safe room after other gameplay introduction ends ("The End") has the heart
    - narrative: "He knew his purpuse now. To carry the heart of evil as deep into the dungeon as possible.
          And wait... what was that. On its back there was a list of names engraved." -> GuiContainer with player names
    - physics based: player needs to push it to the stairs
    - weekly reset of deepest dungeon or progressively set back over time (to give new players a chance of getting there)
    - but keep track of all time deepest dungeon
    - display other players as ghosts
    - permadeath (after using two lives)
  - let enemies randomly respawn (with particle emitter animation of course)
  - randomized items (armor, swords, etc)
  - neural network for guard
- POLISHING:
  - guard in first level that defeats you (while cutscene) and you loose your shield and fireball and sword which were introduced to the player in the cut scene, from there on the guard will always wait for players in the deepest ever reached dungeon, represented by the name and stats of one of the players who reached that dungeon
  - shield should reduce damage instead of pushing enemies
  - shiled should be usable spawn while shift is down and consume mana over time
  - open credits urls in browser (needs electron detection)
  - let enemies take damage from flamethrowers but avoid them
  - spawn (find) fireball spell before shield
  - sound when clicking on enemy
  - prevent casting fireball inside wall (so that it immediately collides)
  - let spiders spit
  - text in the preloading screen with continue button
  - small "rate the game" button on the main menu screen
  - let pathfinder cost mana and make dots dissappear faster
  - replace timeeater countdown with orb/cooldown in character info ui
  - bigger subtitles
  - rework skilling system
  - add all credits
  - zoom to object of interest (narrator)
  - adjust volume of all sounds/narrative
  - sound effects must be quiter when narrator speaks
  - subtitles for the narrator
  - flashing help texts
  - let timeeater wander around dungeon (after first met)
  - better animation for chapter popup text
  - interrupt narrator by pressing a key
  - make character slide/speed up/down a bit
  - increase sword/punch hit boxes
  - Narrative
    - finding fireball scroll
    - running out of mana (when casting fireball or shield)
  - add/improve sounds
    - going down stairs
    - walking/running when slowmo
  - put the time eater as far away from the doors as possible
  - light layer: seamless rooms
- MULTIPLAYER:
  - connect via seed
  - ranks
  - permanent leveling
  - randomly meet other players
    - "they introduced themselves with theirs names": input field, initiate chat

# phaser-electron-typescript-parcel [![Build Status](https://travis-ci.org/distantcam/phaser-electron-typescript-parcel.svg?branch=master)](https://travis-ci.org/distantcam/phaser-electron-typescript-parcel)

A minimal template with the following things.

- [Phaser](https://phaser.io/) 🕹️ Desktop and Mobile HTML5 game framework
- [Electron](https://electronjs.org/) ⚛️ Build cross platform desktop apps with JavaScript, HTML, and CSS
- [Parcel](https://github.com/parcel-bundler/parcel) 📦 Blazing fast, zero configuration web application bundler
- [TypeScript](https://www.typescriptlang.org/) ⌨️ is a typed superset of JavaScript that compiles to plain JavaScript.

## Installation

* `git@github.com:distantcam/phaser-electron-typescript-parcel.git`
* `cd phaser-electron-typescript-parcel`
* `yarn`

## Usage

### Cleaning
Run these commands to clean up the directory
``` bash
# Cleans up the build and dist folders
yarn clean

# Cleans up the builds, build cache, and node modules
yarn superclean
```

### Development mode
Run these commands to build and run the Electron app
``` bash
# Parcel bundles the code
$ yarn build

# Parcel bundles the code and watches for changes
$ yarn watch

# Run the electron app
$ yarn app

# Run the electron app with options for a debugger to attach to the render process
$ yarn debug

# To debug the app in VS Code you can
# - use yarn debug and run 'Electron: Renderer' in the debugger
# or
# - run 'Electron: All' in the debugger
```

### Production mode and packaging app
Run this command to bundle code in production mode
``` bash
# Create executables
$ yarn dist
```
