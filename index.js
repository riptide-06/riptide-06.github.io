const grammar = {
    _expand: function(rule) {
        if (Array.isArray(rule)) {
            return rule[Math.floor(Math.random() * rule.length)];
        }
        return rule;
    },
    generate: function() {
        const prefix = this._expand(this.prefix);
        const suffix = this._expand(this.suffix);
        const adjective = this._expand(this.adjective);
        const place = this._expand(this.place);
        const name = this._expand(this.name);

        const formats = [
            `${prefix}${suffix}`,
            `${prefix}${name}`,
            `${adjective} ${place}`,
            `${name}${suffix}`
        ];

        return this._expand(formats);
    },
    prefix: [
        "Man", "Tan", "Golden", "Black", "Iron", "Redbay", "New", "Old",
        "monkeys", "West", "North", "South", "Port", "East", "Fort", "Mount",
        "Ducker", "Tucker", "Goosey", "Autumn", "Manatee", "Diamond",
        "Topaz", "Lanez", "Claw", "Raven", "Pearl", "Tory"
    ],
    suffix: [
        "City", "Valley", "Crown", "Hill", "Lewis", "Fjord", "Land", "thorne",
        "Copter", "Marsh", "Woody", "Thunder", "Gill"
    ],
    adjective: [
        "Happy", "Loud", "Memorable", "Dull", "Glory", "Chilly",
        "Meepy", "Moop", "Galary", "Kalos", "Pallet", "Kanto", "Omnivore", "Joyous",
        "Youth", "Chill", "Dark", "low", "ashen", "Shining", "Yeemcy",
        "Kimchi", "Galar", "Pika", "Leafy", "Poki", "Mane", "Tomas",
        "Init", "Python", "Dry", "Lord", "Lady", "Lamp", "Stormy", "Beast",
        "Monarch", "Shadow", "Dragon", "Destruction", "Eepy"
    ],
    place: ["Ridge", "Valley", "Atoll", "Shore", "Peak"],
    name: [
        "Hill", "Crown", "Edge", "Bridges", "Natural", "Monica", "Cruz", "Clara"
    ]
};

class myScene extends Phaser.Scene {
    constructor() {
        super("myScene");
    }

    preload() {
        this.load.image('tileset', '/assets/Spritesheet/mapPack_spritesheet.png');
    }

    init(data) {
        this.seed = data.seed;
        this.noiseScale = data.noiseScale;
        this.tilesetData = {
            name: "terrain",
            key: "tileset"
        };
    }

