import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { World } from "./world";
import { Player } from "./player";
import { Physics } from "./physics";
import { setupUI } from "./ui";
import { blocks } from "./blocks";

// Renderer setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const orbitCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
);
orbitCamera.position.set(-32, 32, 32);
orbitCamera.layers.enable(1);

const controls = new OrbitControls(orbitCamera, renderer.domElement);
controls.target.set(32, 0, 32);
controls.update();

// Scene setup
const scene = new THREE.Scene();
const player = new Player(scene);
const physics = new Physics(scene);
const world = new World();
scene.add(world);

const sun = new THREE.DirectionalLight();
sun.intensity = 1.5;
sun.position.set(50, 50, 50);
sun.castShadow = true;

// Set the size of the sun's shadow box
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 200;
sun.shadow.bias = -0.0001;
sun.shadow.mapSize = new THREE.Vector2(2048, 2048);
scene.add(sun);
scene.add(sun.target);

const ambient = new THREE.AmbientLight();
ambient.intensity = 0.2;
scene.add(ambient);

scene.fog = new THREE.Fog(0x80a0e0, 50, 100);

// Events
window.addEventListener("resize", () => {
    // Resize camera aspect ratio and renderer size to the new window size
    orbitCamera.aspect = window.innerWidth / window.innerHeight;
    orbitCamera.updateProjectionMatrix();
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI Setup
const stats = new Stats();
document.body.appendChild(stats.dom);

// Start screen
const startScreen = document.getElementById("start-screen");
const startGameBtn = document.getElementById("start-game");
let startScreenVisible = true;
document.body.classList.add("start-screen-open");

function showStartScreen() {
    if (startScreenVisible) return;

    startScreenVisible = true;
    startScreen.classList.remove("hidden");
    document.body.classList.add("start-screen-open");
}

function closeStartScreen() {
    if (!startScreenVisible) return;

    startScreenVisible = false;
    startScreen.classList.add("hidden");
    document.body.classList.remove("start-screen-open");
}

function requestGameStart() {
    if (player.controls.isLocked) {
        closeStartScreen();
        return;
    }

    player.controls.lock();
}

startGameBtn.addEventListener("click", () => {
    requestGameStart();
});

document.addEventListener("keydown", (event) => {
    if (!startScreenVisible) return;

    event.preventDefault();
    event.stopPropagation();

    if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) return;
    requestGameStart();
}, { capture: true });

player.controls.addEventListener("lock", () => {
    closeStartScreen();
});

player.controls.addEventListener("unlock", () => {
    showStartScreen();
});

// Tool info display
const toolInfoEl = document.getElementById("current-tool");
function updateToolDisplay(item = player.toolbar.getSelectedItem()) {
    if (item?.type === "block") {
        toolInfoEl.textContent = blocks.names[item.blockId] ?? "Block";
        return;
    }

    const tool = player.getCurrentTool();
    toolInfoEl.textContent = tool.name;
}
player.onSelectedItemChanged = updateToolDisplay;
updateToolDisplay();

// User input

/**
 * Event handler for 'mousedown'' event
 * @param {MouseEvent} event
 */
function onMouseDown(event) {
    if (!player.controls.isLocked) return;
    if (!player.selectedCoords) return;
    
    // Left mouse button (0) = Break block
    if (event.button === 0) {
        const blockData = world.getBlock(
            player.selectedCoords.x,
            player.selectedCoords.y,
            player.selectedCoords.z
        );
        
        if (blockData && blockData.id !== blocks.empty.id) {
            const blockId = blockData.id;
            const canBreak = player.canBreakBlock(blockId);
            
            if (!canBreak.canBreak) {
                // Can't break with current tool
                showSaveStatus(`❌ ${canBreak.reason}`, 2000);
                console.warn(`Cannot break block ${blockId}: ${canBreak.reason}`);
            } else {
                // Can break - remove block
                world.removeBlock(
                    player.selectedCoords.x,
                    player.selectedCoords.y,
                    player.selectedCoords.z,
                );
                // Show success message with tool used
                const tool = player.getCurrentTool();
                showSaveStatus(`✅ Broke block with ${tool.name}`, 1000);
                player.toolAnimator.swing("break");
            }
        }
    }
    
    // Right mouse button (2) = Place block
    else if (event.button === 2) {
        if (player.activeBlockId !== blocks.empty.id) {
            // Placing a block
            world.addBlock(
                player.selectedCoords.x,
                player.selectedCoords.y,
                player.selectedCoords.z,
                player.activeBlockId,
            );
            showSaveStatus(`✅ Placed ${blocks.names[player.activeBlockId]}`, 800);
            player.toolAnimator.swing("place");
        }
    }
}
// Prevent context menu on right-click
document.addEventListener("contextmenu", (event) => {
    if (player.controls.isLocked) {
        event.preventDefault();
    }
});

document.addEventListener("mousedown", onMouseDown);

// Save/Load functionality
const saveStatusEl = document.getElementById("save-status");
const saveBtn = document.getElementById("save-game");
const loadBtn = document.getElementById("load-game");
const clearBtn = document.getElementById("clear-game");

function showSaveStatus(message, duration = 3000) {
    saveStatusEl.textContent = message;
    saveStatusEl.style.color = message.includes("failed") ? "#FF6B6B" : "#90EE90";
    setTimeout(() => {
        saveStatusEl.textContent = "";
    }, duration);
}

function saveGame() {
    const savedWorld = world.dataStore.saveToLocalStorage();
    const savedPlayer = world.dataStore.savePlayerState(
        player.camera.position,
        player.activeBlockId,
        player.toolbar.selectedSlot,
    );
    
    if (savedWorld && savedPlayer) {
        showSaveStatus("✅ Game saved successfully!");
    } else {
        showSaveStatus("❌ Failed to save game");
    }
}

function loadGame() {
    const loadedWorld = world.dataStore.loadFromLocalStorage();
    if (!loadedWorld) {
        showSaveStatus("❌ No saved game found");
        return;
    }

    const playerState = world.dataStore.loadPlayerState();
    if (playerState) {
        player.camera.position.set(
            playerState.position.x,
            playerState.position.y,
            playerState.position.z
        );
        const slotIndex = Number.isInteger(playerState.selectedSlot)
            ? playerState.selectedSlot
            : player.toolbar.findSlotByBlockId(playerState.activeBlockId);
        player.toolbar.selectSlot(slotIndex);
    }

    // Regenerate world to apply loaded data
    world.regenerate(player);
    showSaveStatus("✅ Game loaded successfully!");
}

function clearAllData() {
    if (confirm("Are you sure you want to delete all saved data? This cannot be undone.")) {
        world.dataStore.clearAllData();
        showSaveStatus("✅ All data cleared");
    }
}

// Button event listeners
saveBtn.addEventListener("click", saveGame);
loadBtn.addEventListener("click", loadGame);
clearBtn.addEventListener("click", clearAllData);

// Keyboard shortcuts and control handlers
document.addEventListener("keydown", (event) => {
    // Save/Load shortcuts
    if (event.ctrlKey || event.metaKey) {
        if (event.key === "s" || event.key === "S") {
            event.preventDefault();
            saveGame();
            return;
        } else if (event.key === "l" || event.key === "L") {
            event.preventDefault();
            loadGame();
            return;
        }
    }

    // Tool switching (T key)
    if (event.key === "t" || event.key === "T") {
        if (player.toolManager.upgradeToNextTool()) {
            player.updateHandBlock();
            updateToolDisplay();
            const tool = player.getCurrentTool();
            showSaveStatus(`⛏️ Switched to ${tool.name}`, 2000);
        } else {
            showSaveStatus(`❌ Already using highest level tool`, 2000);
        }
        return;
    }
});

// Render loop
let previousTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const dt = (currentTime - previousTime) / 1000;

    // Position the sun relative to the player. Need to adjust both the
    // position and target of the sun to keep the same sun angle
    sun.position.copy(player.camera.position);
    sun.position.sub(new THREE.Vector3(-50, -50, -50));
    sun.target.position.copy(player.camera.position);

    physics.update(dt, player, world);
    player.update(world);
    player.updatePlayer(dt);
    world.update(player);
    renderer.render(
        scene,
        player.controls.isLocked ? player.camera : orbitCamera,
    );
    stats.update();

    previousTime = currentTime;
}

setupUI(world, player, physics, scene);
animate();
