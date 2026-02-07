import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const TILE_SIZE = 160;
const MAP_HEIGHT = 40; // Total height of the grid (vertical space)
const EXTENSION_DEPTH = 50; // Deep earth below
const OUTPUT_PATH = path.join(__dirname, '../public/assets/level1.json');
const LEVEL_THEME = 'ruins';

// --- CHUNK DEFINITIONS ---
// Each chunk function returns an array of strings (rows) representing a slice of the map.
// Height should match MAP_HEIGHT roughly, or be adaptable.
// We will build the map horizontally.

function createEmptyChunk(width) {
    const chunk = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        chunk.push(".".repeat(width));
    }
    return chunk;
}

// Draw a ground line at 'groundY' height (from top)
// width: length of chunk
// groundY: Y index where the surface starts
function createCorridorChunk(width, groundY) {
    const chunk = createEmptyChunk(width);
    for (let x = 0; x < width; x++) {
        // Surface
        chunk[groundY] = chunk[groundY].substring(0, x) + 'x' + chunk[groundY].substring(x + 1);
        // Fill below surface
        for (let y = groundY + 1; y < MAP_HEIGHT; y++) {
            chunk[y] = chunk[y].substring(0, x) + 'x' + chunk[y].substring(x + 1);
        }
    }
    return chunk;
}

// Start Area: Safe, walls on left
function createStartChunk() {
    const width = 40;
    const groundY = 25;
    const chunk = createCorridorChunk(width, groundY);

    setChar(chunk, 10, groundY - 2, 'P');
    setChar(chunk, 5, groundY - 2, 'T'); // Torch near start

    for (let y = 0; y < MAP_HEIGHT; y++) {
        setChar(chunk, 0, y, 'x');
        setChar(chunk, 1, y, 'x');
    }
    return chunk;
}

// Arena: Flat area with enemies
function createArenaChunk() {
    const width = 50;
    const groundY = 25;
    const chunk = createCorridorChunk(width, groundY);

    setChar(chunk, 15, groundY - 2, 'E');
    setChar(chunk, 35, groundY - 2, 'E');
    setChar(chunk, 25, groundY - 3, 'T'); // Central Torch

    return chunk;
}

// Pillars: Jumping between columns
function createPillarsChunk() {
    const width = 60;
    const groundY = 25;
    const chunk = createEmptyChunk(width);

    drawRect(chunk, 5, groundY, 5, MAP_HEIGHT - groundY);
    drawRect(chunk, 20, groundY - 3, 5, MAP_HEIGHT - (groundY - 3));
    drawRect(chunk, 35, groundY, 5, MAP_HEIGHT - groundY);
    drawRect(chunk, 50, groundY, 10, MAP_HEIGHT - groundY);

    setChar(chunk, 22, groundY - 5, 'E');
    setChar(chunk, 37, groundY - 2, 'T'); // Torch on pillar 3

    return chunk;
}

// Bridge: Long thin platform over void
function createBridgeChunk() {
    const width = 60;
    const groundY = 25;
    const chunk = createEmptyChunk(width);

    // Start Ledge
    drawRect(chunk, 0, groundY, 5, MAP_HEIGHT - groundY);

    // Bridge (Thin, no support below)
    drawRect(chunk, 5, groundY, 50, 2); // 2 blocks thick

    // End Ledge
    drawRect(chunk, 55, groundY, 5, MAP_HEIGHT - groundY);

    // Enemy on bridge
    setChar(chunk, 30, groundY - 2, 'E');

    return chunk;
}

// Stairs: Going up
function createStairsUpChunk() {
    const width = 30;
    const startY = 25;
    const chunk = createEmptyChunk(width);

    for (let i = 0; i < 5; i++) {
        const stepWidth = 6;
        const x = i * stepWidth;
        const y = startY - (i * 2); // Go up 2 blocks every step
        // Fill from y down to bottom
        drawRect(chunk, x, y, stepWidth, MAP_HEIGHT - y);
    }

    return chunk;
}

// Stairs: Going down
function createStairsDownChunk() {
    const width = 30;
    const startY = 17; // Assuming we ended up from StairsUp (25 - 5*2 = 15) roughly
    const chunk = createEmptyChunk(width);

    for (let i = 0; i < 5; i++) {
        const stepWidth = 6;
        const x = i * stepWidth;
        const y = startY + (i * 2);
        drawRect(chunk, x, y, stepWidth, MAP_HEIGHT - y);
    }

    return chunk;
}


// --- HELPER FUNCTIONS ---
function setChar(chunk, x, y, char) {
    if (y >= 0 && y < chunk.length && x >= 0 && x < chunk[0].length) {
        chunk[y] = chunk[y].substring(0, x) + char + chunk[y].substring(x + 1);
    }
}

