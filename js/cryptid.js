/*
 * Cryptid - GitHub Pages client-side app
 * Vue 3 is used only on the client. No server or build step is required.
 */

const BASE_PLAYER_OPTIONS = [
    { id: 1, name: "On forest or desert", type: "terrain", terrains: ["forest", "desert"], maxDistance: 0 },
    { id: 2, name: "On forest or water", type: "terrain", terrains: ["forest", "water"], maxDistance: 0 },
    { id: 3, name: "On forest or swamp", type: "terrain", terrains: ["forest", "swamp"], maxDistance: 0 },
    { id: 4, name: "On forest or mountain", type: "terrain", terrains: ["forest", "mountain"], maxDistance: 0 },
    { id: 5, name: "On desert or water", type: "terrain", terrains: ["desert", "water"], maxDistance: 0 },
    { id: 6, name: "On desert or swamp", type: "terrain", terrains: ["desert", "swamp"], maxDistance: 0 },
    { id: 7, name: "On desert or mountain", type: "terrain", terrains: ["desert", "mountain"], maxDistance: 0 },
    { id: 8, name: "On water or swamp", type: "terrain", terrains: ["water", "swamp"], maxDistance: 0 },
    { id: 9, name: "On water or mountain", type: "terrain", terrains: ["water", "mountain"], maxDistance: 0 },
    { id: 10, name: "On swamp or mountain", type: "terrain", terrains: ["swamp", "mountain"], maxDistance: 0 },
    { id: 11, name: "Within one space of forest", type: "terrain", terrains: ["forest"], maxDistance: 1 },
    { id: 12, name: "Within one space of desert", type: "terrain", terrains: ["desert"], maxDistance: 1 },
    { id: 13, name: "Within one space of swamp", type: "terrain", terrains: ["swamp"], maxDistance: 1 },
    { id: 14, name: "Within one space of mountain", type: "terrain", terrains: ["mountain"], maxDistance: 1 },
    { id: 15, name: "Within one space of water", type: "terrain", terrains: ["water"], maxDistance: 1 },
    { id: 16, name: "Within one space of either animal territory", type: "territory", territories: ["bear", "cougar"], maxDistance: 1 },
    { id: 17, name: "Within two spaces of a standing stone", type: "structure", structures: ["standing stone"], maxDistance: 2 },
    { id: 18, name: "Within two spaces of an abandoned shack", type: "structure", structures: ["abandoned shack"], maxDistance: 2 },
    { id: 19, name: "Within two spaces of bear territory", type: "territory", territories: ["bear"], maxDistance: 2 },
    { id: 20, name: "Within two spaces of cougar territory", type: "territory", territories: ["cougar"], maxDistance: 2 },
    { id: 21, name: "Within three spaces of a blue structure", type: "structureColor", structureColors: ["blue"], maxDistance: 3 },
    { id: 22, name: "Within three spaces of a white structure", type: "structureColor", structureColors: ["white"], maxDistance: 3 },
    { id: 23, name: "Within three spaces of a green structure", type: "structureColor", structureColors: ["green"], maxDistance: 3 },
    { id: 24, name: "Within three spaces of a black structure", type: "structureColor", structureColors: ["black"], maxDistance: 3 }
];

const playerColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];

const structurePalette = [
    { key: "white-stone", label: "White Standing Stone", structure: "standing stone", color: "white", colorValue: "#ffffff" },
    { key: "blue-stone", label: "Blue Standing Stone", structure: "standing stone", color: "blue", colorValue: "#2196f3" },
    { key: "green-stone", label: "Green Standing Stone", structure: "standing stone", color: "green", colorValue: "#22a447" },
    { key: "black-stone", label: "Black Standing Stone", structure: "standing stone", color: "black", colorValue: "#111111" },
    { key: "white-shack", label: "White Abandoned Shack", structure: "abandoned shack", color: "white", colorValue: "#ffffff" },
    { key: "blue-shack", label: "Blue Abandoned Shack", structure: "abandoned shack", color: "blue", colorValue: "#2196f3" },
    { key: "green-shack", label: "Green Abandoned Shack", structure: "abandoned shack", color: "green", colorValue: "#22a447" },
    { key: "black-shack", label: "Black Abandoned Shack", structure: "abandoned shack", color: "black", colorValue: "#111111" }
];

