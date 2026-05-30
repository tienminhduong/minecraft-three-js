export class DataStore {
  constructor() {
    this.data = {};
    this.STORAGE_KEY_WORLD = 'minecraft_world_data';
    this.STORAGE_KEY_PLAYER = 'minecraft_player_data';
  }

  clear() {
    this.data = {};
  }

  contains(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    return this.data[key] !== undefined;
  }

  get(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    const blockId = this.data[key];
    console.log(`getting value ${blockId} at key ${key}`);
    return blockId;
  }

  set(chunkX, chunkZ, blockX, blockY, blockZ, blockId) {
    const key = this.#getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    this.data[key] = blockId;
    console.log(`setting key ${key} to ${blockId}`)
  }

  #getKey(chunkX, chunkZ, blockX, blockY, blockZ) {
    return `${chunkX},${chunkZ},${blockX},${blockY},${blockZ}`;
  }

  /**
   * Save world data to localStorage
   * @returns {boolean} true if save was successful
   */
  saveToLocalStorage() {
    try {
      const worldData = JSON.stringify(this.data);
      localStorage.setItem(this.STORAGE_KEY_WORLD, worldData);
      console.log('World data saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save world data:', error);
      return false;
    }
  }

  /**
   * Load world data from localStorage
   * @returns {boolean} true if load was successful
   */
  loadFromLocalStorage() {
    try {
      const worldData = localStorage.getItem(this.STORAGE_KEY_WORLD);
      if (worldData) {
        this.data = JSON.parse(worldData);
        console.log('World data loaded successfully');
        return true;
      } else {
        console.log('No saved world data found');
        return false;
      }
    } catch (error) {
      console.error('Failed to load world data:', error);
      return false;
    }
  }

  /**
   * Save player state (position, selected hotbar slot, activeBlockId, etc.)
   * @param {THREE.Vector3} playerPosition
   * @param {number} activeBlockId
   * @param {number} selectedSlot
   * @returns {boolean} true if save was successful
   */
  savePlayerState(playerPosition, activeBlockId, selectedSlot = 0) {
    try {
      const playerData = {
        position: {
          x: playerPosition.x,
          y: playerPosition.y,
          z: playerPosition.z,
        },
        activeBlockId: activeBlockId,
        selectedSlot: selectedSlot,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY_PLAYER, JSON.stringify(playerData));
      console.log('Player state saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save player state:', error);
      return false;
    }
  }

  /**
   * Load player state from localStorage
   * @returns {Object|null} player state object or null if not found
   */
  loadPlayerState() {
    try {
      const playerData = localStorage.getItem(this.STORAGE_KEY_PLAYER);
      if (playerData) {
        const state = JSON.parse(playerData);
        console.log('Player state loaded successfully');
        return state;
      } else {
        console.log('No saved player state found');
        return null;
      }
    } catch (error) {
      console.error('Failed to load player state:', error);
      return null;
    }
  }

  /**
   * Clear all saved data from localStorage
   */
  clearAllData() {
    try {
      localStorage.removeItem(this.STORAGE_KEY_WORLD);
      localStorage.removeItem(this.STORAGE_KEY_PLAYER);
      this.data = {};
      console.log('All data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  /**
   * Get storage info (size, saved world exists, etc.)
   * @returns {Object} storage info object
   */
  getStorageInfo() {
    const hasWorld = !!localStorage.getItem(this.STORAGE_KEY_WORLD);
    const hasPlayer = !!localStorage.getItem(this.STORAGE_KEY_PLAYER);
    const worldSize = localStorage.getItem(this.STORAGE_KEY_WORLD)?.length || 0;
    const playerSize = localStorage.getItem(this.STORAGE_KEY_PLAYER)?.length || 0;
    const totalSize = worldSize + playerSize;

    return {
      hasWorld,
      hasPlayer,
      worldSize,
      playerSize,
      totalSize,
    };
  }
}
