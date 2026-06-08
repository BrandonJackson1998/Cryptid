class GameBoard {
    constructor(csvData = null) {
        this.grid = [];
        this.rows = 0;
        this.cols = 0;

        if (csvData) {
            this.loadFromCSV(csvData);
        }
    }

    loadFromCSV(csvData) {
        const lines = csvData.trim().split('\n');
        const [rowsStr, colsStr] = lines[0].split(',').map(Number);
        this.rows = rowsStr;
        this.cols = colsStr;

        this.grid = [];

        const terrainMap = {
        d: 'desert',
        w: 'water',
        m: 'mountain',
        s: 'swamp',
        f: 'forest'
        };

        const territoryMap = {
        b: 'bear',
        c: 'cougar'
        };

        for (let y = 0; y < this.rows; y++) {
        const rowData = lines[y + 1].split(',');
        const row = [];

        for (let x = 0; x < this.cols; x++) {
            const cell = rowData[x].trim();
            let [terrainCode, territoryCode] = cell.split('-');
            const terrain = terrainMap[terrainCode];
            const tile = new Tile(x, y, terrain);

            if (territoryCode && territoryMap[territoryCode]) {
            tile.addTerritory(territoryMap[territoryCode]);
            }

            row.push(tile);
        }

        this.grid.push(row);
        }
    }

    draw(ctx, hexSize, highlightMode) {
        for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
            const tile = this.grid[y][x];

            // Flat-topped hex coordinates (odd-q offset)
            const px = hexSize * 3/2 * x + 50;
            const py = hexSize * Math.sqrt(3) * (y + 0.5 * (x % 2)) + 50;

            tile.draw(ctx, px, py, hexSize, highlightMode);
        }
        }
    }

    invertGrid() {
        const newGrid = [];

        for (let y = this.rows - 1; y >= 0; y--) {
            const newRow = [];
            for (let x = this.cols - 1; x >= 0; x--) {
            const tile = this.grid[y][x];
            const newX = this.cols - 1 - x;
            const newY = this.rows - 1 - y;
            tile.x = newX;
            tile.y = newY;
            newRow.push(tile);
            }
            newGrid.push(newRow);
        }

        this.grid = newGrid;
    }
}
