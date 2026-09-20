class GameMap {
    constructor() {
        this.grid = this.create2DArray(9, 12, null);
        this.rows = 0;
        this.cols = 0;
        this.distanceToX = Array(25).fill(0);
        this.solutionGrid = this.create2DArray(9, 12, 0);
    }

    create2DArray(rows, cols, defaultValue) {
        const arr = [];
        for (let i = 0; i < rows; i++) {
            arr[i] = [];
            for (let j = 0; j < cols; j++) arr[i][j] = defaultValue;
        }
        return arr;
    }

    async loadFromCSV(csvData) {
        const lines = csvData.trim().split('\n');
        const [rowsStr, colsStr] = lines[0].split(',').map(Number);
        this.rows = rowsStr;
        this.cols = colsStr;
        const fetchPromises = [];

        for (let y = 0; y < this.rows; y++) {
            const rowData = lines[y + 1].split(',');
            for (let x = 0; x < this.cols; x++) {
                const cellNum = Number(rowData[x].trim());
                const isNegative = cellNum < 0;
                const index = Math.abs(cellNum);
                fetchPromises.push(
                    fetch(`assets/gameBoards/gameBoard${index}.csv`)
                        .then(response => response.text())
                        .then(csvGameBoardData => {
                            const gameBoard = new GameBoard(csvGameBoardData);
                            if (isNegative) gameBoard.invertGrid();
                            for (let j = 0; j < 3; j++) {
                                for (let i = 0; i < 6; i++) {
                                    const tile = gameBoard.grid[j][i];
                                    tile.x = i + x * 6;
                                    tile.y = j + y * 3;
                                    this.grid[j + y * 3][i + x * 6] = tile;
                                }
                            }
                        })
                );
            }
        }
        await Promise.all(fetchPromises);
    }

    addStructures(csvData) {
        const lines = csvData.trim().split('\n');
        const [rowsStr, colsStr, structureStr] = lines[0].split(',').map(Number);
        this.rows = rowsStr;
        this.cols = colsStr;
        const colorMap = { w: 'white', b: 'blue', bl: 'black', g: 'green' };
        const structureMap = { s: 'standing stone', a: 'abandoned shack' };
        for (let i = 0; i < structureStr; i++) {
            const rowData = lines[i + 1 + this.rows].split(',');
            const y = Number(rowData[0]);
            const x = Number(rowData[1]);
            const [colorCode, structureCode] = rowData[2].trim().split('-');
            this.grid[y][x].structure = structureMap[structureCode];
            this.grid[y][x].structureColor = colorMap[colorCode];
        }
    }

    draw(ctx, hexSize, highlightMode) {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 12; x++) {
                const tile = this.grid[y][x];
                if (!tile) continue;
                const px = hexSize * 3 / 2 * x + 50;
                const py = hexSize * Math.sqrt(3) * (y + 0.5 * (x % 2)) + 50;
                tile.draw(ctx, px, py, hexSize, highlightMode);
            }
        }
    }

    setPlayerDistances() {
        for (let i = 1; i <= 24; i++) this.distanceToX[i] = this.computeMinDistances(this.grid, 12, 9, i);
    }

    getOddQNeighbors(x, y) {
        const offsets = [
            [[+1, 0], [+1, -1], [0, -1], [-1, -1], [-1, 0], [0, +1]],
            [[+1, +1], [+1, 0], [0, -1], [-1, 0], [-1, +1], [0, +1]]
        ];
        return offsets[x % 2].map(([dx, dy]) => [x + dx, y + dy]);
    }

    computeMinDistances(grid, width, height, value) {
        const distances = Array.from({ length: height }, () => Array(width).fill(Infinity));
        const queue = [];
        const seed = (predicate) => {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (predicate(grid[y][x])) {
                        distances[y][x] = 0;
                        queue.push({ x, y });
                    }
                }
            }
        };

        if (value >= 1 && value <= 10) {
            const terrainPairs = [
                ["forest", "desert"], ["forest", "water"], ["forest", "swamp"], ["forest", "mountain"],
                ["desert", "water"], ["desert", "swamp"], ["desert", "mountain"], ["water", "swamp"],
                ["water", "mountain"], ["swamp", "mountain"]
            ];
            seed(tile => terrainPairs[value - 1].includes(tile.terrain));
        } else if (value >= 11 && value <= 15) {
            const terrains = ["forest", "desert", "swamp", "mountain", "water"];
            seed(tile => tile.terrain === terrains[value - 11]);
        } else if (value === 16) {
            seed(tile => tile.territory === 'bear' || tile.territory === 'cougar');
        } else if (value === 17 || value === 18) {
            const structure = value === 17 ? 'standing stone' : 'abandoned shack';
            seed(tile => tile.structure === structure);
        } else if (value === 19 || value === 20) {
            const territory = value === 19 ? 'bear' : 'cougar';
            seed(tile => tile.territory === territory);
        } else if (value >= 21 && value <= 24) {
            const colors = ["blue", "white", "green", "black"];
            seed(tile => tile.structureColor === colors[value - 21]);
        }

        while (queue.length) {
            const { x, y } = queue.shift();
            const current = distances[y][x];
            for (const [nx, ny] of this.getOddQNeighbors(x, y)) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height && distances[ny][nx] > current + 1) {
                    distances[ny][nx] = current + 1;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
        return distances;
    }
}
