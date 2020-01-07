# TODO

- [ ] Bugfix: when died, xp/points disappear, some weird tween/animation moves them away
- [ ] Bugfix: sometimes enemies are contantly walking against wall
- [ ] trapdoors: random tiles change after standing on them too long, instant death
- [ ] ingame instructions
- [ ] adjust/expand narrator
- [ ] implement global high score
- [ ] implement mana and spell attack
- [ ] animate cooldowns in item slots
- [ ] make torches usable on demand
- [ ] subtitles for the narrator
- [ ] use seeds as sharable "sessions" and saved games
- [ ] more enemies/traps
- [ ] stamina for running (and attacking)
- [ ] disabled slowmo if narrator is disabled
- [ ] death animation doesn't trigger sometimes

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
