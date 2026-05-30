import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { blocks } from "./blocks";
import { HOTBAR_ITEM_TYPES, Toolbar } from "./toolbar";
import { ToolAnimator } from "./toolAnimator";
import { ToolManager, TOOL_TYPES } from "./tools";

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
    height = 1.75;
    radius = 0.5;
    maxSpeed = 5;
    jumpSpeed = 10;
    onGround = false;

    input = new THREE.Vector3();
    velocity = new THREE.Vector3();
    #worldVelocity = new THREE.Vector3();

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        200,
    );
    controls = new PointerLockControls(this.camera, document.body);

    cameraHelper = new THREE.CameraHelper(this.camera);

    raycaster = new THREE.Raycaster(
        new THREE.Vector3(),
        new THREE.Vector3(),
        0,
        3,
    );
    selectedCoords = null;
    activeBlockId = blocks.grass.id;
    toolbar = null;
    toolAnimator = null;
    toolManager = null;
    blockMeshes = {}; // Cache of block meshes for display
    onSelectedItemChanged = null;

    constructor(scene) {
        this.camera.position.set(32, 32, 32);
        scene.add(this.camera);
        scene.add(this.cameraHelper);

        // Initialize tool animator FIRST so it's ready for hand block display
        this.toolAnimator = new ToolAnimator(this.camera);

        // Initialize tool manager
        this.toolManager = new ToolManager();
        this.toolManager.setCurrentTool(TOOL_TYPES.HAND.id);

        // Create block meshes for display on hand BEFORE toolbar
        this.createBlockMeshes();

        // Initialize toolbar AFTER meshes are created
        this.toolbar = new Toolbar(this);
        this.equipHotbarItem(this.toolbar.getSelectedItem());

        this.boundsHelper = new THREE.Mesh(
            new THREE.CylinderGeometry(
                this.radius,
                this.radius,
                this.height,
                16,
            ),
            new THREE.MeshBasicMaterial({ wireframe: true }),
        );
        scene.add(this.boundsHelper);
        this.boundsHelper.visible = false;

        document.addEventListener("keydown", this.onKeyDown.bind(this));
        document.addEventListener("keyup", this.onKeyUp.bind(this));
        document.addEventListener("wheel", this.onMouseWheel.bind(this), {
            passive: false,
        });

        const selectionMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.3,
            color: 0xffffaa,
        });
        const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
        this.selectionHelper = new THREE.Mesh(
            selectionGeometry,
            selectionMaterial,
        );
        scene.add(this.selectionHelper);

        // Set raycaster to use layer 0 so it doesn't interact with water mesh on layer 1
        this.raycaster.layers.set(0);
        this.camera.layers.enable(1);
    }

    applyInputs(dt) {
        if (this.controls.isLocked) {
            this.velocity.x = this.input.x;
            this.velocity.z = this.input.z;
            this.controls.moveRight(this.velocity.x * dt);
            this.controls.moveForward(this.velocity.z * dt);
            this.position.y += this.velocity.y * dt;

            document.getElementById("player-position").innerHTML =
                this.toString();
        }
    }

    updateBoundsHelper() {
        this.boundsHelper.position.copy(this.camera.position);
        this.boundsHelper.position.y -= this.height / 2;
    }

    get position() {
        return this.camera.position;
    }

    get worldVelocity() {
        this.#worldVelocity.copy(this.velocity);
        this.#worldVelocity.applyEuler(
            new THREE.Euler(0, this.camera.rotation.y, 0),
        );
        return this.#worldVelocity;
    }

    update(world) {
        this.updateRaycaster(world);
    }

    updateRaycaster(world) {
        this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
        const intersections = this.raycaster.intersectObject(world, true);

        if (intersections.length > 0) {
            const intersection = intersections[0];

            // Get the chunk associated with the selected block
            const chunk = intersection.object.parent;

            // Get the transformation matrix for the selected block
            const blockMatrix = new THREE.Matrix4();
            intersection.object.getMatrixAt(
                intersection.instanceId,
                blockMatrix,
            );

            // Set the selected coordinates to the origin of the chunk,
            // then apply the transformation matrix of the block to get
            // the block coordinates
            this.selectedCoords = chunk.position.clone();
            this.selectedCoords.applyMatrix4(blockMatrix);

            if (this.activeBlockId !== blocks.empty.id) {
                // If we are adding a block, move it 1 block over in the direction
                // of where the ray intersected the cube
                this.selectedCoords.add(intersection.normal);
            }

            this.selectionHelper.position.copy(this.selectedCoords);
            this.selectionHelper.visible = true;
        } else {
            this.selectedCoords = null;
            this.selectionHelper.visible = false;
        }
    }

    applyWorldDeltaVelocity(dv) {
        dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
        this.velocity.add(dv);
    }

    onKeyDown(event) {
        if (!this.controls.isLocked) {
            this.controls.lock();
            console.log("Controls lock");
        }
        switch (event.code) {
            case "Digit0":
            case "Digit1":
            case "Digit2":
            case "Digit3":
            case "Digit4":
            case "Digit5":
            case "Digit6":
            case "Digit7":
            case "Digit8":
            case "Digit9": {
                const slotIndex = (Number(event.key) - 1 + 9) % 9; // 0 becomes 9th slot
                const item = this.toolbar.selectSlot(slotIndex);
                console.log(`Selected slot ${slotIndex}: ${item.label}`);
                break;
            }
            case "KeyW":
                this.input.z = this.maxSpeed;
                break;
            case "KeyA":
                this.input.x = -this.maxSpeed;
                break;
            case "KeyS":
                this.input.z = -this.maxSpeed;
                break;
            case "KeyD":
                this.input.x = this.maxSpeed;
                break;
            case "KeyR":
                this.position.set(32, 32, 32);
                this.velocity.set(0, 0, 0);
                break;
            case "Space":
                if (this.onGround) {
                    this.velocity.y += this.jumpSpeed;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case "KeyW":
                this.input.z = 0;
                break;
            case "KeyA":
                this.input.x = 0;
                break;
            case "KeyS":
                this.input.z = 0;
                break;
            case "KeyD":
                this.input.x = 0;
                break;
        }
    }

    onMouseWheel(event) {
        if (!this.controls.isLocked) return;
        
        event.preventDefault();
        
        if (event.deltaY > 0) {
            // Scroll down - next slot
            this.toolbar.nextSlot();
        } else if (event.deltaY < 0) {
            // Scroll up - previous slot
            this.toolbar.prevSlot();
        }
    }

    toString() {
        let str = ``;
        str += `X: ${this.position.x.toFixed(3)} `;
        str += `Y: ${this.position.y.toFixed(3)} `;
        str += `Z: ${this.position.z.toFixed(3)}`;
        return str;
    }

    /**
     * Create simple block meshes for hand display
     */
    createBlockMeshes() {
        const blockTypes = Object.values(blocks).filter((block) => {
            return (
                Number.isInteger(block.id) &&
                block.id !== blocks.empty.id &&
                block.material
            );
        });

        for (const block of blockTypes) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const mesh = new THREE.Mesh(geometry, block.material);
            this.blockMeshes[block.id] = mesh;
        }
    }

    /**
     * Equip a block or tool from the hotbar and refresh first-person display.
     */
    equipHotbarItem(item) {
        if (!item) return;

        if (item.type === HOTBAR_ITEM_TYPES.TOOL) {
            this.activeBlockId = blocks.empty.id;
            this.toolManager.setCurrentTool(item.toolId);
        } else {
            this.activeBlockId = item.blockId;
            this.toolManager.setCurrentTool(TOOL_TYPES.HAND.id);
        }

        this.updateHandBlock();
        this.onSelectedItemChanged?.(item);
    }

    /**
     * Update the block displayed in the player's hand
     */
    updateHandBlock() {
        if (!this.toolAnimator || !this.blockMeshes) return;

        const selectedItem = this.toolbar?.getSelectedItem();
        if (selectedItem?.type === HOTBAR_ITEM_TYPES.TOOL) {
            this.toolAnimator.setPickaxeModel();
        } else if (this.activeBlockId === blocks.empty.id) {
            this.toolAnimator.setBlockMesh(null);
        } else if (this.blockMeshes[this.activeBlockId]) {
            this.toolAnimator.setBlockMesh(this.blockMeshes[this.activeBlockId]);
        } else {
            // Fallback for blocks without a mesh yet
            this.toolAnimator.setBlockMesh(null);
        }
    }

    /**
     * Update the player state including animations
     */
    updatePlayer(deltaTime) {
        this.toolAnimator.update(deltaTime);
        this.toolbar.update();
    }

    /**
     * Check if the player can break a block with current tool
     * @param {number} blockId
     * @returns {Object} { canBreak: boolean, reason: string }
     */
    canBreakBlock(blockId) {
        return this.toolManager.canBreakBlock(blockId);
    }

    /**
     * Get current tool info
     * @returns {Object} tool info
     */
    getCurrentTool() {
        return this.toolManager.getCurrentTool();
    }

    /**
     * Switch to a different tool
     * @param {number} toolId
     */
    switchTool(toolId) {
        if (this.toolManager.setCurrentTool(toolId)) {
            this.updateHandBlock();
            this.onSelectedItemChanged?.(this.toolbar?.getSelectedItem());
        }
    }
}
