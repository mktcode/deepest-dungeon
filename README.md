# TODO

- [ ] BUG: safe room light not visible when safe room is to the top
- [ ] BUG: death animation doesn't trigger sometimes
- [ ] BUG: can't click inside of door to move
- [ ] trapdoors, random tiles change after standing on them too long, instant death
- [ ] more story
- [ ] implement global high score
- [ ] implement spell attack
- [ ] animate cooldowns in item slots
- [ ] make torches usable on demand
- [ ] remove mobile control leftovers
- [ ] UI change, fade in/out when narrator speaks
- [ ] more beautiful and unique UI
- [ ] subtitles for the narrator
- [ ] use seeds as sharable "sessions" and saved games
- [ ] more enemies/traps
- [ ] stamina for running (and attacking)
- [ ] fix bouncy hero collision (leading to leaving a room unintended)
- [ ] adjust volume of all sounds/narrative
- [ ] timeeater countdown doesn't stop when pausing the game
- [ ] add all credits
- [ ] zoom to object of interest (narrator)
- [ ] attack combo with second attack animation
- [ ] skill mana
- [ ] skill shield (duration, damage)
- [ ] let timeeater wander around dungeon
- [ ] make sounds play in parallel if neccessary
- [ ] chapter popup text
- [ ] sound effects must be quiter when narrator speaks
- [ ] make character slide/speed up/down a bit
- [ ] make timeeater a sensor
- [ ] look around idle animation
- [ ] Narrative
  - [ ] adjust volumes
- [ ] add/improve sounds
  - [ ] going down stairs
  - [ ] walking/running when slowmo
- [ ] new (animated) boss enemy
- [ ] put the time eater as far away from the doors as possible
- [ ] steem blockchain as storage
- [ ] light layer: seamless rooms
- [ ] multiplayer
  - [ ] connect via seed
  - [ ] ranks
  - [ ] permanent leveling
  - [ ] randomly meet other players
    - [ ] they introduced themselves with theirs names: input field, initiate chat
- [ ] when you find an item, make the level depending on that item:
  - find pathfinder: make levels bigger
  - find shield: more enemies running at you
  - find fireball: make flamable stuff you need to break to reach the doors
  - etc

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
