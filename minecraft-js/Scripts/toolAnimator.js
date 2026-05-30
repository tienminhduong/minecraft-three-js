import * as THREE from "three";

/**
 * Manages tool/block animation in first-person view
 * Shows the held block or tool in player's hand with swing animation
 */
export class ToolAnimator {
    constructor(camera) {
        this.camera = camera;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationDuration = 0.22; // seconds
        this.swingType = "break"; // "break" or "place"
        this.heldType = null;
        
        // Create container for held block/tool.
        this.toolContainer = new THREE.Group();
        this.camera.add(this.toolContainer);
        
        // Camera space looks down -Z, so held items must live at a negative Z.
        this.toolContainer.position.set(0.5, -0.4, -0.8);
        this.toolContainer.scale.set(0.35, 0.35, 0.35);
        
        // Store original position and rotation
        this.originalPosition = this.toolContainer.position.clone();
        this.originalRotation = this.toolContainer.rotation.clone();
        this.originalScale = this.toolContainer.scale.clone();
    }

    /**
     * Set the block/tool mesh to display
     */
    setBlockMesh(blockMesh) {
        this.#clearHeldObject();
        this.heldType = blockMesh ? "block" : null;
        this.#setRestTransform(
            new THREE.Vector3(0.5, -0.42, -0.78),
            new THREE.Euler(0, 0, 0),
            new THREE.Vector3(0.34, 0.34, 0.34),
        );
        