    create() {
        if (!this.seed) this.seed = Math.random();
        if (!this.noiseScale) this.noiseScale = 10;

        const mapWidth = 20;
        const mapHeight = 15;
        const tileSize = 64;

        // Create separate layers for each terrain type
        const layers = {
            base: [],    // Water/Base layer
            terrain: [], // Main terrain
            hills: [],   // Elevated terrain
            peaks: []    // Highest points
        };

        // Initialize arrays
        for (const layer in layers) {
            for (let y = 0; y < mapHeight; y++) {
                layers[layer][y] = new Array(mapWidth).fill(0);
            }
        }

        // Generate noise maps for different elevations
        noise.seed(this.seed);
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const baseNoise = noise.perlin2(x / this.noiseScale, y / this.noiseScale);
                const detailNoise = noise.perlin2((x + 100) / (this.noiseScale * 0.5), (y + 100) / (this.noiseScale * 0.5));

                // Base layer (water and basic terrain)
                if (baseNoise < -0.2) {
                    layers.base[y][x] = 56; // Water
                } else {
                    layers.base[y][x] = 40; // Grass
                }

                // Terrain layer (hills and variations)
                if (baseNoise > 0.1) {
                    layers.terrain[y][x] = 165; // Rocky terrain
                }

                // Hills layer
                if (baseNoise > 0.3 && detailNoise > 0) {
                    layers.hills[y][x] = 50; // Higher elevation
                }

                // Peaks layer (snow/ice)
                if (baseNoise > 0.5 && detailNoise > 0.2) {
                    layers.peaks[y][x] = 51; // Snow peaks
                }
            }
        }

        // Create the base tilemap
        const map = this.make.tilemap({
            tileWidth: tileSize,
            tileHeight: tileSize,
            width: mapWidth,
            height: mapHeight
        });

        const tileset = map.addTilesetImage(this.tilesetData.name, this.tilesetData.key);

        // Create layers in order from bottom to top
        const baseLayer = map.createBlankLayer('base', tileset);
        const terrainLayer = map.createBlankLayer('terrain', tileset);
        const hillsLayer = map.createBlankLayer('hills', tileset);
        const peaksLayer = map.createBlankLayer('peaks', tileset);

        // Fill layers
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                if (layers.base[y][x]) baseLayer.putTileAt(layers.base[y][x], x, y);
                if (layers.terrain[y][x]) terrainLayer.putTileAt(layers.terrain[y][x], x, y);
                if (layers.hills[y][x]) hillsLayer.putTileAt(layers.hills[y][x], x, y);
                if (layers.peaks[y][x]) peaksLayer.putTileAt(layers.peaks[y][x], x, y);
            }
        }

        // Add transition tiles
        this.addTransitionTiles(baseLayer, terrainLayer, hillsLayer, peaksLayer);

        // Add town names
        this.addTownNames(mapWidth, mapHeight, tileSize, baseLayer);

        // Input handlers
        this.input.keyboard.on('keydown-COMMA', () => {
            this.noiseScale = Math.max(1, this.noiseScale - 1);
            this.scene.restart({ seed: this.seed, noiseScale: this.noiseScale });
        });

        this.input.keyboard.on('keydown-PERIOD', () => {
            this.noiseScale++;
            this.scene.restart({ seed: this.seed, noiseScale: this.noiseScale });
        });

        this.input.keyboard.on('keydown-R', () => {
            this.seed = Math.random();
            this.scene.restart({ seed: this.seed, noiseScale: this.noiseScale });
        });
    }

    addTownNames(mapWidth, mapHeight, tileSize, baseLayer) {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                // Add names every 5 tiles to space them out
                if (y % 5 === 0 && x % 5 === 0) {
                    // Check if it's a grass tile
                    const tile = baseLayer.getTileAt(x, y);
                    if (tile && tile.index === 40) { // 40 is grass tile index
                        // Generate a town name
                        const townName = grammar.generate();

                        // Add text to the game
                        this.add.text(x * tileSize + tileSize/2, y * tileSize + tileSize/2, townName, {
                            fontSize: '12px',
                            fill: '#ffffff',
                            align: 'center',
                            stroke: '#000000',
                            strokeThickness: 4
                        }).setOrigin(0.5, 0.5)
                            .setDepth(100);
                    }
                }
            }
        }
    }

    addTransitionTiles(baseLayer, terrainLayer, hillsLayer, peaksLayer) {
        const mapWidth = baseLayer.width;
        const mapHeight = baseLayer.height;

        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                // Add transition tiles between different terrain types
                if (this.shouldAddTransition(x, y, baseLayer, terrainLayer)) {
                    this.placeTransitionTile(x, y, baseLayer, terrainLayer);
                }
                if (this.shouldAddTransition(x, y, terrainLayer, hillsLayer)) {
                    this.placeTransitionTile(x, y, terrainLayer, hillsLayer);
                }
                if (this.shouldAddTransition(x, y, hillsLayer, peaksLayer)) {
                    this.placeTransitionTile(x, y, hillsLayer, peaksLayer);
                }
            }
        }
    }

    shouldAddTransition(x, y, lowerLayer, upperLayer) {
        // Check if we're at a terrain boundary
        const current = upperLayer.getTileAt(x, y);
        return current && this.hasAdjacentDifferentTerrain(x, y, lowerLayer, upperLayer);
    }

    hasAdjacentDifferentTerrain(x, y, lowerLayer, upperLayer) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        return directions.some(([dx, dy]) => {
            const tile = upperLayer.getTileAt(x + dx, y + dy);
            return !tile && lowerLayer.getTileAt(x + dx, y + dy);
        });
    }

    placeTransitionTile(x, y, lowerLayer, upperLayer) {
        // Place appropriate transition tile based on terrain types
        const transitionTileIndex = this.getTransitionTileIndex(
            lowerLayer.getTileAt(x, y)?.index,
            upperLayer.getTileAt(x, y)?.index
        );
        if (transitionTileIndex) {
            upperLayer.putTileAt(transitionTileIndex, x, y);
        }
    }

    getTransitionTileIndex(lowerTileIndex, upperTileIndex) {
        // Define transition tile indices based on your tileset
        const transitions = {
            '12_63': 13, // Grass to rock transition
            '63_65': 14, // Rock to snow transition
            // Add more transitions as needed
        };
        return transitions[`${lowerTileIndex}_${upperTileIndex}`];
    }
}

const config = {
    type: Phaser.CANVAS,
    width: 1280,
    height: 960,
    backgroundColor: '#87CEEB',
    scene: [myScene],
    pixelArt: true
};

const game = new Phaser.Game(config);