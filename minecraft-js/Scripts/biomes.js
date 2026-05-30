import { RNG } from "./rng.js";
import { blocks } from "./blocks.js";

/**
 * Simple Perlin-like noise function
 */
class SimpleNoise {
    constructor(seed) {
        this.seed = seed;
        this.permutation = this.generatePermutation(seed);
    }

    generatePermutation(seed) {
        const p = [];
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }
        // Shuffle using seed
        for (let i = 255; i > 0; i--) {
            const rng = new RNG(seed + i);
            const j = Math.floor(rng.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        return p.concat(p);
    }

    perlin2D(x, y) {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;

        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        // Fade curves
        const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
        const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

        const aa = this.permutation[this.permutation[xi] + yi];
        const ba = this.permutation[this.permutation[xi + 1] + yi];
        const ab = this.permutation[this.permutation[xi] + yi + 1];
        const bb = this.permutation[this.permutation[xi + 1] + yi + 1];

        const x1 = this.lerp(this.grad2D(aa, xf, yf), this.grad2D(ba, xf - 1, yf), u);
        const x2 = this.lerp(this.grad2D(ab, xf, yf - 1), this.grad2D(bb, xf - 1, yf - 1), u);

        return this.lerp(x1, x2, v);
    }

    grad2D(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 8 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    lerp(a, b, t) {
        return a + t * (b - a);
    }
}

/**
 * Biome system for Minecraft Three.js
 * Defines different biome types and their characteristics
 */

export const BIOME_TYPES = {
    PLAINS: { name: "Plains", id: 0 },
    DESERT: { name: "Desert", id: 1 },
    JUNGLE: { name: "Jungle", id: 2 },
    SNOW: { name: "Snow", id: 3 },
    FOREST: { name: "Forest", id: 4 },
};

export class BiomeGenerator {
    constructor(seed = 0) {
        this.seed = seed;
        this.biomeNoise = new SimpleNoise(seed);
        
        this.biomeScale = 100; // Lower = larger biomes
        this.biomeThreshold = 0.5;
    }

    /**
     * Get the biome at a specific world coordinate
     * @param {number} x
     * @param {number} z
     * @returns {Object} biome object
     */
    getBiome(x, z) {
        const noiseValue = this.biomeNoise.perlin2D(x / this.biomeScale, z / this.biomeScale);
        const normalizedValue = (noiseValue + 1) / 2; // Convert from [-1, 1] to [0, 1]

        if (normalizedValue < 0.2) {
            return BIOME_TYPES.SNOW;
        } else if (normalizedValue < 0.4) {
            return BIOME_TYPES.DESERT;
        } else if (normalizedValue < 0.6) {
            return BIOME_TYPES.JUNGLE;
        } else if (normalizedValue < 0.8) {
            return BIOME_TYPES.FOREST;
        } else {
            return BIOME_TYPES.PLAINS;
        }
    }

    /**
     * Get the surface block for a biome
     * @param {Object} biome
     * @returns {Object} block object
     */
    getSurfaceBlock(biome) {
        switch (biome.id) {
            case BIOME_TYPES.DESERT.id:
                return blocks.sand;
            case BIOME_TYPES.SNOW.id:
                return blocks.snow || blocks.grass; // Use snow if available
            case BIOME_TYPES.JUNGLE.id:
                return blocks.grass;
            case BIOME_TYPES.FOREST.id:
                return blocks.grass;
            case BIOME_TYPES.PLAINS.id:
            default:
                return blocks.grass;
        }
    }

    /**
     * Get the tree type for a biome
     * @param {Object} biome
     * @returns {string} tree type (standard, jungle, snow, etc.)
     */
    getTreeType(biome) {
        switch (biome.id) {
            case BIOME_TYPES.JUNGLE.id:
                return "jungle";
            case BIOME_TYPES.SNOW.id:
                return "snow";
            case BIOME_TYPES.FOREST.id:
                return "forest";
            case BIOME_TYPES.DESERT.id:
                return "cactus";
            case BIOME_TYPES.PLAINS.id:
            default:
                return "standard";
        }
    }

    /**
     * Get vegetation for a biome (cactus in desert, etc.)
     * @param {Object} biome
     * @returns {Array} array of vegetation block IDs
     */
    getVegetation(biome) {
        switch (biome.id) {
            case BIOME_TYPES.DESERT.id:
                // Cactus blocks
                return blocks.cactus ? [blocks.cactus.id] : [];
            case BIOME_TYPES.JUNGLE.id:
                // Jungle vegetation
                return [blocks.leaves?.id, blocks.jungleLeaves?.id].filter(Boolean);
            case BIOME_TYPES.SNOW.id:
                // Snow vegetation
                return [];
            case BIOME_TYPES.FOREST.id:
                // Forest vegetation
                return [blocks.leaves?.id].filter(Boolean);
            case BIOME_TYPES.PLAINS.id:
            default:
                return [];
        }
    }

    /**
     * Get the color/appearance for a biome
     * @param {Object} biome
     * @returns {Object} color info for rendering
     */
    getBiomeColor(biome) {
        switch (biome.id) {
            case BIOME_TYPES.DESERT.id:
                return { fogColor: 0xE8C06B, grassColor: 0xD4C854 };
            case BIOME_TYPES.SNOW.id:
                return { fogColor: 0xE8E8F0, grassColor: 0xF0F0F8 };
            case BIOME_TYPES.JUNGLE.id:
                return { fogColor: 0x6BA066, grassColor: 0x5CA050 };
            case BIOME_TYPES.FOREST.id:
                return { fogColor: 0x7CB342, grassColor: 0x689F38 };
            case BIOME_TYPES.PLAINS.id:
            default:
                return { fogColor: 0x80a0e0, grassColor: 0x90EE90 };
        }
    }

    /**
     * Get resource frequency for a biome
     * @param {Object} biome
     * @returns {Object} resource frequency multipliers
     */
    getResourceFrequency(biome) {
        switch (biome.id) {
            case BIOME_TYPES.DESERT.id:
                return { stone: 1.2, coalOre: 0.8, ironOre: 0.6 };
            case BIOME_TYPES.SNOW.id:
                return { stone: 1.0, coalOre: 1.0, ironOre: 1.0 };
            case BIOME_TYPES.JUNGLE.id:
                return { stone: 0.8, coalOre: 1.2, ironOre: 1.0 };
            case BIOME_TYPES.FOREST.id:
                return { stone: 1.1, coalOre: 1.1, ironOre: 1.0 };
            case BIOME_TYPES.PLAINS.id:
            default:
                return { stone: 1.0, coalOre: 1.0, ironOre: 1.0 };
        }
    }

    /**
     * Update biome generator with new seed
     * @param {number} seed
     */
    setSeed(seed) {
        this.seed = seed;
        this.biomeNoise = new SimpleNoise(seed);
    }

    /**
     * Update biome noise scale (affects biome size)
     * @param {number} scale
     */
    setBiomeScale(scale) {
        this.biomeScale = scale;
    }
}