        if (blockMesh) {
            const meshCopy = blockMesh.clone();
            meshCopy.material = this.#createViewMaterial(blockMesh.material);
            meshCopy.rotation.set(-0.28, -0.58, 0.16);
            meshCopy.renderOrder = 1000;
            this.toolContainer.add(meshCopy);
        }
    }

    /**
     * Set a blocky 3D pickaxe model for first-person view.
     */
    setPickaxeModel() {
        this.#clearHeldObject();
        this.heldType = "pickaxe";
        this.#setRestTransform(
            new THREE.Vector3(0.58, -0.52, -0.9),
            new THREE.Euler(-0.2, -0.22, -0.72),
            new THREE.Vector3(0.82, 0.82, 0.82),
        );

        this.toolContainer.add(this.#createPickaxeModel());
    }

    /**
     * Play a swing animation (break or place)
     */
    swing(type = "break") {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animationProgress = 0;
        this.swingType = type;
    }

    /**
     * Update animation state
     */
    update(deltaTime) {
        if (!this.isAnimating) {
            // Idle state - reset to original position
            this.toolContainer.position.copy(this.originalPosition);
            this.toolContainer.rotation.copy(this.originalRotation);
            this.toolContainer.scale.copy(this.originalScale);
            return;
        }
        
        this.animationProgress += deltaTime / this.animationDuration;
        
        if (this.animationProgress >= 1) {
            this.isAnimating = false;
            this.animationProgress = 0;
            this.toolContainer.position.copy(this.originalPosition);
            this.toolContainer.rotation.copy(this.originalRotation);
            this.toolContainer.scale.copy(this.originalScale);
            return;
        }
        
        if (this.heldType === "pickaxe") {
            this.#updatePickaxeSwing(this.animationProgress);
        } else {
            this.#updateBlockSwing(this.animationProgress);
        }
    }

    /**
     * Show/hide the tool
     */
    setVisible(visible) {
        this.toolContainer.visible = visible;
    }

    /**
     * Reset animation state
     */
    reset() {
        this.isAnimating = false;
        this.animationProgress = 0;
        this.toolContainer.position.copy(this.originalPosition);
        this.toolContainer.rotation.copy(this.originalRotation);
        this.toolContainer.scale.copy(this.originalScale);
    }

    #setRestTransform(position, rotation, scale) {
        this.toolContainer.position.copy(position);
        this.toolContainer.rotation.copy(rotation);
        this.toolContainer.scale.copy(scale);
        this.originalPosition.copy(position);
        this.originalRotation.copy(rotation);
        this.originalScale.copy(scale);
    }

    #createViewMaterial(material) {
        if (Array.isArray(material)) {
            return material.map((item) => this.#createViewMaterial(item));
        }

        return new THREE.MeshBasicMaterial({
            map: material?.map ?? null,
            color: material?.color ?? 0xffffff,
            transparent: material?.transparent ?? false,
            opacity: material?.opacity ?? 1,
            alphaTest: material?.alphaTest ?? 0,
            side: material?.side ?? THREE.FrontSide,
            depthTest: false,
            depthWrite: false,
        });
    }

    #updatePickaxeSwing(progress) {
        const swing = Math.sin(progress * Math.PI);
        const pull = Math.sin(Math.sqrt(progress) * Math.PI);

        this.toolContainer.position.x = this.originalPosition.x - pull * 0.16;
        this.toolContainer.position.y = this.originalPosition.y - swing * 0.1;
        this.toolContainer.position.z = this.originalPosition.z - swing * 0.22;

        this.toolContainer.rotation.x = this.originalRotation.x - swing * 1.25;
        this.toolContainer.rotation.y = this.originalRotation.y - pull * 0.55;
        this.toolContainer.rotation.z = this.originalRotation.z + pull * 0.72;
    }

    #updateBlockSwing(progress) {
        const swing = Math.sin(progress * Math.PI);
        const pull = Math.sin(Math.sqrt(progress) * Math.PI);
        const placeDirection = this.swingType === "place" ? -1 : 1;

        this.toolContainer.position.x = this.originalPosition.x - pull * 0.08;
        this.toolContainer.position.y = this.originalPosition.y - swing * 0.06;
        this.toolContainer.position.z = this.originalPosition.z - swing * 0.08;

        this.toolContainer.rotation.x = this.originalRotation.x - swing * 0.65;
        this.toolContainer.rotation.y = this.originalRotation.y - pull * 0.28 * placeDirection;
        this.toolContainer.rotation.z = this.originalRotation.z + pull * 0.38;
    }

    #createPickaxeModel() {
        const group = new THREE.Group();
        const materials = {
            handle: this.#createFlatMaterial(0x6f4528),
            handleDark: this.#createFlatMaterial(0x3b2517),
            stone: this.#createFlatMaterial(0x8c8c8c),
            stoneLight: this.#createFlatMaterial(0xb8b8b8),
            stoneDark: this.#createFlatMaterial(0x4f4f4f),
        };

        this.#addBox(group, [0.13, 1.18, 0.13], [0, -0.28, 0], materials.handle);
        this.#addBox(group, [0.06, 1.2, 0.15], [-0.035, -0.28, 0.02], materials.handleDark);
        this.#addBox(group, [0.22, 0.16, 0.2], [0, 0.36, 0], materials.stoneDark);
        this.#addBox(group, [0.88, 0.18, 0.2], [0, 0.5, 0], materials.stone);
        this.#addBox(group, [0.34, 0.16, 0.2], [-0.52, 0.42, 0], materials.stone, 0.55);
        this.#addBox(group, [0.3, 0.15, 0.2], [-0.7, 0.25, 0], materials.stoneDark, 0.88);
        this.#addBox(group, [0.34, 0.16, 0.2], [0.52, 0.42, 0], materials.stone, -0.55);
        this.#addBox(group, [0.3, 0.15, 0.2], [0.7, 0.25, 0], materials.stoneLight, -0.88);
        this.#addBox(group, [0.36, 0.08, 0.22], [-0.18, 0.6, 0.02], materials.stoneLight);

        group.rotation.set(0, 0, 0);
        return group;
    }

    #createFlatMaterial(color) {
        return new THREE.MeshBasicMaterial({
            color,
            depthTest: false,
            depthWrite: false,
        });
    }

    #addBox(group, size, position, material, rotationZ = 0) {
        const geometry = new THREE.BoxGeometry(...size);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        mesh.rotation.z = rotationZ;
        mesh.renderOrder = 1000;
        group.add(mesh);
    }

    #clearHeldObject() {
        this.toolContainer.traverse((child) => {
            if (child === this.toolContainer) return;

            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
                child.material.forEach((material) => material.dispose());
            } else {
                child.material?.dispose();
            }
        });
        this.toolContainer.clear();
    }
}
