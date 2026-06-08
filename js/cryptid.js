document.getElementById('createGameBtn').addEventListener('click', createGame);
document.getElementById('resetGameBtn').addEventListener('click', resetBoard);
document.getElementById('resetManualSetupBtn').addEventListener('click', resetBoard);
document.getElementById('confirmManualSetupBtn').addEventListener('click', createManualGame);
document.getElementById('confirmSetupBtn').addEventListener('click', confirmSetup);
document.getElementById('allSolutions').addEventListener('click', findSolutions)
document.addEventListener("DOMContentLoaded", function () {
const dropdownGrid = document.getElementById("manualDropdownGrid");
const structureInputs = document.getElementById("manualStructureInputs");
const confirmButton = document.getElementById("confirmManualSetupBtn");

// Create dropdowns
for (let i = 0; i < 6; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "field-wrapper";

    const label = document.createElement("label");
    label.textContent = `Value ${i + 1}`;

    const select = document.createElement("select");
    select.className = "manual-value";
    select.id = `manualValue${i}`;

    for (let val = -6; val <= 6; val++) {
    if (val === 0) continue;
    const option = document.createElement("option");
    option.value = val;
    option.textContent = val;
    select.appendChild(option);
    }

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    dropdownGrid.appendChild(wrapper);
}

// Add structure input fields
const structureList = [
    "Standing Stone (White)",
    "Standing Stone (Blue)",
    "Standing Stone (Green)",
    "Standing Stone (Black - Optional)",
    "Abandoned Shack (White)",
    "Abandoned Shack (Blue)",
    "Abandoned Shack (Green)",
    "Abandoned Shack (Black - Optional)"
];

structureList.forEach((structure, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "field-wrapper";

    const label = document.createElement("label");
    label.textContent = structure;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "x,y";
    input.name = `structure${i}`;
    input.className = "structure-input";
    input.id = `structureInput${i}`;
    if (structure.includes("Optional")) {
    input.dataset.optional = "true";
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    structureInputs.appendChild(wrapper);
});

function validateForm() {
  const dropdowns = Array.from(document.querySelectorAll(".manual-value")).map(sel => sel.value);
  const structures = Array.from(document.querySelectorAll(".structure-input"));

  // Rule 1: Absolute uniqueness for dropdowns
  const absDropdowns = dropdowns.map(v => Math.abs(parseInt(v, 10)));
  const hasDuplicateDropdown = new Set(absDropdowns).size !== absDropdowns.length;

  // Rule 2: Structure coordinates must be unique (non-empty only)
  const coords = structures
    .filter(input => input.value.trim() !== "")
    .map(input => input.value.trim());
  const hasDuplicateCoords = new Set(coords).size !== coords.length;

  // Rule 3: Required structures must not be blank
  const hasEmptyRequired = structures.some(input => {
    return input.dataset.optional !== "true" && input.value.trim() === "";
  });

  // ✅ Rule 4: Structure coordinates must be within 0–8, 0–11
  const hasInvalidCoords = structures.some(input => {
    const val = input.value.trim();
    if (val === "") return false; // ignore blank (will be caught by Rule 3)
    const parts = val.split(",");
    if (parts.length !== 2) return true;
    const x = parseInt(parts[0], 10);
    const y = parseInt(parts[1], 10);
    return isNaN(x) || isNaN(y) || x < 0 || x > 8 || y < 0 || y > 11;
  });

  confirmButton.disabled =
    hasDuplicateDropdown ||
    hasDuplicateCoords ||
    hasEmptyRequired ||
    hasInvalidCoords;
}


// Add event listeners to validate on input
document.querySelectorAll(".manual-value, .structure-input").forEach(el => {
    el.addEventListener("input", validateForm);
});

validateForm(); // Initial state
});

let playerCount = 3;
let setupMode = 'auto'; // auto, manual
let highlightMode = 'positive'; // positive, negative
let gameMap = null;
let setupCard = null;
let players = null;
let playerOptions = [
    "None",
    "On forest or desert",
    "On forest or water",
    "On forest or swamp",
    "On forest or mountain",
    "On desert or water",
    "On desert or swamp",
    "On desert or mountain",
    "On water or swamp",
    "On water or mountain",
    "On swamp or mountain",
    "Within one space of forest",
    "Within one space of desert",
    "Within one space of swamp",
    "Within one space of mountain",
    "Within one space of water",
    "Within one space of either animal territory",
    "Within two spaces of a standing stone",
    "Within two spaces of an abandoned shack",
    "Within two spaces of bear territory",
    "Within two spaces of cougar territory",
    "Within three spaces of a blue structure",
    "Within three spaces of a white structure",
    "Within three spaces of a green structure"
];
let playerColors = [
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
]


function createGame() {
    playerCount = parseInt(document.getElementById('playerCount').value,10);
    setupMode = document.getElementById('setupMode').value;
    highlightMode = document.getElementById('highlightMode').value;

    players = Array.from({ length: playerCount }, (_, i) => ({
        name: `Player ${i + 1}`,
        distanceMap: Array(24).fill(0),
        color: playerColors[i % playerColors.length],
        selectedOption: null,
    }));

    document.getElementById('setupSection').style.display = 'none';

    initBoard();
    playerSetup();
}

async function createManualGame() {
    document.getElementById('manualSetup').style.display = 'none';
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('playerSection').classList.remove('hidden');
    gameMap = new GameMap();
    let temp = 6;
    let temp1 = '';
    let temp2 = '';
    if(document.getElementById('structureInput3').value !== ''){
        temp += 1;
        temp1 = document.getElementById('structureInput3').value + ',bl-s';
    }
    if(document.getElementById('structureInput7').value !== ''){
        temp += 1;
        temp2 = document.getElementById('structureInput7').value + ',bl-a';
    }

    let csvData = `3,2,${temp}
${document.getElementById('manualValue0').value},${document.getElementById('manualValue1').value}
${document.getElementById('manualValue2').value},${document.getElementById('manualValue3').value}
${document.getElementById('manualValue4').value},${document.getElementById('manualValue5').value}
${document.getElementById('structureInput0').value},w-s
${document.getElementById('structureInput1').value},b-s
${document.getElementById('structureInput2').value},g-s
${document.getElementById('structureInput4').value},w-a
${document.getElementById('structureInput5').value},b-a
${document.getElementById('structureInput6').value},g-a
${temp1}
${temp2}
    `;
    await gameMap.loadFromCSV(csvData);
    gameMap.addStructures(csvData);
    gameMap.setPlayerDistances();
    drawBoard();

    initBoard();
    playerSetup();
}

async function initBoard(){
    if (setupMode === 'auto') {
        document.getElementById('gameCanvas').classList.remove('hidden');
        document.getElementById('playerSection').classList.remove('hidden');
        gameMap = new GameMap();

        const random = Math.floor(Math.random() * 2) + 1;
        fetch(`../assets/setups/setup${random}.csv`)
        .then(response => response.text())
        .then(async csvData => {
            await gameMap.loadFromCSV(csvData); // wait until map is fully loaded
            gameMap.addStructures(csvData);
            gameMap.setPlayerDistances();
            drawBoard();
        });
    }else if (setupMode === 'manual') {
        document.getElementById('manualSetup').classList.remove('hidden');
    }else if (setupMode === 'random') {
        document.getElementById('gameCanvas').classList.remove('hidden');
        document.getElementById('playerSection').classList.remove('hidden');
        gameMap = new GameMap();

        // Generate data
        const perm = getRandomSignedPermutation();
        const line2 = `${perm[0]},${perm[1]}`;
        const line3 = `${perm[2]},${perm[3]}`;
        const line4 = `${perm[4]},${perm[5]}`;

        const tags = ['w-s', 'b-a', 'w-a', 'g-a', 'g-s', 'b-s'];
        const pairs = getUniquePairs(6);

        const line5to10 = pairs.map(([x, y], i) => `${x},${y},${tags[i]}`).join('\n');

        // Final CSV string
        const csvData = `3,2,6
${line2}
${line3}
${line4}
${line5to10}
        `;

        await gameMap.loadFromCSV(csvData); // wait until map is fully loaded
        gameMap.addStructures(csvData);
        gameMap.setPlayerDistances();
        drawBoard();
    }
}

function getRandomSignedPermutation() {
  const nums = [1, 2, 3, 4, 5, 6];
  // Shuffle
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums.map(n => (Math.random() < 0.5 ? -n : n));
}

function getUniquePairs(count, xRange = [0, 8], yRange = [0, 11]) {
  const set = new Set();
  const pairs = [];
  while (pairs.length < count) {
    const x = Math.floor(Math.random() * (xRange[1] - xRange[0] + 1)) + xRange[0];
    const y = Math.floor(Math.random() * (yRange[1] - yRange[0] + 1)) + yRange[0];
    const key = `${x},${y}`;
    if (!set.has(key)) {
      set.add(key);
      pairs.push([x, y]);
    }
  }
  return pairs;
}

function drawBoard() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    gameMap.draw(ctx, 40, highlightMode);
}

