import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();

function loadTexture(path) {
    const texture = textureLoader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const textures = {
    dirt: loadTexture("textures/dirt.png"),
    grass: loadTexture("textures/grass.png"),
    grassSide: loadTexture("textures/grass_side.png"),
    stone: loadTexture("textures/stone.png"),
    coalOre: loadTexture("textures/coal_ore.png"),
    ironOre: loadTexture("textures/iron_ore.png"),
    leaves: loadTexture("textures/leaves.png"),
    treeSide: loadTexture("textures/tree_side.png"),
    treeTop: loadTexture("textures/tree_top.png"),
    sand: loadTexture("textures/sand.png"),
    snow: loadTexture("textures/snow.png"),
    snowSide: loadTexture("textures/snow_side.png"),
    cactusTop: loadTexture("textures/cactus_top.png"),
    cactusSide: loadTexture("textures/cactus_side.png"),
    jungleLeaves: loadTexture("textures/jungle_leaves.png"),
    jungleTreeSide: loadTexture("textures/jungle_tree_side.png"),
    jungleTreeTop: loadTexture("textures/jungle_tree_top.png"),
    cobblestone: loadTexture("textures/cobblestone.png"),
};

export const blocks = {
    empty: {
        id: 0,
        name: "empty",
        visible: false,
    },
    grass: {
        id: 1,
        name: "grass",
        material: [
            new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
            new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
            new THREE.MeshLambertMaterial({ map: textures.grass }), // top
            new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
            new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
            new THREE.MeshLambertMaterial({ map: textures.grassSide }), // back
        ],
    },
    dirt: {
        id: 2,
        name: "dirt",
        material: new THREE.MeshLambertMaterial({ map: textures.dirt }),
    },
    stone: {
        id: 3,
        name: "stone",
        material: new THREE.MeshLambertMaterial({ map: textures.stone }),
        scale: { x: 30, y: 30, z: 30 },
        scarcity: 0.8,
    },
    coalOre: {
        id: 4,
        name: "coal_ore",
        material: new THREE.MeshLambertMaterial({ map: textures.coalOre }),
        scale: { x: 20, y: 20, z: 20 },
        scarcity: 0.8,
    },
    ironOre: {
        id: 5,
        name: "iron_ore",
        material: new THREE.MeshLambertMaterial({ map: textures.ironOre }),
        scale: { x: 40, y: 40, z: 40 },
        scarcity: 0.9,
    },
    tree: {
        id: 6,
        name: "tree",
        visible: true,
        material: [
            new THREE.MeshLambertMaterial({ map: textures.treeSide }), // right
            new THREE.MeshLambertMaterial({ map: textures.treeSide }), // left
            new THREE.MeshLambertMaterial({ map: textures.treeTop }), // top
            new THREE.MeshLambertMaterial({ map: textures.treeTop }), // bottom
            new THREE.MeshLambertMaterial({ map: textures.treeSide }), // front
            new THREE.MeshLambertMaterial({ map: textures.treeSide }), // back
        ],
    },
    leaves: {
        id: 7,
        name: "leaves",
        visible: true,
        material: new THREE.MeshLambertMaterial({ map: textures.leaves }),
    },
    sand: {
        id: 8,
        name: "sand",
        visible: true,
        material: new THREE.MeshLambertMaterial({ map: textures.sand }),
    },
    cloud: {
        id: 9,
        name: "cloud",
        visible: true,
        material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 }),
    },
    snow: {
        id: 10,
        name: "snow",
        visible: true,
        material: [
            new THREE.MeshLambertMaterial({ map: textures.snowSide }), // right
            new THREE.MeshLambertMaterial({ map: textures.snowSide }), // left
            new THREE.MeshLambertMaterial({ map: textures.snow }), // top
            new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
            new THREE.MeshLambertMaterial({ map: textures.snowSide }), // front
            new THREE.MeshLambertMaterial({ map: textures.snowSide }), // back
        ],
    },
    cactus: {
        id: 11,
        name: "cactus",
        visible: true,
        material: [
            new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // right
            new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // left
            new THREE.MeshLambertMaterial({ map: textures.cactusTop }), // top
            new THREE.MeshLambertMaterial({ map: textures.cactusTop }), // bottom
            new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // front
            new THREE.MeshLambertMaterial({ map: textures.cactusSide }), // back
        ],
    },
    jungleLeaves: {
        id: 12,
        name: "jungle_leaves",
        visible: true,
        material: new THREE.MeshLambertMaterial({ map: textures.jungleLeaves }),
    },
    jungleTree: {
        id: 13,
        name: "jungle_tree",
        visible: true,
        material: [
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // right
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // left
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }), // top
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeTop }), // bottom
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // front
            new THREE.MeshLambertMaterial({ map: textures.jungleTreeSide }), // back
        ],
    },
    cobblestone: {
        id: 14,
        name: "cobblestone",
        visible: true,
        material: new THREE.MeshLambertMaterial({ map: textures.cobblestone }),
    },
    
    // Map of block IDs to display names
    names: {
        0: "Empty",
        1: "Grass",
        2: "Dirt",
        3: "Stone",
        4: "Coal Ore",
        5: "Iron Ore",
        6: "Tree",
        7: "Leaves",
        8: "Sand",
        9: "Cloud",
        10: "Snow",
        11: "Cactus",
        12: "Jungle Leaves",
        13: "Jungle Tree",
        14: "Cobblestone",
    }
};

export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];
