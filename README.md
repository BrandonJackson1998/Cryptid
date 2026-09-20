# Cryptid — GitHub Pages Edition

A free, fully client-side digital companion for the board game **Cryptid**. It generates the game map, deals out clues to each player, and helps track and solve games — all running in the browser with no server, database, or build step. Built with Vue 3, ready to deploy straight to GitHub Pages.

## What it does

- **Sets up a game board** three ways:
  - **Auto** — instantly generates a valid random board and clue set
  - **Random** — regenerates a new random layout on demand
  - **Manual** — a visual editor where you recreate a physical board by hand
- **Deals clues** for 3, 4, or 5 players, in **Standard** or **Advanced** mode (Advanced adds black structures and their inverse clues)
- **Tracks the game** on an interactive hex map with positive/negative highlighting of cleared and possible tiles
- **Note Mode** — a shared scratchpad with editable player names and clickable clues players can cross out as they deduce the board
- **Find all combos** — a solver that scans every tile and reports which ones satisfy every player's clue simultaneously
- **Solution visualization** on the map once a solve is found

## Manual board editor

The manual setup screen lets you replicate a real tabletop board:

- Click a board tile to rotate it 180°
- Drag one board onto another to swap their positions
- Drag structures (standing stones, abandoned shacks — in all four colors) from the palette onto any hex
- Drag placed structures to reposition them independently of the boards
- Right-click a placed structure to remove it

## Running it

The app fetches board/setup data from CSV files with `fetch()`, so opening `index.html` directly via `file://` won't work — the browser will block those requests. Serve it with a local web server instead:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/).

Any other static file server (`npx serve`, VS Code's Live Server, etc.) works just as well.

## Project structure

```text
index.html              Vue app shell and templates for every screen
css/
  cryptid.css            All styling
js/
  cryptid.js              Main Vue app: game state, setup flow, solver, Note Mode
  gameBoard.js             Board tile/rotation logic
  gameMap.js                Assembled hex map and clue-checking logic
  tile.js                    Individual tile geometry and drawing helpers
assets/
  gameBoards/              CSV definitions for the six physical game boards
  setups/                    CSV definitions for the possible clue setups
  tiles/                      Terrain and animal-territory tile images
.nojekyll                Disables Jekyll processing on GitHub Pages
```

## Tech stack

- **Vue 3**, loaded from the [unpkg CDN](https://unpkg.com/vue@3/dist/vue.global.js) — requires internet access even when running locally
- Plain HTML5 `<canvas>` for board and manual-editor rendering
- No build tools, bundlers, or npm dependencies — every file is served as-is

## Contributing

Issues and pull requests are welcome. Since there's no build step, you can edit `js/`, `css/`, or `index.html` directly and refresh the browser (with a local server running) to see changes.

## License

Cryptid is a board game designed by Hal Duncan, published by Osprey Games. This project is an unofficial, fan-made digital aid and is not affiliated with or endorsed by the publisher. Add a license of your choice (e.g. MIT) for the code in this repository if you plan to distribute it.