function playerSetup() {
    const container = document.getElementById('playerDropdowns');
    container.innerHTML = ''; // Clear existing content

    for (let i = 1; i <= playerCount; i++) {
        const player = players[i - 1]; // Get current player

        // Create column div
        const playerCol = document.createElement('div');
        playerCol.classList.add('player-column');

        // Player name container
        const playerLabel = document.createElement('div');
        playerLabel.classList.add('player-label');

        // Color square
        const colorSquare = document.createElement('span');
        colorSquare.style.display = 'inline-block';
        colorSquare.style.width = '12px';
        colorSquare.style.height = '12px';
        colorSquare.style.marginRight = '6px';
        colorSquare.style.backgroundColor = player.color;
        colorSquare.style.border = '1px solid #000';
        colorSquare.style.verticalAlign = 'middle';

        // Label text
        const labelText = document.createTextNode(`Player ${i}`);

        // Assemble label
        playerLabel.appendChild(colorSquare);
        playerLabel.appendChild(labelText);

        // Dropdown
        const select = document.createElement('select');
        select.classList.add('player-select');
        select.id = `player${i}-select`;

        playerOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });

        // Append to column
        playerCol.appendChild(playerLabel);
        playerCol.appendChild(select);

        // Append column to main container
        container.appendChild(playerCol);
    }
}

