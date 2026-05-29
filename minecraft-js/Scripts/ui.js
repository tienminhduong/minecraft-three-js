import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { resources } from './blocks';
import { Physics } from './physics';


export function createUI(world, player, physics, scene) {
    const gui = new GUI();

    const playerFolder = gui.addFolder('Player');
    playerFolder.add(player, 'maxSpeed', 1, 20).name('Max Speed');
    playerFolder.add(player, 'jumpSpeed', 1, 10, 0.1).name('Jump Speed');
    playerFolder.add(player.boundsHelper, 'visible').name('Show Bounds Helper');
    playerFolder.add(player.cameraHelper, 'visible').name('Show Camera Helper');

    // gui.add(world.size, 'width', 8, 128, 1).name('Width');
    // gui.add(world.size, 'height', 8, 64, 1).name('Height');

    const physicsFolder = gui.addFolder('Physics');
    physicsFolder.add(physics.helpers, 'visible').name('Visualize Collisions');
    physicsFolder.add(physics, 'simulationRate', 10, 1000).name('Sim Rate');

    const terrainFolder = gui.addFolder("Terrain");
    terrainFolder.add(world.params, 'seed', 0, 10000).name('Seed');
    // terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale');
    // terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitude');
    // terrainFolder.add(world.params.terrain, 'offset', 0, 1).name('Offset');

    const worldFolder = gui.addFolder('World');
    worldFolder.add(world, 'drawDistance', 1, 10, 1).name('Draw Distance');
    worldFolder.add(world, 'asyncLoading').name('Async Loading');
    worldFolder.add(scene.fog, 'near', 1, 200, 1).name('Fog Near');
    worldFolder.add(scene.fog, 'far', 1, 200, 1).name('Fog Far');


    const resourcesFolder = gui.addFolder('Resources');

    resources.forEach(resource => {
        const folder = resourcesFolder.addFolder(resource.name);

        folder.add(resource, 'scarity', 0, 1).name('Scarity');

        const scaleFolder = folder.addFolder('Scale');
        scaleFolder.add(resource.scale, 'x', 10, 100).name('X Scale');
        scaleFolder.add(resource.scale, 'y', 10, 100).name('Y Scale');
        scaleFolder.add(resource.scale, 'z', 10, 100).name('Z Scale');
    });

    //gui.add(world, 'generate');
    gui.onChange(() => {
        world.generate();
    });

    terrainFolder.onChange(() => {
        world.regenerate(player);
    });
}