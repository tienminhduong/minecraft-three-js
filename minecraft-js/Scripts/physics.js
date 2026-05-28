import * as THREE from 'three';

export class Physics {
    constructor() {
    }

    update(dt, player, world) {
        this.detectCollisions(player, world);
    }

    detectCollisions(player, world) {
        const candidates = this.boardPhase(player, world);
        const collisions = this.narrowPhase(player, candidates);

        if (collisions.length > 0) {
            this.resolveCollisions(player, collisions);
        }
    }

    boardPhase(player, world) {
        const playerBlockPos = {
            x: Math.floor(player.position.x),
            y: Math.floor(player.position.y),
            z: Math.floor(player.position.z)
        };

        // Get the block extents of the player
        const minX = Math.floor(player.position.x - player.radius);
        const maxX = Math.ceil(player.position.x + player.radius);
        const minY = Math.floor(player.position.y - player.height);
        const maxY = Math.ceil(player.position.y);
        const minZ = Math.floor(player.position.z - player.radius);
        const maxZ = Math.ceil(player.position.z + player.radius);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const blockId = world.getBlock(x, y, z)?.id;
                    if (blockId && blockId !== blocks.empty.id) {
                        const block = { x, y, z };
                        candidates.push(block);
                        this.addCollisionHelper(block);
                    }
                }
            }
        }

        return candidates;
    }

    narrowPhase(player, candidates) {
        const collisions = [];

        for (const block of candidates) {
            const closestPoint = {
                x: Math.max(block.x - 0.5, Math.min(player.position.x, block.x + 0.5)),
                y: Math.max(block.y - 0.5, Math.min(player.position.y - (player.height / 2), block.y + 0.5)),
                z: Math.max(block.z - 0.5, Math.min(player.position.z, block.z + 0.5))
            };

            const dx = closestPoint.x - player.position.x;
            const dy = closestPoint.y - (player.position.y - (player.height / 2));
            const dz = closestPoint.z - player.position.z;
        }

        if (this.pointInPlayerBoundingCylinder(closestPoint, player)) {
            const overlapY = (player.height / 2) - Math.abs(dy);
            const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);

            // Compute the normal of the collision (pointing away from the contact point)
            // and the overlap between the point and the player's bounding cylinder
            let normal, overlap;
            if (overlapY < overlapXZ) {
                normal = new THREE.Vector3(0, -Math.sign(dy), 0);
                overlap = overlapY;
                player.onGround = true;
            } else {
                normal = new THREE.Vector3(-dx, 0, -dz).normalize();
                overlap = overlapXZ;
            }
            collisions.push({
                block,
                contactPoint: closestPoint,
                normal,
                overlap
            });

            this.addContactPointerHelper(closestPoint);
        }

        return collisions;
    }

    resolveCollisions(player, collisions) {
        collisions.sort((a, b) => {
            return a.overlap < b.overlap;
        });

        // for (const collision of collisions) {
        //     if (!this.pointInPlayerBoundingCylinder(collision.contactPoint, player)) continue;

        //     let deltaPosition = collision.normal.clone();
        //     deltaPosition.multiplyScalar(collision.overlap);
        //     player.position.add(deltaPosition);

        //     let magnitude = player.worldVelocity.dot(collision.normal);
        //     // Remove that part of the velocity from the player's velocity
        //     let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude);

        //     player.applyWorldDeltaVelocity(velocityAdjustment.negate());
        // }
    }

    addCollisionHelper(block) {
        const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
        blockMesh.position.copy(block);
        this.helpers.add(blockMesh);
    }

    addContactPointerHelper(p) {
        const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial);
        contactMesh.position.copy(p);
        this.helpers.add(contactMesh);
    }
}