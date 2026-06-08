class Tile {
    constructor(x, y, terrain) {
        this.x = x;
        this.y = y;
        this.terrain = terrain;
        this.territory = 'none';
        this.structure = 'none';
        this.structureColor = 'none';
        this.colors = []; // array of ints 0-5
        this.solutions = 0;
        this.drawSolution = false;

        // Image map: feel free to swap filenames
        this.imageMap = {
        water: '../assets/tiles/waterTile.png',
        mountain: '../assets/tiles/mountainTile.png',
        forest: '../assets/tiles/forestTile.png',
        swamp: '../assets/tiles/swampTile.png',
        desert: '../assets/tiles/desertTile.png',
        bear: '../assets/tiles/bearTerritory.png',
        cougar: '../assets/tiles/cougarTerritory.png'
        };

        this.image = new Image();
        this.image.src = this.imageMap[this.terrain];
    }

    addStructure(color, structure) {
        this.structure = structure;
        this.structureColor = color;
    }

    addTerritory(territory) {
        this.territory = territory;
    }

    addColors(colorIndices) {
        this.colors = colorIndices.slice(0, 5); // Max 5 colors
    }

    clipHex(ctx, px, py, hexSize) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i);
            const x = px + hexSize * Math.cos(angle);
            const y = py + hexSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.clip();
    }


    draw(ctx, px, py, hexSize, highlightMode) {
        const drawImgClippedHex = (src, alpha = 0.2) => {
            const img = new Image();
            img.src = src;

            const draw = () => {
                ctx.save();
                this.clipHex(ctx, px, py, hexSize);
                ctx.globalAlpha = alpha;
                ctx.drawImage(img, px - hexSize, py - hexSize, hexSize * 2, hexSize * 2);
                ctx.globalAlpha = 1.0;
                ctx.restore();
            };

            if (img.complete) {
                draw();
            } else {
                img.onload = draw;
            }
        };

        // Draw terrain (base layer)
        const drawTerrain = () => {
            if (this.image.complete) {
                ctx.save();
                this.clipHex(ctx, px, py, hexSize);
                ctx.globalAlpha = 1.0;
                ctx.drawImage(this.image, px - hexSize, py - hexSize, hexSize * 2, hexSize * 2);
                ctx.globalAlpha = 1.0;
                ctx.restore();

                // After terrain is drawn, draw territory
                if (this.territory !== 'none' && this.imageMap[this.territory]) {
                    drawImgClippedHex(this.imageMap[this.territory], 1.0); // slightly more opaque
                }

                // Optionally draw structure
                if (this.structure !== 'none') {
                    ctx.save();
                    this.clipHex(ctx, px, py, hexSize);
                    ctx.fillStyle = this.structureColor;

                    if (this.structure === 'standing stone') {
                        // Draw flat-topped octagon
                        const radius = hexSize * 0.4;
                        const sides = 8;
                        const rotation = Math.PI / 8; // 22.5 degrees to make top flat

                        ctx.beginPath();
                        for (let i = 0; i < sides; i++) {
                            const angle = (2 * Math.PI * i) / sides + rotation;
                            const x = px + radius * Math.cos(angle);
                            const y = py + radius * Math.sin(angle);
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.fill();
                    } else if (this.structure === 'abandoned shack') {
                        // Draw triangle
                        const size = hexSize * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(px, py - size / 1.5);
                        ctx.lineTo(px - size / 1.2, py + size / 2);
                        ctx.lineTo(px + size / 1.2, py + size / 2);
                        ctx.closePath();
                        ctx.fill();
                    }

                    ctx.restore();
                }
            } else {
                this.image.onload = () => drawTerrain();
            }
        };

        drawTerrain();

        // Color pie overlays (evenly split among present colors)
        if (this.colors.length > 0) {
            const sliceAngle = (2 * Math.PI) / this.colors.length;

            ctx.save();
            this.clipHex(ctx, px, py, hexSize); // Clip drawing to hex

            this.colors.forEach((colorIdx, i) => {
                const angleStart = i * sliceAngle - Math.PI / 2; // start at top (12 o'clock)
                const angleEnd = angleStart + sliceAngle;

                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.arc(px, py, hexSize, angleStart, angleEnd);
                ctx.closePath();
                if (highlightMode ===  'negative') {
                    ctx.fillStyle = this.hexToRGBA(colorIdx, 0.60);
                }else if (highlightMode === 'positive') {
                    ctx.fillStyle = this.hexToRGBA(colorIdx, 0.35);
                }
                ctx.fill();
            });

            ctx.restore();
        }

        // Draw solution number, if enabled
        if (this.drawSolution && this.solutions !== undefined && this.solutions !== null) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font = `${hexSize * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(this.solutions.toString(), px, py); // black outline
            ctx.fillText(this.solutions.toString(), px, py);   // white text
            ctx.restore();
        }


        // Flat-topped hex outline
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 180 * (60 * i);
            const x = px + hexSize * Math.cos(angle);
            const y = py + hexSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = '#fff8';
        ctx.stroke();
    }

    hexToRGBA(hex, alpha) {
        if (hex.startsWith('#')) hex = hex.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}