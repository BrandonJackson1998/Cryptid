class GameMap {
    constructor() {
        this.grid = this.create2DArray(9, 12, null);
        this.rows = 0;
        this.cols = 0;
        this.distanceToX = Array(24).fill(0);
        this.solutionGrid = this.create2DArray(9, 12, 0);
    }

    create2DArray(rows, cols, defaultValue) {
        const arr = [];
        for (let i = 0; i < rows; i++) {
            arr[i] = [];
            for (let j = 0; j < cols; j++) {
                arr[i][j] = defaultValue;
            }
        }
        return arr;
    }

    async loadFromCSV(csvData) {
        const lines = csvData.trim().split('\n');
        const [rowsStr, colsStr, structureStr] = lines[0].split(',').map(Number);
        this.rows = rowsStr;
        this.cols = colsStr;

        const colorMap = {
        w: 'white',
        b: 'blue',
        bl: 'black',
        g: 'green',
        };

        const structureMap = {
        s: 'standing stone',
        a: 'abandoned shack'
        };

        const fetchPromises = [];

        for (let y = 0; y < this.rows; y++) {
            const rowData = lines[y + 1].split(',');
            for (let x = 0; x < this.cols; x++) {
                const cell = rowData[x].trim();
                const cellNum = Number(cell);
                const isNegative = cellNum < 0;
                const index = Math.abs(cellNum);

                const fetchPromise = fetch(`../assets/gameBoards/gameBoard${index}.csv`)
                    .then(response => response.text())
                    .then(csvGameBoardData => {
                        const gameBoard = new GameBoard(csvGameBoardData);
                        if (isNegative) {
                            gameBoard.invertGrid();
                        }

                        for (let j = 0; j < 3; j++) {
                            for (let i = 0; i < 6; i++) {
                                const tile = gameBoard.grid[j][i];
                                const newX = i + x * 6;
                                const newY = j + y * 3;
                                tile.x = newX;
                                tile.y = newY;

                                this.grid[j + y * 3][i + x * 6] = gameBoard.grid[j][i];
                            }
                        }
                    });

                fetchPromises.push(fetchPromise);
            }
        }

        await Promise.all(fetchPromises);
    }

    addStructures(csvData){
        const lines = csvData.trim().split('\n');
        const [rowsStr, colsStr, structureStr] = lines[0].split(',').map(Number);
        this.rows = rowsStr;
        this.cols = colsStr;

        const colorMap = {
        w: 'white',
        b: 'blue',
        bl: 'black',
        g: 'green',
        };

        const structureMap = {
        s: 'standing stone',
        a: 'abandoned shack'
        };

        for (let i = 0; i < structureStr; i++) {
            const rowData = lines[i + 1 + this.rows].split(',');
            const cell = rowData[2].trim();
            let [colorCode, structureCode] = cell.split('-');
            const color = colorMap[colorCode];
            const structure = structureMap[structureCode];

            this.grid[rowData[0]][rowData[1]].structure = structure;
            this.grid[rowData[0]][rowData[1]].structureColor = color;
        }
    }

    draw(ctx, hexSize, highlightMode) {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 12; x++) {
                const tile = this.grid[y][x];

                if (!tile) continue; // skip undefined tiles

                const px = hexSize * 3/2 * x + 50;
                const py = hexSize * Math.sqrt(3) * (y + 0.5 * (x % 2)) + 50;

                tile.draw(ctx, px, py, hexSize, highlightMode);
            }
        }
    }

    setPlayerDistances() {
        for (let i = 0; i < this.distanceToX.length; i++) {
            this.distanceToX[i] = this.computeMinDistances(this.grid, 12, 9, i);
        }
    }

    getOddQNeighbors(x, y) {
    const evenQOffsets = [
        [[+1,  0], [+1, -1], [0, -1], [-1, -1], [-1,  0], [0, +1]], // even columns
        [[+1, +1], [+1,  0], [0, -1], [-1,  0], [-1, +1], [0, +1]]  // odd columns
    ];
    const parity = x % 2;
    return evenQOffsets[parity].map(([dx, dy]) => [x + dx, y + dy]);
    }


    // BFS for distances
    computeMinDistances(grid, width, height, value) {
        const invertedPlayerSelectionMap = {
            0: "None",
            1: "On forest or desert",
            2: "On forest or water",
            3: "On forest or swamp",
            4: "On forest or mountain",
            5: "On desert or water",
            6: "On desert or swamp",
            7: "On desert or mountain",
            8: "On water or swamp",
            9: "On water or mountain",
            10: "On swamp or mountain",
            11: "Within one space of forest",
            12: "Within one space of desert",
            13: "Within one space of swamp",
            14: "Within one space of mountain",
            15: "Within one space of water",
            16: "Within one space of either animal territory",
            17: "Within two spaces of a standing stone",
            18: "Within two spaces of an abandoned shack",
            19: "Within two spaces of bear territory",
            20: "Within two spaces of cougar territory",
            21: "Within three spaces of a blue structure",
            22: "Within three spaces of a white structure",
            23: "Within three spaces of a green structure"
        };

        const distances = Array.from({ length: height }, () =>
            Array(width).fill(Infinity)
        );
        const queue = [];

        if (value === 0) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    distances[y][x] = 100;
                    queue.push({ x, y });
                }   
            }
        } else if (value >= 1 && value <= 10) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (invertedPlayerSelectionMap[value].includes(grid[y][x]['terrain'])) {
                        distances[y][x] = 0;
                        queue.push({ x, y });
                    }
                }
            }
        } else if (value >= 11 && value <= 15) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (invertedPlayerSelectionMap[value].includes(grid[y][x]['terrain'])) {
                        distances[y][x] = 0;
                        queue.push({ x, y });
                    }
                }
            }
        } else if (value === 16) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (grid[y][x]['territory'] === 'bear' || grid[y][x]['territory'] === 'cougar') {
                        distances[y][x] = 0;
                        queue.push({ x, y });
                    }
                }
            }
        } else if (value >= 17 && value <= 18) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (invertedPlayerSelectionMap[value].includes(grid[y][x]['structure'])) {
                        distances[y][x] = 0;
                        queue.push({ x, y });
                    }
                }
            }
        } else if (value >= 19 && value <= 20) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (invertedPlayerSelectionMap[value].includes(grid[y][x]['territory'])) {
                        distances[y][x] = 0;
                        queue.push({ x, y });
                    }
                }
            }
        } else if (value >= 21 && value <= 23) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (invertedPlayerSelectionMap[value].includes(grid[y][x]['structureColor'])) {
                        distances[y][x] = 0;
                        queue.push({ x, y });
                    }
                }
            }
        }

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const currDist = distances[y][x];
            for (const [nx, ny] of this.getOddQNeighbors(x, y)) {
            if (
                nx >= 0 && nx < width &&
                ny >= 0 && ny < height &&
                distances[ny][nx] > currDist + 1
            ) {
                distances[ny][nx] = currDist + 1;
                queue.push({ x: nx, y: ny });
            }
            }
        }

        return distances;
    }
}
