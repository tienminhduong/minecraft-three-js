import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { blocks } from "./blocks";

const gltfLoader = new GLTFLoader();
const DEFAULT_IDLE_ANIMATIONS = ["idle", "still", "still_test"];
const DEFAULT_WALK_ANIMATIONS = ["walk", "walking", "walking_test"];
const TREE_BLOCK_IDS = new Set([
    blocks.tree.id,
    blocks.jungleTree.id,
    blocks.leaves.id,
    blocks.jungleLeaves.id,
]);

export class Mob {
    constructor(scene, world, options = {}) {
        this.scene = scene;
        this.world = world;

        this.modelPath = options.modelPath;
        this.container = new THREE.Group();
        this.container.position.copy(
            options.position ?? new THREE.Vector3(0, 0, 0),
        );
        this.spawnPosition = this.container.position.clone();

        this.walkSpeed = options.walkSpeed ?? 1.5;
        this.roamRadius = options.roamRadius ?? 8;
        this.idleChance = options.idleChance ?? 0.4;
        this.idleDuration = options.idleDuration ?? { min: 1.5, max: 4 };
        this.walkDuration = options.walkDuration ?? { min: 2, max: 5 };
        this.scale = options.scale ?? 1;
        this.idleAnimations = options.idleAnimations ?? DEFAULT_IDLE_ANIMATIONS;
        this.walkAnimations = options.walkAnimations ?? DEFAULT_WALK_ANIMATIONS;
        this.modelOffsetY = options.modelOffsetY ?? 0;
        this.modelYawOffset = options.modelYawOffset ?? Math.PI;
        this.colliderRadius = options.colliderRadius ?? 0.45;
        this.colliderHeight = options.colliderHeight ?? 1;
        this.idleFlashSpeed = options.idleFlashSpeed ?? 6;
        this.idleFlashMin = options.idleFlashMin ?? 0.82;
        this.idleFlashMax = options.idleFlashMax ?? 1.24;
        this.idleFlashEmissive = options.idleFlashEmissive ?? 0.18;

        this.model = null;
        this.mixer = null;
        this.actions = {};
        this.currentAction = null;
        this.materialStates = [];
        this.idleFlashTime = 0;

        this.state = "walk";
        this.stateTimer = this.randomRange(this.walkDuration);
        this.direction = this.randomDirection();
        this.path = [];
        this.pathIndex = 0;
        this.pathTarget = null;

        this.scene.add(this.container);

        if (!this.modelPath) {
            throw new Error("Mob requires a modelPath");
        }

        this.loadModel(this.modelPath);
    }

    loadModel(modelPath) {
        gltfLoader.load(
            modelPath,
            (gltf) => {
                this.model = gltf.scene;
                this.model.scale.setScalar(this.scale);

                this.model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        const materials = Array.isArray(child.material)
                            ? child.material
                            : [child.material];

                        for (const material of materials) {
                            if (
                                !material ||
                                this.materialStates.some(
                                    (state) => state.material === material,
                                )
                            ) {
                                continue;
                            }

                            this.materialStates.push({
                                material,
                                baseColor: material.color?.clone() ?? null,
                                baseEmissive: material.emissive?.clone() ?? null,
                                baseEmissiveIntensity:
                                    typeof material.emissiveIntensity === "number"
                                        ? material.emissiveIntensity
                                        : null,
                            });

                            if (material?.map) {
                                material.map.magFilter = THREE.NearestFilter;
                                material.map.minFilter = THREE.NearestFilter;
                                material.map.colorSpace = THREE.SRGBColorSpace;
                            }
                        }
                    }
                });

                const bounds = new THREE.Box3().setFromObject(this.model);
                const size = bounds.getSize(new THREE.Vector3());
                this.modelOffsetY = -bounds.min.y;
                this.model.position.y = this.modelOffsetY;
                this.colliderRadius = Math.max(
                    0.25,
                    Math.max(size.x, size.z) * 0.28,
                );
                this.colliderHeight = Math.max(0, size.y * 0.48);