function findSolutions() {
    let allSolutions = [];

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 12; x++) {
            gameMap.grid[y][x].colors = [];
        }
    }

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

    const numbers = Array.from({ length: 24 }, (_, i) => i);
    const combinations = getCombinations(numbers);
    
    for (const combo of combinations) {
        for (let i = 0; i < playerCount; i++) {
            let value = combo[i];
            let height = 9;
            let width = 12;
            if (value >= 1 && value <= 10) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] === 0 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] === 0) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            } else if (value >= 11 && value <= 16) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] <= 1 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] <= 1) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            } else if (value >= 17 && value <= 20) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] <= 2 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] <= 2) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            } else if (value >= 21 && value <= 23) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] <= 3 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] <= 3) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            }
        }

        let solutions = 0;
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 12; x++) {
                if (highlightMode === 'positive') {
                    if (gameMap.grid[y][x].colors.length === playerCount) {
                        solutions++;
                    }
                }else if (highlightMode === 'negative') {
                    if (gameMap.grid[y][x].colors.length === 0) {
                        solutions++;
                    }
                }
            }
        }
        if (solutions === 1) {
            console.log("Found a solution!");
            allSolutions.push(combo.map(num => invertedPlayerSelectionMap[num]));
        }
        for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 12; x++) {
            gameMap.grid[y][x].colors = [];
        }
    }
    }
    getSolutionGrid(allSolutions);
    console.log(allSolutions);
}

function getSolutionGrid(allSolutions){
    const playerSelectionMap = {
        "None": 0,
        "On forest or desert": 1,
        "On forest or water": 2,
        "On forest or swamp": 3,
        "On forest or mountain": 4,
        "On desert or water": 5,
        "On desert or swamp": 6,
        "On desert or mountain": 7,
        "On water or swamp": 8,
        "On water or mountain": 9,
        "On swamp or mountain": 10,
        "Within one space of forest": 11,
        "Within one space of desert": 12,
        "Within one space of swamp": 13,
        "Within one space of mountain": 14,
        "Within one space of water": 15,
        "Within one space of either animal territory": 16,
        "Within two spaces of a standing stone": 17,
        "Within two spaces of an abandoned shack": 18,
        "Within two spaces of bear territory": 19,
        "Within two spaces of cougar territory": 20,
        "Within three spaces of a blue structure": 21,
        "Within three spaces of a white structure": 22,
        "Within three spaces of a green structure": 23
    };

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 12; x++) {
            gameMap.grid[y][x].solutionGrid = 0;
        }
    }

    for (sol of allSolutions) {
        for (let i = 0; i < playerCount; i++) {
            let value = playerSelectionMap[sol[i]];
            let height = 9;
            let width = 12;
            if (value >= 1 && value <= 10) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] === 0 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] === 0) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            } else if (value >= 11 && value <= 16) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] <= 1 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] <= 1) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            } else if (value >= 17 && value <= 20) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] <= 2 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] <= 2) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            } else if (value >= 21 && value <= 23) {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        if (gameMap.distanceToX[value][y][x] <= 3 && highlightMode === 'positive') {
                            gameMap.grid[y][x].colors.push(playerColors[i]);
                        }else if (!(gameMap.distanceToX[value][y][x] <= 3) && highlightMode === 'negative') {
                            gameMap.grid[y][x].colors.push('#000000'); 
                        }
                    }
                }
            }
        }
        let solutions = 0;
        let tempX = -1;
        let tempY = -1;
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 12; x++) {
                if (highlightMode === 'positive') {
                    if (gameMap.grid[y][x].colors.length === playerCount) {
                        solutions++;
                        tempX = x;
                        tempY = y;
                    }
                }else if (highlightMode === 'negative') {
                    if (gameMap.grid[y][x].colors.length === 0) {
                        solutions++;
                        tempX = x;
                        tempY = y;
                    }
                }
            }
        }
        if (solutions === 1) {
            console.log("Found a solution!");
            gameMap.solutionGrid[tempY][tempX] += 1;
            gameMap.grid[tempY][tempX].solutions += 1;
        }
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 12; x++) {
                gameMap.grid[y][x].colors = [];
                gameMap.grid[y][x].drawSolution = true;
            }
        }
        drawBoard();
    }
    console.log("Solution grid:",gameMap.solutionGrid);
}