const { createApp } = Vue;

createApp({
    data() {
        return {
            setupMode: "auto",
            playerCount: 3,
            highlightMode: "positive",
            gameMode: "standard",

            gameStarted: false,
            manualSetupVisible: false,
            playerSectionVisible: false,
            noteModeVisible: false,
            loading: false,
            errorMessage: "",

            gameMap: null,
            players: [],
            playerSelections: [],

            notePlayers: [],
            noteCrossed: {},

            manualBoards: [],
            manualBoardSlots: [],
            manualStructures: [],
            manualDrag: null,
            manualEditorReady: false,
            manualPointerStart: null,
            manualPointerMoved: false,
            manualDragPoint: null,
            structureDragPayload: null,

            playerColors,
            manualStructurePalette: structurePalette
        };
    },

    computed: {
        selectableOptions() {
            const options = BASE_PLAYER_OPTIONS.filter(option =>
                this.gameMode === "advanced" || option.id !== 24
            );
            const result = options.map(option => ({ ...option, inverse: false }));
            if (this.gameMode === "advanced") {
                for (const option of options) {
                    result.push({ ...option, id: 24 + option.id, inverse: true, name: `Not ${option.name}` });
                }
            }
            return result;
        },

        gamePlayerOptions() {
            return [{ id: 0, name: "None", maxDistance: 100, inverse: false }, ...this.selectableOptions];
        },

        noteOptions() {
            return this.selectableOptions;
        },

        visibleManualStructurePalette() {
            const used = new Set(this.manualStructures.map(s => `${s.color}-${s.structure === "standing stone" ? "stone" : "shack"}`));
            return this.manualStructurePalette.filter(item =>
                (this.gameMode === "advanced" || item.color !== "black") && !used.has(item.key)
            );
        }
    },

    methods: {
        createPlayers() {
            this.playerCount = Number(this.playerCount);
            this.players = Array.from({ length: this.playerCount }, (_, i) => ({
                name: `Player ${i + 1}`,
                distanceMap: [],
                color: this.playerColors[i % this.playerColors.length]
            }));
            this.playerSelections = Array(this.playerCount).fill("None");
        },

        createNotePlayers() {
            const old = this.notePlayers;
            this.notePlayers = Array.from({ length: Number(this.playerCount) }, (_, i) => ({
                name: old[i]?.name || `Player ${i + 1}`,
                color: this.playerColors[i % this.playerColors.length]
            }));
        },

        openNoteMode() {
            this.errorMessage = "";
            this.noteModeVisible = true;
            this.gameStarted = false;
            this.manualSetupVisible = false;
            this.playerSectionVisible = false;
            this.createNotePlayers();
        },

        closeNoteMode() {
            this.noteModeVisible = false;
        },

        noteKey(playerIndex, optionName) {
            return `${playerIndex}::${optionName}`;
        },

        isNoteCrossed(playerIndex, optionName) {
            return !!this.noteCrossed[this.noteKey(playerIndex, optionName)];
        },

        toggleNote(playerIndex, optionName) {
            const key = this.noteKey(playerIndex, optionName);
            this.noteCrossed[key] = !this.noteCrossed[key];
        },

        createGame() {
            this.errorMessage = "";
            this.noteModeVisible = false;
            this.createPlayers();
            this.gameStarted = true;
            this.playerSectionVisible = false;

            if (this.setupMode === "manual") {
                this.openManualEditor();
                return;
            }

            this.manualSetupVisible = false;
            this.playerSectionVisible = true;
            this.initBoard();
        },

        async initBoard() {
            this.loading = true;
            this.errorMessage = "";
            try {
                this.gameMap = new GameMap();
                let csvData;

                if (this.setupMode === "auto") {
                    const random = Math.floor(Math.random() * 2) + 1;
                    const response = await fetch(`assets/setups/setup${random}.csv`);
                    if (!response.ok) throw new Error(`Could not load setup${random}.csv`);
                    csvData = await response.text();
                } else {
                    const perm = this.getRandomSignedPermutation();
                    const tags = ["w-s", "b-a", "w-a", "g-a", "g-s", "b-s"];
                    const pairs = this.getUniquePairs(6);
                    const line5to10 = pairs.map(([x, y], i) => `${x},${y},${tags[i]}`).join("\n");
                    csvData = `3,2,6\n${perm[0]},${perm[1]}\n${perm[2]},${perm[3]}\n${perm[4]},${perm[5]}\n${line5to10}`;
                }

                await this.gameMap.loadFromCSV(csvData);
                this.gameMap.addStructures(csvData);

                if (this.gameMode === "advanced") {
                    this.addAdvancedBlackStructures();
                }

                this.gameMap.setPlayerDistances();
                this.drawBoard();
            } catch (error) {
                console.error(error);
                this.errorMessage = "The board could not be loaded. Check that the repository assets are present.";
            } finally {
                this.loading = false;
            }
        },

        addAdvancedBlackStructures() {
            const candidates = [];
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 12; x++) {
                    const tile = this.gameMap.grid[y][x];
                    if (tile && tile.structure === "none") candidates.push([x, y]);
                }
            }
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
            const chosen = candidates.slice(0, 2);
            if (chosen[0]) this.gameMap.grid[chosen[0][1]][chosen[0][0]].addStructure("black", "standing stone");
            if (chosen[1]) this.gameMap.grid[chosen[1][1]][chosen[1][0]].addStructure("black", "abandoned shack");
        },

        async openManualEditor() {
            this.loading = true;
            this.errorMessage = "";
            this.manualSetupVisible = true;
            this.playerSectionVisible = false;
            this.manualStructures = [];
            this.manualBoardSlots = Array.from({ length: 6 }, (_, i) => ({ boardIndex: i, rotated: false }));
            try {
                this.manualBoards = [];
                for (let i = 1; i <= 6; i++) {
                    const response = await fetch(`assets/gameBoards/gameBoard${i}.csv`);
                    if (!response.ok) throw new Error(`Could not load gameBoard${i}.csv`);
                    this.manualBoards.push(new GameBoard(await response.text()));
                }
                this.manualEditorReady = true;
                await this.$nextTick();
                this.drawManualEditor();
            } catch (error) {
                console.error(error);
                this.errorMessage = "The manual editor could not load the six game boards.";
            } finally {
                this.loading = false;
            }
        },

        cancelManualSetup() {
            this.manualSetupVisible = false;
            this.gameStarted = false;
            this.manualEditorReady = false;
            this.playerSectionVisible = false;
        },

        resetManualEditor() {
            this.manualBoardSlots = Array.from({ length: 6 }, (_, i) => ({ boardIndex: i, rotated: false }));
            this.manualStructures = [];
            this.drawManualEditor();
        },

        manualSlotAtPoint(px, py) {
            const centers = [
                { x: 230, y: 155 }, { x: 590, y: 155 },
                { x: 230, y: 363 }, { x: 590, y: 363 },
                { x: 230, y: 571 }, { x: 590, y: 571 }
            ];
            let best = -1;
            let bestDistance = Infinity;
            centers.forEach((center, index) => {
                const distance = Math.hypot(px - center.x, py - center.y);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = index;
                }
            });
            return bestDistance <= 210 ? best : -1;
        },

        canvasPoint(event, canvasId = "manualEditorCanvas") {
            const canvas = document.getElementById(canvasId);
            const rect = canvas.getBoundingClientRect();
            return {
                x: (event.clientX - rect.left) * canvas.width / rect.width,
                y: (event.clientY - rect.top) * canvas.height / rect.height
            };
        },

        editorCellAtPoint(px, py) {
            const hexSize = 40;
            let best = null;
            let bestDistance = Infinity;
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 12; x++) {
                    const center = this.hexCenter(x, y, hexSize);
                    const distance = Math.hypot(px - center.x, py - center.y);
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        best = { x, y };
                    }
                }
            }
            return bestDistance <= hexSize ? best : null;
        },

        hexCenter(x, y, hexSize = 40) {
            return {
                x: hexSize * 1.5 * x + 50,
                y: hexSize * Math.sqrt(3) * (y + 0.5 * (x % 2)) + 50
            };
        },

        structureAtPoint(px, py) {
            const hexSize = 40;
            let found = null;
            let best = Infinity;
            for (const structure of this.manualStructures) {
                const center = this.hexCenter(structure.x, structure.y, hexSize);
                const distance = Math.hypot(px - center.x, py - center.y);
                if (distance < 20 && distance < best) {
                    best = distance;
                    found = structure;
                }
            }
            return found;
        },

        manualPointerDown(event) {
            if (!this.manualEditorReady) return;
            const point = this.canvasPoint(event);
            this.manualPointerStart = point;
            this.manualPointerMoved = false;
            this.manualDragPoint = point;
            const structure = this.structureAtPoint(point.x, point.y);
            if (structure) {
                this.manualDrag = { kind: "structure", id: structure.id };
            } else {
                const slot = this.manualSlotAtPoint(point.x, point.y);
                if (slot >= 0) this.manualDrag = { kind: "board", slot };
            }
            const canvas = event.currentTarget;
            canvas.setPointerCapture(event.pointerId);
        },

        manualPointerMove(event) {
            if (!this.manualDrag || !this.manualPointerStart) return;
            const point = this.canvasPoint(event);
            this.manualDragPoint = point;
            if (Math.hypot(point.x - this.manualPointerStart.x, point.y - this.manualPointerStart.y) > 6) {
                this.manualPointerMoved = true;
            }
            this.drawManualEditor();
        },

        manualPointerUp(event) {
            if (!this.manualDrag || !this.manualPointerStart) return;
            const point = this.canvasPoint(event);
            const drag = this.manualDrag;

            if (drag.kind === "board") {
                const target = this.manualSlotAtPoint(point.x, point.y);
                if (this.manualPointerMoved && target >= 0 && target !== drag.slot) {
                    [this.manualBoardSlots[drag.slot], this.manualBoardSlots[target]] = [this.manualBoardSlots[target], this.manualBoardSlots[drag.slot]];
                } else if (!this.manualPointerMoved) {
                    this.manualBoardSlots[drag.slot].rotated = !this.manualBoardSlots[drag.slot].rotated;
                }
            } else if (drag.kind === "structure") {
                const cell = this.editorCellAtPoint(point.x, point.y);
                if (cell) {
                    const structure = this.manualStructures.find(s => s.id === drag.id);
                    const occupied = this.manualStructures.find(s => s.id !== drag.id && s.x === cell.x && s.y === cell.y);
                    if (structure && !occupied) {
                        structure.x = cell.x;
                        structure.y = cell.y;
                    }
                }
            }

            this.manualDrag = null;
            this.manualPointerStart = null;
            this.manualPointerMoved = false;
            this.manualDragPoint = null;
            this.drawManualEditor();
        },

        manualContextMenu(event) {
            event.preventDefault();
            const point = this.canvasPoint(event);
            const structure = this.structureAtPoint(point.x, point.y);
            if (structure) {
                this.manualStructures = this.manualStructures.filter(s => s.id !== structure.id);
                this.drawManualEditor();
            }
        },

        startStructureDrag(event, item) {
            this.structureDragPayload = item;
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData("text/plain", item.key);
            }
        },

        allowStructureDrop(event) {
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
        },

        dropStructure(event) {
            event.preventDefault();
            const item = this.structureDragPayload || structurePalette.find(s => s.key === event.dataTransfer?.getData("text/plain"));
            if (!item) return;
            const point = this.canvasPoint(event);
            const cell = this.editorCellAtPoint(point.x, point.y);
            if (!cell) return;
            const occupied = this.manualStructures.find(s => s.x === cell.x && s.y === cell.y);
            const alreadyUsed = this.manualStructures.some(s => `${s.color}-${s.structure === "standing stone" ? "stone" : "shack"}` === item.key);
            if (occupied || alreadyUsed) return;
            const id = this.manualStructures.reduce((max, s) => Math.max(max, s.id), 0) + 1;
            this.manualStructures.push({ id, structure: item.structure, color: item.color, x: cell.x, y: cell.y });
            this.structureDragPayload = null;
            this.drawManualEditor();
        },

        drawManualEditor() {
            const canvas = document.getElementById("manualEditorCanvas");
            if (!canvas || !this.manualBoards.length) return;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#202020";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const hexSize = 40;
            for (let slot = 0; slot < 6; slot++) {
                const config = this.manualBoardSlots[slot];
                const board = this.manualBoards[config.boardIndex];
                const baseX = (slot % 2) * 6;
                const baseY = Math.floor(slot / 2) * 3;
                for (let j = 0; j < 3; j++) {
                    for (let i = 0; i < 6; i++) {
                        const sourceX = config.rotated ? 5 - i : i;
                        const sourceY = config.rotated ? 2 - j : j;
                        const tile = board.grid[sourceY][sourceX];
                        const center = this.hexCenter(baseX + i, baseY + j, hexSize);
                        tile.draw(ctx, center.x, center.y, hexSize, "positive");
                    }
                }
                if (this.manualDrag?.kind === "board" && this.manualDrag.slot === slot) {
                    const boardLeft = this.hexCenter(baseX, baseY, hexSize).x - hexSize * 0.95;
                    const boardTop = this.hexCenter(baseX, baseY, hexSize).y - hexSize * 0.9;
                    const boardWidth = hexSize * 1.5 * 5 + hexSize * 2;
                    const boardHeight = hexSize * Math.sqrt(3) * 2.5;
                    ctx.save();
                    ctx.fillStyle = "rgba(160,160,160,.38)";
                    ctx.fillRect(boardLeft, boardTop, boardWidth, boardHeight);
                    ctx.restore();
                }
                const left = 12 + (slot % 2) * 6 * hexSize * 1.5;
                const top = 15 + Math.floor(slot / 2) * 3 * hexSize * Math.sqrt(3);
                ctx.save();
                ctx.fillStyle = "rgba(0,0,0,.75)";
                ctx.fillRect(left, top, 48, 27);
                ctx.fillStyle = "#fff";
                ctx.font = "bold 18px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(String(config.rotated ? -(config.boardIndex + 1) : config.boardIndex + 1), left + 24, top + 13);
                ctx.restore();
            }

            for (const structure of this.manualStructures) {
                const center = this.hexCenter(structure.x, structure.y, hexSize);
                const grabbed = this.manualDrag?.kind === "structure" && this.manualDrag.id === structure.id;
                if (!grabbed) {
                    this.drawStructureIcon(ctx, center.x, center.y, hexSize * 0.9, structure.color, structure.structure);
                } else {
                    this.drawStructureIcon(ctx, center.x, center.y, hexSize * 0.9, structure.color, structure.structure, 0.35);
                }
            }

            if (this.manualDrag?.kind === "structure" && this.manualDragPoint) {
                const structure = this.manualStructures.find(s => s.id === this.manualDrag.id);
                if (structure) {
                    this.drawStructureIcon(ctx, this.manualDragPoint.x + 18, this.manualDragPoint.y - 18, hexSize * 0.9, structure.color, structure.structure, 0.75);
                    ctx.save();
                    ctx.font = "26px sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText("✋", this.manualDragPoint.x + 30, this.manualDragPoint.y - 42);
                    ctx.restore();
                }
            }

            if (this.manualDrag?.kind === "board" && this.manualDragPoint) {
                ctx.save();
                ctx.fillStyle = "rgba(255,255,255,.12)";
                ctx.beginPath();
                ctx.arc(this.manualDragPoint.x, this.manualDragPoint.y, 28, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = "26px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("✋", this.manualDragPoint.x, this.manualDragPoint.y - 36);
                ctx.restore();
            }

            ctx.save();
            ctx.fillStyle = "#fff";
            ctx.font = "13px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("Click board = rotate 180°  •  Drag board = swap  •  Right-click structure = remove", 12, 680);
            ctx.restore();
        },

        drawStructureIcon(ctx, px, py, size, color, structure, alpha = 1) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color === "white" ? "#ffffff" : color === "blue" ? "#2196f3" : color === "green" ? "#22a447" : "#111111";
            ctx.strokeStyle = color === "white" ? "#111" : "#fff";
            ctx.lineWidth = 2;
            if (structure === "standing stone") {
                const radius = size * 0.4;
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 * i) / 8 + Math.PI / 8;
                    const x = px + radius * Math.cos(angle);
                    const y = py + radius * Math.sin(angle);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                const s = size * 0.5;
                ctx.beginPath();
                ctx.moveTo(px, py - s / 1.5);
                ctx.lineTo(px - s / 1.2, py + s / 2);
                ctx.lineTo(px + s / 1.2, py + s / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        },

        async createManualGame() {
            if (!this.manualBoardSlots.length) return;
            this.loading = true;
            this.errorMessage = "";
            try {
                const boardRows = [];
                for (let row = 0; row < 3; row++) {
                    const values = [];
                    for (let col = 0; col < 2; col++) {
                        const slot = row * 2 + col;
                        const config = this.manualBoardSlots[slot];
                        values.push(config.rotated ? -(config.boardIndex + 1) : config.boardIndex + 1);
                    }
                    boardRows.push(values.join(","));
                }

                const structures = this.manualStructures.filter(s => this.isStructureAllowedInCurrentMode(s));
                const lines = [`3,2,${structures.length}`, ...boardRows];
                const codes = { white: "w", blue: "b", green: "g", black: "bl" };
                const structureCodes = { "standing stone": "s", "abandoned shack": "a" };
                for (const s of structures) lines.push(`${s.y},${s.x},${codes[s.color]}-${structureCodes[s.structure]}`);
                const csvData = lines.join("\n");

                this.gameMap = new GameMap();
                await this.gameMap.loadFromCSV(csvData);
                this.gameMap.addStructures(csvData);
                this.gameMap.setPlayerDistances();
                this.manualSetupVisible = false;
                this.gameStarted = true;
                this.playerSectionVisible = true;
                await this.$nextTick();
                this.drawBoard();
            } catch (error) {
                console.error(error);
                this.errorMessage = "The manual board could not be created.";
            } finally {
                this.loading = false;
            }
        },

        isStructureAllowedInCurrentMode(structure) {
            return this.gameMode === "advanced" || structure.color !== "black";
        },

        optionByName(name) {
            if (name === "None") return { id: 0, name: "None", maxDistance: 100, inverse: false };
            return this.selectableOptions.find(option => option.name === name) || null;
        },

        confirmSetup() {
            if (!this.gameMap) return;
            this.clearColors();
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 12; x++) {
                    this.gameMap.grid[y][x].drawSolution = false;
                    this.gameMap.grid[y][x].solutions = 0;
                }
            }
            for (let i = 0; i < this.playerCount; i++) {
                const option = this.optionByName(this.playerSelections[i]);
                if (option) this.applyPlayerHighlight(option, i);
            }
            this.drawBoard();
        },

        applyPlayerHighlight(option, playerIndex) {
            if (!option || !this.gameMap || option.id === 0) return;
            const maxDistance = option.maxDistance;
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 12; x++) {
                    const distance = this.gameMap.distanceToX[option.id > 24 ? option.id - 24 : option.id][y][x];
                    const clueMatches = distance <= maxDistance;
                    const conditionMatches = option.inverse ? !clueMatches : clueMatches;
                    const shouldHighlight = this.highlightMode === "positive" ? conditionMatches : !conditionMatches;
                    if (shouldHighlight) {
                        this.gameMap.grid[y][x].colors.push(this.highlightMode === "positive" ? this.playerColors[playerIndex] : "#000000");
                    }
                }
            }
        },

        findSolutions() {
            if (!this.gameMap) return;
            const options = this.selectableOptions;
            const solutions = [];
            const cellCount = 108;
            const fullMask = (1n << BigInt(cellCount)) - 1n;
            const masks = new Map();

            const bitCount = value => {
                let v = value;
                let count = 0;
                while (v) { v &= v - 1n; count++; }
                return count;
            };

            for (const option of options) {
                const baseId = option.id > 24 ? option.id - 24 : option.id;
                const distances = this.gameMap.distanceToX[baseId];
                let mask = 0n;
                for (let y = 0; y < 9; y++) {
                    for (let x = 0; x < 12; x++) {
                        const distance = distances[y][x];
                        const baseMatch = distance <= option.maxDistance;
                        const condition = option.inverse ? !baseMatch : baseMatch;
                        const shouldBeSolutionCell = this.highlightMode === "positive" ? condition : !condition;
                        if (shouldBeSolutionCell) mask |= 1n << BigInt(y * 12 + x);
                    }
                }
                masks.set(option.id, mask);
            }

            const choose = (start, picked, intersection) => {
                if (picked.length === this.playerCount) {
                    if (bitCount(intersection) === 1) solutions.push([...picked]);
                    return;
                }
                for (let i = start; i < options.length; i++) {
                    const option = options[i];
                    const nextIntersection = intersection & masks.get(option.id);
                    if (nextIntersection === 0n) continue;
                    choose(i + 1, [...picked, option], nextIntersection);
                }
            };

            choose(0, [], fullMask);
            this.renderSolutions(solutions);
        },

        renderSolutions(allSolutions) {
            this.clearColors();
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 12; x++) {
                    this.gameMap.grid[y][x].solutionGrid = 0;
                    this.gameMap.grid[y][x].solutions = 0;
                    this.gameMap.grid[y][x].drawSolution = false;
                }
            }

            for (const solution of allSolutions) {
                for (let i = 0; i < solution.length; i++) this.applyPlayerHighlight(solution[i], i);
                let found = null;
                for (let y = 0; y < 9; y++) {
                    for (let x = 0; x < 12; x++) {
                        const isSolution = this.highlightMode === "positive"
                            ? this.gameMap.grid[y][x].colors.length === this.playerCount
                            : this.gameMap.grid[y][x].colors.length === 0;
                        if (isSolution) found = { x, y };
                    }
                }
                if (found) {
                    this.gameMap.grid[found.y][found.x].solutionGrid += 1;
                    this.gameMap.grid[found.y][found.x].solutions += 1;
                }
                this.clearColors();
            }
            for (let y = 0; y < 9; y++) for (let x = 0; x < 12; x++) this.gameMap.grid[y][x].drawSolution = true;
            this.drawBoard();
            console.log("Solutions:", allSolutions.map(s => s.map(o => o.name)));
        },

        clearColors() {
            if (!this.gameMap) return;
            for (let y = 0; y < 9; y++) for (let x = 0; x < 12; x++) this.gameMap.grid[y][x].colors = [];
        },

        getRandomSignedPermutation() {
            const nums = [1, 2, 3, 4, 5, 6];
            for (let i = nums.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [nums[i], nums[j]] = [nums[j], nums[i]];
            }
            return nums.map(n => Math.random() < 0.5 ? -n : n);
        },

        getUniquePairs(count, xRange = [0, 8], yRange = [0, 11]) {
            const set = new Set(), pairs = [];
            while (pairs.length < count) {
                const x = Math.floor(Math.random() * (xRange[1] - xRange[0] + 1)) + xRange[0];
                const y = Math.floor(Math.random() * (yRange[1] - yRange[0] + 1)) + yRange[0];
                const key = `${x},${y}`;
                if (!set.has(key)) { set.add(key); pairs.push([x, y]); }
            }
            return pairs;
        },

        drawBoard() {
            if (!this.gameMap) return;
            const canvas = document.getElementById("gameCanvas");
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.gameMap.draw(ctx, 40, this.highlightMode);
        },

        resetBoard() {
            window.location.reload();
        }
    },

    mounted() {
        window.addEventListener("resize", () => {
            this.drawBoard();
            this.drawManualEditor();
        });
    }
}).mount("#app");
