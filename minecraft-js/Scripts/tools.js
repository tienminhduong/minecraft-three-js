/**
 * Tool definitions and requirements system
 */

export const TOOL_TYPES = {
    HAND: { id: 0, name: "Hand", level: 0 },
    WOODEN_PICKAXE: { id: 1, name: "Wooden Pickaxe", level: 1 },
    STONE_PICKAXE: { id: 2, name: "Stone Pickaxe", level: 2 },
    IRON_PICKAXE: { id: 3, name: "Iron Pickaxe", level: 3 },
    DIAMOND_PICKAXE: { id: 4, name: "Diamond Pickaxe", level: 4 },
};

/**
 * Defines what tools are needed to break each block
 * Most blocks are breakable with hand, only special ones need specific tools
 */
export const BLOCK_TOOL_REQUIREMENTS = {
    // Block ID: { requiredLevel, toolType, harvestTicks }
    0: { level: 0, toolType: "any", harvestTicks: 0 }, // empty - cannot break
    1: { level: 0, toolType: "any", harvestTicks: 0.3 }, // grass - hand/any
    2: { level: 0, toolType: "any", harvestTicks: 0.3 }, // dirt - hand/any
    3: { level: 0, toolType: "any", harvestTicks: 1 }, // stone - hand/any (slower)
    4: { level: 0, toolType: "any", harvestTicks: 0.5 }, // coal ore - hand/any
    5: { level: 0, toolType: "any", harvestTicks: 0.5 }, // iron ore - hand/any
    6: { level: 0, toolType: "any", harvestTicks: 0.3 }, // tree - hand/any
    7: { level: 0, toolType: "any", harvestTicks: 0.2 }, // leaves - hand/any
    8: { level: 0, toolType: "any", harvestTicks: 0.3 }, // sand - hand/any
    9: { level: 0, toolType: "any", harvestTicks: 0 }, // cloud - hand/any
    10: { level: 0, toolType: "any", harvestTicks: 0.3 }, // snow - hand/any
    11: { level: 0, toolType: "any", harvestTicks: 0.3 }, // cactus - hand/any
    12: { level: 0, toolType: "any", harvestTicks: 0.2 }, // jungle leaves - hand/any
    13: { level: 0, toolType: "any", harvestTicks: 0.3 }, // jungle tree - hand/any
    14: { level: 0, toolType: "any", harvestTicks: 1 }, // cobblestone - hand/any (slower)
};

export class ToolManager {
    constructor() {
        this.currentTool = TOOL_TYPES.HAND;
        this.tools = new Map();
        this.initializeTools();
    }

    /**
     * Initialize available tools
     */
    initializeTools() {
        // Add all tool types
        for (const [key, tool] of Object.entries(TOOL_TYPES)) {
            this.tools.set(tool.id, tool);
        }
    }

    /**
     * Set the currently equipped tool
     * @param {number} toolId
     */
    setCurrentTool(toolId) {
        if (this.tools.has(toolId)) {
            this.currentTool = this.tools.get(toolId);
            console.log(`Tool changed to: ${this.currentTool.name}`);
            return true;
        }
        return false;
    }

    /**
     * Get the current tool
     * @returns {Object} current tool
     */
    getCurrentTool() {
        return this.currentTool;
    }

    /**
     * Check if the current tool can break a block
     * Most blocks can be broken with hand or any tool
     * @param {number} blockId
     * @returns {Object} { canBreak: boolean, reason: string }
     */
    canBreakBlock(blockId) {
        const requirement = BLOCK_TOOL_REQUIREMENTS[blockId];
        if (!requirement) {
            return { canBreak: false, reason: "Unknown block type" };
        }

        // All blocks are breakable (no level requirements anymore)
        return { canBreak: true, reason: "OK" };
    }

    /**
     * Get harvest time for a block
     * @param {number} blockId
     * @returns {number} harvest time in seconds
     */
    getHarvestTime(blockId) {
        const requirement = BLOCK_TOOL_REQUIREMENTS[blockId];
        if (!requirement) return 1;

        let harvestTime = requirement.harvestTicks || 1;

        // Reduce harvest time based on tool level
        // Using a 30x multiplier when tool level matches
        if (this.currentTool.level >= (requirement.level || 0)) {
            harvestTime *= 0.3; // 30x faster with correct tool
        }

        return harvestTime;
    }

    /**
     * Get the minimum tool required for a block
     * @param {number} blockId
     * @returns {Object|null} required tool or null if no specific tool needed
     */
    getRequiredTool(blockId) {
        const requirement = BLOCK_TOOL_REQUIREMENTS[blockId];
        if (!requirement || requirement.level === 0) {
            return null;
        }

        // Find the tool with matching level
        for (const tool of this.tools.values()) {
            if (tool.level === requirement.level) {
                return tool;
            }
        }

        return null;
    }

    /**
     * Get all tools with a specific tool type
     * @param {string} toolType (pickaxe, axe, shovel)
     * @returns {Array} array of tools
     */
    getToolsByType(toolType) {
        const result = [];
        for (const tool of this.tools.values()) {
            if (tool.name.toLowerCase().includes(toolType.toLowerCase())) {
                result.push(tool);
            }
        }
        return result;
    }

    /**
     * Upgrade to the next available tool
     * @returns {boolean} true if upgraded
     */
    upgradeToNextTool() {
        const currentLevel = this.currentTool.level;
        const nextToolEntry = Array.from(this.tools.entries()).find(
            ([_, tool]) => tool.level === currentLevel + 1
        );

        if (nextToolEntry) {
            this.setCurrentTool(nextToolEntry[0]);
            return true;
        }

        return false;
    }

    /**
     * Get tool information for display
     * @returns {Object}
     */
    getToolInfo() {
        return {
            name: this.currentTool.name,
            level: this.currentTool.level,
            id: this.currentTool.id,
        };
    }
}
