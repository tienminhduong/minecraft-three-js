import * as THREE from 'three';

import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

import { RNG } from './rng';

import { blocks, resources } from './blocks';
import { instance } from 'three/src/nodes/accessors/instancenode';
import { WorldChunk } from './worldChunk';
import { Player } from './player';

const geometry = new THREE.BoxGeometry();

export class World extends THREE.Group {

    drawDistance = 3;
    asyncLoading = true;
    chunkSize = {
        width: 32,
        height: 32
    }

    constructor(seed = 0) {
        super();
        this.params = {
            seed: seed,
            terrain: {
                scale: 50,
                magnitude: 0.5,
                offset: 0
            }
        };
    }

    getBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

        if (chunk && chunk.loaded) {
            return chunk.getBlock(coords.block.x, y, coords.block.z);
        } else {
            return null;
        }
    }

    worldToChunkCoords(x, y, z) {
        const chunkCoords = {
            x: Math.floor(x / this.chunkSize.width),
            z: Math.floor(z / this.chunkSize.width),
        };

        const blockCoords = {
            x: x - this.chunkSize.width * chunkCoords.x,
            y,
            z: z - this.chunkSize.width * chunkCoords.z
        }



        return {
            chunk: chunkCoords,
            block: blockCoords
        };
    }

    getChunk(chunkX, chunkZ) {
        return this.children.find((chunk) => {
            return chunk.userData.x === chunkX &&
                chunk.userData.z === chunkZ;
        });
    }

    inBounds(x, y, z) {
        if (x >= 0 && x < this.size.width &&
            y >= 0 && y < this.size.height &&
            z >= 0 && z < this.size.width) {
            return true;
        }
        else {
            return false;
        }
    }

    setBlockID(x, y, z, id) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id;
        }
    }

    setBlockInstanceID(x, y, z, instanceID) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].instanceID = instanceID;
        }
    }


    isBlockObscured(x, y, z) {
        const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
        const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
        const right = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
        const left = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
        const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
        const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

        if (up === blocks.empty.id ||
            down === blocks.empty.id ||
            right === blocks.empty.id ||
            left === blocks.empty.id ||
            forward === blocks.empty.id ||
            back === blocks.empty.id
        ) {
            return false;
        }
        else return true;
    }

    update(player) {
        const visibleChunks = this.getVisibleChunks(player);
        const chunksToAdd = this.getChunksToAdd(visibleChunks);
        this.removeUnusedChunks(visibleChunks);

        for (const chunk of chunksToAdd) {
            this.generateChunk(chunk.x, chunk.z);
        }
    }

    getVisibleChunks(player) {
        // Get the coordinates of the chunk the player is currently in
        const coords = this.worldToChunkCoords(player.position.x, 0, player.position.z);

        const visibleChunks = [];
        for (let x = coords.chunk.x - this.drawDistance; x <= coords.chunk.x + this.drawDistance; x++) {
            for (let z = coords.chunk.z - this.drawDistance; z <= coords.chunk.z + this.drawDistance; z++) {
                visibleChunks.push({ x, z });
            }
        }
        return visibleChunks;
    }

    getChunksToAdd(visibleChunks) {
        // Filter down visible chunks, removing ones that already exist
        return visibleChunks.filter((chunkToAdd) => {
            const chunkExists = this.children
                .map((obj) => obj.userData)
                .find(({ x, z }) => {
                    return chunkToAdd.x === x && chunkToAdd.z === z;
                });

            return !chunkExists;
        })
    }

    removeUnusedChunks(visibleChunks) {
        // Filter current chunks, getting ones that don't exist in visible chunks
        const chunksToRemove = this.children.filter((obj) => {
            const { x, z } = obj.userData;
            const chunkExists = visibleChunks.find((visibleChunk) => {
                return visibleChunk.x === x && visibleChunk.z === z;
            });

            return !chunkExists;
        })

        for (const chunk of chunksToRemove) {
            chunk.disposeChildren();
            this.remove(chunk);
            //console.log(`Removed chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`);

        }
    }

    regenerate(player) {
        this.children.forEach((obj) => {
            obj.disposeChildren();
        });
        this.clear();
        this.update(player);
    }

    generateChunk(x, z) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
        chunk.userData = { x, z };
        if (this.asyncLoading) {
            requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
        } else {
            chunk.generate();
        }
        this.add(chunk);
    }

    removeBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

        if(chunk){
            chunk.removeBlock(coords.block.x, y, coords.block.z);
        }
    }
}