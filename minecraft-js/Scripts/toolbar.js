import { blocks } from "./blocks";
import { TOOL_TYPES } from "./tools";

export const HOTBAR_ITEM_TYPES = {
    BLOCK: "block",
    TOOL: "tool",
};

const BLOCK_TEXTURES = {
    [blocks.grass.id]: "grass.png",
    [blocks.dirt.id]: "dirt.png",
    [blocks.stone.id]: "stone.png",
    [blocks.sand.id]: "sand.png",
    [blocks.snow.id]: "snow.png",
    [blocks.cactus.id]: "cactus_top.png",
    [blocks.tree.id]: "tree_side.png",
    [blocks.leaves.id]: "leaves.png",
};

function blockItem(blockId) {
    return {
        type: HOTBAR_ITEM_TYPES.BLOCK,
        blockId,
        texture: BLOCK_TEXTURES[blockId],
        label: blocks.names[blockId] ?? "Block",
    };
}

function toolItem(tool) {
    return {
        type: HOTBAR_ITEM_TYPES.TOOL,
        toolId: tool.id,
        texture: "pickaxe.png",
        label: tool.name,
    };
}

/**
 * Toolbar UI management for displaying and switching between tools/blocks
 */
export class Toolbar {
    constructor(player = null) {
        this.player = player;
        this.hotbarSize = 9;
        this.selectedSlot = 0;
        this.items = [
            blockItem(blocks.grass.id),
            blockItem(blocks.dirt.id),
            blockItem(blocks.stone.id),
            blockItem(blocks.sand.id),
            blockItem(blocks.snow.id),
            blockItem(blocks.cactus.id),
            blockItem(blocks.tree.id),
            blockItem(blocks.leaves.id),
            toolItem(TOOL_TYPES.STONE_PICKAXE),
        ];
        
        this.createHotbarUI();
    }

    /**
     * Creates the HTML UI for the toolbar
     */
    createHotbarUI() {
        // Create hotbar container
        const hotbar = document.createElement('div');
        hotbar.id = 'hotbar';
        hotbar.className = 'hotbar';
        
        // Create slots with block textures
        for (let i = 0; i < this.hotbarSize; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.id = `slot-${i}`;
            slot.dataset.slotIndex = i;
            
            const item = this.items[i];
            const texturePath = item.texture || "grass.png";
            const textureClass =
                item.type === HOTBAR_ITEM_TYPES.TOOL ? " tool-texture" : "";
            slot.title = item.label;
            
            // Add texture background and slot number
            slot.innerHTML = `<div class="slot-texture${textureClass}" style="background-image: url('/textures/${texturePath}')"></div><span class="slot-label">${i + 1}</span>`;
            
            // Add click handler
            slot.addEventListener('click', () => {
                this.selectSlot(i);
            });
            
            hotbar.appendChild(slot);
        }
        
        // Add to DOM
        const infoDiv = document.getElementById('info');
        infoDiv.insertBefore(hotbar, infoDiv.firstChild);
        
        // Select first slot initially
        this.selectSlot(0, { notify: false });
    }

    /**
     * Get the block name from block ID
     */
    getBlockName(blockId) {
        for (const [key, block] of Object.entries(blocks)) {
            if (block.id === blockId) {
                return block.name.charAt(0).toUpperCase() + block.name.slice(1);
            }
        }
        return 'Unknown';
    }

    /**
     * Select a hotbar slot
     */
    selectSlot(slotIndex, options) {
        return this.#selectSlot(slotIndex, options);
    }

    #selectSlot(slotIndex, { notify = true } = {}) {
        if (slotIndex < 0 || slotIndex >= this.hotbarSize) {
            return this.getSelectedItem();
        }
        
        // Remove previous selection
        const prevSlot = document.getElementById(`slot-${this.selectedSlot}`);
        if (prevSlot) {
            prevSlot.classList.remove('selected');
        }
        
        // Add selection to new slot
        this.selectedSlot = slotIndex;
        const newSlot = document.getElementById(`slot-${this.selectedSlot}`);
        if (newSlot) {
            newSlot.classList.add('selected');
        }

        if (notify && this.player) {
            this.player.equipHotbarItem(this.getSelectedItem());
        }
        
        // Update player's active block
        return this.getSelectedItem();
    }

    /**
     * Get the currently selected block ID
     */
    getSelectedBlockId() {
        const item = this.getSelectedItem();
        return item?.type === HOTBAR_ITEM_TYPES.BLOCK
            ? item.blockId
            : blocks.empty.id;
    }

    /**
     * Get the currently selected hotbar item
     */
    getSelectedItem() {
        return this.items[this.selectedSlot];
    }

    /**
     * Find the first slot containing the specified block.
     */
    findSlotByBlockId(blockId) {
        const slotIndex = this.items.findIndex((item) => {
            return item.type === HOTBAR_ITEM_TYPES.BLOCK && item.blockId === blockId;
        });
        return slotIndex === -1 ? 0 : slotIndex;
    }

    /**
     * Get the currently selected block
     */
    getSelectedBlock() {
        const blockId = this.getSelectedBlockId();
        for (const [key, block] of Object.entries(blocks)) {
            if (block.id === blockId) {
                return block;
            }
        }
        return blocks.empty;
    }

    /**
     * Switch to next slot
     */
    nextSlot() {
        const next = (this.selectedSlot + 1) % this.hotbarSize;
        return this.selectSlot(next);
    }

    /**
     * Switch to previous slot
     */
    prevSlot() {
        const prev = (this.selectedSlot - 1 + this.hotbarSize) % this.hotbarSize;
        return this.selectSlot(prev);
    }

    /**
     * Update hotbar display
     */
    update() {
        // Update any dynamic UI changes here
    }
}