function drawRect(chunk, x, y, w, h) {
    for (let iy = y; iy < y + h; iy++) {
        for (let ix = x; ix < x + w; ix++) {
            setChar(chunk, ix, iy, 'x');
        }
    }
}

function mergeChunks(chunks) {
    const merged = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        let row = "";
        for (const chunk of chunks) {
            row += chunk[y];
        }
        merged.push(row);
    }
    return merged;
}

// --- MAIN GENERATION ---

function generateLevel() {
    console.log("Generating Epic Hollow Knight Style Level...");

    // 1. ASSEMBLE MAP SEQUENCE
    const chunks = [];
    chunks.push(createStartChunk()); // Start
    chunks.push(createCorridorChunk(20, 25)); // Buffer
    chunks.push(createPillarsChunk()); // Jumps
    chunks.push(createArenaChunk()); // Combat 1
    chunks.push(createStairsUpChunk()); // Ascent
    chunks.push(createBridgeChunk()); // The Bridge (High)
    chunks.push(createStairsDownChunk()); // Descent
    chunks.push(createArenaChunk()); // Combat 2
    chunks.push(createPillarsChunk()); // Jumps 2
    chunks.push(createCorridorChunk(50, 25)); // Long End Run

    const ASCII_MAP = mergeChunks(chunks);

    // 2. PROCESS MAP (Same logic as before, extended)
    const EXTENSION_DEPTH = 50;
    const originalHeight = ASCII_MAP.length;
    const height = originalHeight + EXTENSION_DEPTH;
    const width = ASCII_MAP[0].length;
    const data = [];
    const objects = [];
    let objectId = 1;

    console.log(`Map Size: ${width}x${height}`);

    for (let y = 0; y < height; y++) {
        let row = "";
        let isDeepEarth = y >= originalHeight;

        if (!isDeepEarth) {
            row = ASCII_MAP[y];
            // Ensure padding if somehow misaligned strings (shouldn't happen with our logic)
            if (row.length < width) row = row.padEnd(width, '.');
        } else {
            // Deep Earth Extension
            const lastOriginalRow = ASCII_MAP[originalHeight - 1];
            let virtualRow = "";
            for (let x = 0; x < width; x++) {
                const charAbove = lastOriginalRow[x];
                virtualRow += (charAbove === 'x') ? 'x' : '.';
            }
            row = virtualRow;
        }

        // Trackers (Reset per row)
        let lastFloorPropX = -10;
        let lastCeilPropX = -10;
        let lastRoofPropX = -10;

        for (let x = 0; x < width; x++) {
            const char = row[x];
            let tileId = 0;

            // Track if any prop spawned at this X to prevent vertical clutter
            let hasVerticalProp = false;

            // --- ROOF PROPS (Hanging from visible sky, e.g. Y=14) ---
            // Y=0 is too high (off-screen). Player is at Y=25. Screen height ~19 tiles.
            // Visible top is approx Y=15.
            if (y === 14 && char === '.') {
                // Increased spacing to 8
                if (Math.random() < 0.2 && (x - lastRoofPropX > 8)) {
                    lastRoofPropX = x;
                    hasVerticalProp = true;
                    const pIdx = Math.floor(Math.random() * 6);
                    objects.push({
                        id: objectId++, name: `prop_ceil_${pIdx}`, type: "Prop",
                        x: x * TILE_SIZE + (TILE_SIZE / 2),
                        y: 0, // Manager will handle Y with ScrollFactor(0)
                        width: 0, height: 0,
                        rotation: 0, visible: true,
                        properties: [{ name: "kind", type: "string", value: "roof" }]
                    });
                }
            }

            if (char === 'x') {
                // NEIGHBOR CHECK
                let up = false;
                if (y > 0) {
                    if (!isDeepEarth) up = (ASCII_MAP[y - 1][x] === 'x');
                    else up = true;
                }

                // Check below for ceiling props
                let down = false;
                // Since we are building row by row, we might need to look ahead or trust the logic.
                // However, ASCII_MAP only covers the original height. Deep earth is virtual.
                // For Deep Earth, everything below is solid (x), so no ceiling props there.
                // For original map:
                if (!isDeepEarth && y < originalHeight - 1) {
                    down = (ASCII_MAP[y + 1][x] === 'x');
                } else if (!isDeepEarth && y === originalHeight - 1) {
                    // Border of deep earth is solid below
                    down = true;
                } else {
                    // Deep Earth is solid all the way down
                    down = true;
                }


                // Horizontal Neighbors need access to the current row string being built? 
                // Wait, 'row' is fully constructed above!
                const left = (x > 0) ? (row[x - 1] === 'x') : false;
                const right = (x < width - 1) ? (row[x + 1] === 'x') : false;

                if (!up) {
                    // SURFACE (Green)
                    if (!left && right) tileId = 1;
                    else if (left && !right) tileId = 4;
                    else tileId = 2;

                    // --- PROP GENERATION (FLOOR) ---
                    // 20% Chance + Spacing (8) + No Vertical Overlap
                    if (!hasVerticalProp && tileId === 2 && Math.random() < 0.2 && (x - lastFloorPropX > 8)) {
                        lastFloorPropX = x;
                        hasVerticalProp = true;

                        const isBg = Math.random() < 0.5;
                        const pIdx = Math.floor(Math.random() * 8);
                        const frame = isBg ? `prop_bg_${pIdx}` : `prop_ground_${pIdx}`;

                        objects.push({
                            id: objectId++, name: frame, type: "Prop",
                            x: x * TILE_SIZE + (TILE_SIZE / 2), y: y * TILE_SIZE,
                            width: 0, height: 0, rotation: 0, visible: true,
                            properties: [{ name: "kind", type: "string", value: "floor" }]
                        });
                    }

                } else {
                    // DEEP (Dirt/Stone)
                    if (!left && right) tileId = 5;
                    else if (left && !right) tileId = 8;
                    else tileId = 6;

                    // --- PROP GENERATION (CEILING) ---
                    // If solid and BELOW is empty (meaning this is a ceiling)
                    if (!down && !hasVerticalProp) {
                        // 20% Chance + Spacing (8)
                        if (Math.random() < 0.2 && (x - lastCeilPropX > 8)) {
                            lastCeilPropX = x;
                            hasVerticalProp = true;

                            const pIdx = Math.floor(Math.random() * 6);
                            objects.push({
                                id: objectId++, name: `prop_ceil_${pIdx}`, type: "Prop",
                                x: x * TILE_SIZE + (TILE_SIZE / 2),
                                y: (y + 1) * TILE_SIZE, // Bottom of the tile
                                width: 0, height: 0,
                                rotation: 0, visible: true,
                                properties: [{ name: "kind", type: "string", value: "ceil" }]
                            });
                        }
                    }

                    if (y > originalHeight + 2) {
                        if (!left && right) tileId = 9;
                        else if (left && !right) tileId = 12;
                        else tileId = 10;
                    }
                }
            }

            data.push(tileId);

            if (!isDeepEarth) {
                if (char === 'P') {
                    objects.push({
                        id: objectId++, name: "PlayerSpawn", type: "PlayerSpawn",
                        x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, visible: true
                    });
                } else if (char === 'E') {
                    objects.push({
                        id: objectId++, name: "Enemy", type: "Enemy",
                        x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, visible: true
                    });
                } else if (char === 'T') {
                    objects.push({
                        id: objectId++, name: "Torch", type: "Torch",
                        x: x * TILE_SIZE, y: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, visible: true
                    });
                }
            }
        }
    }

    const levelJson = {
        compressionlevel: -1,
        height: height,
        width: width,
        infinite: false,
        layers: [
            {
                data: data,
                height: height,
                width: width,
                id: 1,
                name: "Platforms",
                opacity: 1,
                type: "tilelayer",
                visible: true,
                x: 0, y: 0,
                properties: [{ name: "collides", type: "bool", value: true }]
            },
            {
                draworder: "topdown",
                id: 2,
                name: "Objects",
                objects: objects,
                opacity: 1,
                type: "objectgroup",
                visible: true,
                x: 0, y: 0
            }
        ],
        nextlayerid: 3,
        nextobjectid: objectId,
        orientation: "orthogonal",
        renderorder: "right-down",
        tiledversion: "1.10.1",
        tileheight: TILE_SIZE,
        tilewidth: TILE_SIZE,
        tilesets: [
            {
                columns: 4,
                firstgid: 1,
                image: "tileset_main.png",
                imagewidth: 640, imageheight: 640,
                margin: 0, name: "tileset_main", spacing: 0,
                tilecount: 16,
                tileheight: TILE_SIZE,
                tilewidth: TILE_SIZE
            }
        ],
        type: "map",
        version: "1.10",
        backgroundcolor: "#1a1a2e",
        properties: [
            { name: "theme", type: "string", value: LEVEL_THEME }
        ]
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(levelJson, null, 2));
    console.log(`Success! Long Level Generated at: ${OUTPUT_PATH}`);
}

generateLevel();
