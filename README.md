# Cryptid — GitHub Pages Edition

This is a fully client-side Vue 3 version of Cryptid designed to run directly from GitHub Pages.

## Features

- Auto, random, and visual manual game creation
- 3, 4, or 5 players
- Standard and Advanced modes
- Positive and negative highlighting
- Note Mode with editable player names and clickable crossed-out clues
- Advanced black structures
- Advanced inverse clues (`Not ...`)
- Find-all-combos solver
- Solution visualization
- Visual manual editor with all six game boards
- Click a manual board to rotate it 180°
- Drag a manual board onto another to swap positions
- Drag structures from the palette onto the map
- Drag placed structures to move them independently of boards
- Right-click a placed structure in the manual editor to remove it
- Existing board/setup CSV assets and tile images

## GitHub Pages setup

Put the contents of this folder at the root of your repository. The important files are:

```text
index.html
css/
js/
assets/
.nojekyll
README.md
```

Then commit and push:

```bash
git add .
git commit -m "Update Cryptid GitHub Pages app"
git push
```

On GitHub go to **Settings → Pages** and select:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/ (root)**

For a repository named `Cryptid`, the site will normally be:

```text
https://YOUR-GITHUB-USERNAME.github.io/Cryptid/
```

## Client-side architecture

The game does not need a server, database, Node.js, npm, or paid hosting. GitHub Pages only serves the files; Vue and the game logic run in the browser.

Vue 3 is loaded from the public unpkg CDN, so the browser needs internet access to load Vue.

## Local testing

Because the app uses `fetch()` for CSV files, use a local web server instead of opening `index.html` directly with `file://`.

With Python installed:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```