function getCombinations(arr) {
  const results = [];

  function combine(start, combo) {
    if (combo.length === playerCount) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(1, []);
  console.log(results)
  return results;
}


function confirmSetup() {
    let playerSelections = [];

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 12; x++) {
            gameMap.grid[y][x].colors = [];
            gameMap.grid[y][x].drawSolution = false;
        }
    }

    const playerSelectionMap = {
        "None": 0,
        "On forest or desert": 1,
        "On forest or water": 2,
        "On forest or swamp": 3,
        "On forest or mountain": 4,
        "On desert or water": 5,
        "On desert or swamp": 6,
        "On desert or mountain": 7,
        "On water or swamp": 8,
        "On water or mountain": 9,
        "On swamp or mountain": 10,
        "Within one space of forest": 11,
        "Within one space of desert": 12,
        "Within one space of swamp": 13,
        "Within one space of mountain": 14,
        "Within one space of water": 15,
        "Within one space of either animal territory": 16,
        "Within two spaces of a standing stone": 17,
        "Within two spaces of an abandoned shack": 18,
        "Within two spaces of bear territory": 19,
        "Within two spaces of cougar territory": 20,
        "Within three spaces of a blue structure": 21,
        "Within three spaces of a white structure": 22,
        "Within three spaces of a green structure": 23
    };

    for (let i = 0; i < playerCount; i++) {
        const select = document.getElementById(`player${i + 1}-select`);
        playerSelections.push(select.value);
    }


    for (let i = 0; i < playerCount; i++) {
        let value = playerSelectionMap[playerSelections[i]];
        let height = 9;
        let width = 12;
        if (value >= 1 && value <= 10) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (gameMap.distanceToX[value][y][x] === 0 && highlightMode === 'positive') {
                        gameMap.grid[y][x].colors.push(playerColors[i]);
                    }else if (!(gameMap.distanceToX[value][y][x] === 0) && highlightMode === 'negative') {
                        gameMap.grid[y][x].colors.push('#000000'); 
                    }
                }
            }
        } else if (value >= 11 && value <= 16) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (gameMap.distanceToX[value][y][x] <= 1 && highlightMode === 'positive') {
                        gameMap.grid[y][x].colors.push(playerColors[i]);
                    }else if (!(gameMap.distanceToX[value][y][x] <= 1) && highlightMode === 'negative') {
                        gameMap.grid[y][x].colors.push('#000000'); 
                    }
                }
            }
        } else if (value >= 17 && value <= 20) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (gameMap.distanceToX[value][y][x] <= 2 && highlightMode === 'positive') {
                        gameMap.grid[y][x].colors.push(playerColors[i]);
                    }else if (!(gameMap.distanceToX[value][y][x] <= 2) && highlightMode === 'negative') {
                        gameMap.grid[y][x].colors.push('#000000'); 
                    }
                }
            }
        } else if (value >= 21 && value <= 23) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (gameMap.distanceToX[value][y][x] <= 3 && highlightMode === 'positive') {
                        gameMap.grid[y][x].colors.push(playerColors[i]);
                    }else if (!(gameMap.distanceToX[value][y][x] <= 3) && highlightMode === 'negative') {
                        gameMap.grid[y][x].colors.push('#000000'); 
                    }
                }
            }
        }
    }
    drawBoard()
}

function resetBoard(){
    window.location.reload();
}