                if (gltf.animations?.length) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    gltf.animations.forEach((clip) => {
                        this.actions[clip.name] = this.mixer.clipAction(clip);
                    });
                }

                this.container.add(this.model);
                this.resetIdleFlash();
                this.applyCurrentState(true);
            },
            undefined,
            (error) => {
                console.error(`Failed to load mob model from ${modelPath}:`, error);
                this.model = new THREE.Object3D();
                this.container.add(this.model);
            },
        );
    }

    update(dt, world = this.world) {
        if (this.mixer) {
            this.mixer.update(dt);
        }

        if (this.state === "idle") {
            this.updateIdleFlash(dt);
        } else {
            this.resetIdleFlash();
        }

        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
            this.chooseNextState();
        }

        if (this.state === "walk") {
            if (!this.hasPath()) {
                this.createRandomPath(world);
            }
            this.stepWalk(dt, world);
        }

        this.alignToGround(world);
    }

    chooseNextState() {
        const shouldIdle = Math.random() < this.idleChance;

        if (shouldIdle) {
            this.state = "idle";
            this.stateTimer = this.randomRange(this.idleDuration);
            this.clearPath();
        } else {
            this.state = "walk";
            this.stateTimer = this.randomRange(this.walkDuration);

            if (!this.hasPath()) {
                this.createRandomPath(this.world);
            }
        }

        this.applyCurrentState();
    }

    applyCurrentState(force = false) {
        if (!this.mixer || !this.actions) {
            return;
        }

        const animationNames =
            this.state === "walk" ? this.walkAnimations : this.idleAnimations;
        const nextAction = this.findAction(animationNames);

        if (!nextAction || (!force && this.currentAction === nextAction)) {
            return;
        }

        if (this.currentAction) {
            nextAction.reset();
            nextAction.play();
            nextAction.crossFadeFrom(this.currentAction, 0.2, true);
        } else {
            nextAction.reset();
            nextAction.play();
        }

        this.currentAction = nextAction;
    }

    updateIdleFlash(dt) {
        if (!this.materialStates.length) {
            return;
        }

        this.idleFlashTime += dt;
        const pulse = 0.5 + 0.5 * Math.sin(this.idleFlashTime * this.idleFlashSpeed);
        const shade = this.idleFlashMin + (this.idleFlashMax - this.idleFlashMin) * pulse;

        for (const state of this.materialStates) {
            const { material, baseColor, baseEmissive, baseEmissiveIntensity } = state;

            if (baseColor && material.color) {
                material.color.copy(baseColor).multiplyScalar(shade);
            }

            if (baseEmissive && material.emissive) {
                material.emissive.copy(baseEmissive).multiplyScalar(0.85 + pulse * this.idleFlashEmissive);
            }

            if (baseEmissiveIntensity !== null) {
                material.emissiveIntensity = baseEmissiveIntensity + pulse * this.idleFlashEmissive;
            }
        }
    }

    resetIdleFlash() {
        this.idleFlashTime = 0;

        for (const state of this.materialStates) {
            const { material, baseColor, baseEmissive, baseEmissiveIntensity } = state;

            if (baseColor && material.color) {
                material.color.copy(baseColor);
            }

            if (baseEmissive && material.emissive) {
                material.emissive.copy(baseEmissive);
            }

            if (baseEmissiveIntensity !== null) {
                material.emissiveIntensity = baseEmissiveIntensity;
            }
        }
    }

    findAction(names) {
        for (const name of names) {
            if (this.actions[name]) {
                return this.actions[name];
            }
        }

        const firstActionName = Object.keys(this.actions)[0];
        return firstActionName ? this.actions[firstActionName] : null;
    }

    stepWalk(dt, world) {
        if (!this.followPath(dt, world)) {
            this.createRandomPath(world);
            return;
        }

        this.faceDirection(this.direction);
    }

    alignToGround(world) {
        if (!world) {
            return;
        }

        const groundY = this.findGroundHeight(
            world,
            this.container.position.x,
            this.container.position.z,
        );

        if (groundY !== null) {
            this.container.position.y = groundY;
        }
    }

    findGroundHeight(world, x, z) {
        const maxHeight = world.chunkSize?.height ?? 32;

        for (let y = maxHeight - 1; y >= 0; y--) {
            const block = world.getBlock(Math.floor(x), y, Math.floor(z));
            if (block && this.isGroundBlock(block.id)) {
                return y + 1;
            }
        }

        return null;
    }

    faceDirection(direction) {
        if (direction.lengthSq() === 0) {
            return;
        }

        const heading = Math.atan2(direction.x, direction.z);
        this.container.rotation.y = heading + this.modelYawOffset;
    }

    hasPath() {
        return this.path.length > 0 && this.pathIndex < this.path.length;
    }

    clearPath() {
        this.path = [];
        this.pathIndex = 0;
        this.pathTarget = null;
    }

    createRandomPath(world) {
        if (!world) {
            return;
        }

        const start = this.container.position.clone();
        const pathLength = Math.max(2, Math.round(2 + Math.random() * 3));
        const segments = [];
        let cursor = start.clone();

        for (let i = 0; i < pathLength; i++) {
            const direction = this.pickWalkDirection();
            const distance = 2 + Math.random() * this.roamRadius;
            const nextPoint = cursor.clone().addScaledVector(direction, distance);
            nextPoint.y = cursor.y;

            const clampedPoint = this.clampPointToRoamArea(nextPoint);
            if (!this.isPathSegmentClear(world, cursor, clampedPoint)) {
                continue;
            }

            segments.push(clampedPoint);
            cursor = clampedPoint;
        }

        if (segments.length === 0) {
            this.direction = this.pickWalkDirection();
            this.clearPath();
            return;
        }

        this.path = segments;
        this.pathIndex = 0;
        this.pathTarget = this.path[0].clone();
        this.updateDirectionTowardTarget();
    }

    followPath(dt, world) {
        if (!this.hasPath()) {
            return false;
        }

        const target = this.path[this.pathIndex];
        const directionToTarget = target.clone().sub(this.container.position);
        directionToTarget.y = 0;

        const distanceToTarget = directionToTarget.length();
        if (distanceToTarget < 0.1) {
            this.pathIndex += 1;
            if (!this.hasPath()) {
                this.clearPath();
                return false;
            }

            this.pathTarget = this.path[this.pathIndex].clone();
            this.updateDirectionTowardTarget();
            return true;
        }

        const moveDistance = Math.min(this.walkSpeed * dt, distanceToTarget);
        const step = directionToTarget.normalize().multiplyScalar(moveDistance);
        const nextPosition = this.container.position.clone().add(step);

        if (this.isTreeBlockingAt(world, nextPosition.x, nextPosition.z)) {
            this.clearPath();
            return false;
        }

        if (!this.isPathSegmentClear(world, this.container.position, nextPosition)) {
            this.clearPath();
            return false;
        }

        this.container.position.copy(nextPosition);
        this.direction = directionToTarget.normalize();
        return true;
    }

    updateDirectionTowardTarget() {
        if (!this.pathTarget) {
            return;
        }

        this.direction = this.pathTarget.clone().sub(this.container.position);
        this.direction.y = 0;
        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
        }
    }

    isPathSegmentClear(world, from, to) {
        const samples = Math.max(2, Math.ceil(from.distanceTo(to)));

        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const sample = from.clone().lerp(to, t);
            const footprint = this.getColliderFootprint(sample.x, sample.z);

            for (const point of footprint) {
                if (!this.isWalkableAt(world, point.x, point.z)) {
                    return false;
                }
            }

            if (this.isTreeBlockingAt(world, sample.x, sample.z)) {
                return false;
            }
        }

        return true;
    }

    isWalkableAt(world, x, z) {
        const groundY = this.findGroundHeight(world, x, z);
        if (groundY === null) {
            return false;
        }

        const headRoomY = groundY + Math.max(1, Math.ceil(this.colliderHeight));
        const worldX = Math.floor(x);
        const worldZ = Math.floor(z);

        for (let y = groundY; y <= headRoomY; y++) {
            const block = world.getBlock(worldX, y, worldZ);
            if (block && this.isTreeBlock(block.id)) {
                return false;
            }

            if (block && block.id !== 0 && y > groundY && !this.isGroundBlock(block.id)) {
                return false;
            }
        }

        return true;
    }

    isTreeCollisionAhead(world) {
        const ahead = this.container.position.clone().addScaledVector(
            this.direction,
            Math.max(0.5, this.walkSpeed * 0.25),
        );

        return this.isTreeBlockingAt(world, ahead.x, ahead.z);
    }

    isTreeBlockingAt(world, x, z) {
        const minY = Math.max(0, Math.floor(this.container.position.y));
        const maxY = Math.min(
            (world.chunkSize?.height ?? 32) - 1,
            Math.ceil(this.container.position.y + this.colliderHeight),
        );

        for (const point of this.getColliderFootprint(x, z)) {
            const worldX = Math.floor(point.x);
            const worldZ = Math.floor(point.z);

            for (let y = minY; y <= maxY; y++) {
                const block = world.getBlock(worldX, y, worldZ);
                if (block && this.isTreeBlock(block.id)) {
                    return true;
                }
            }
        }

        return false;
    }

    getColliderFootprint(x, z) {
        const radius = Math.max(0.1, this.colliderRadius * 0.85);

        return [
            { x, z },
            { x: x + radius, z },
            { x: x - radius, z },
            { x, z: z + radius },
            { x, z: z - radius },
        ];
    }

    isTreeBlock(blockId) {
        return TREE_BLOCK_IDS.has(blockId);
    }

    isGroundBlock(blockId) {
        return !this.isTreeBlock(blockId) && blockId !== 0;
    }

    clampPointToRoamArea(point) {
        const offset = point.clone().sub(this.spawnPosition);
        offset.y = 0;

        if (offset.length() <= this.roamRadius) {
            return point;
        }

        offset.setLength(this.roamRadius);
        const clampedPoint = this.spawnPosition.clone().add(offset);
        clampedPoint.y = point.y;
        return clampedPoint;
    }

    pickWalkDirection() {
        const angle = Math.random() * Math.PI * 2;
        return new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
    }

    randomDirection() {
        return this.pickWalkDirection();
    }

    randomRange(range) {
        return range.min + Math.random() * (range.max - range.min);
    }
}