/**
 * @file Player.js
 * @description Player entity. Holds name, color, AI flag, resources,
 * research progress, and a list of owned city/unit IDs.
 * @version 0.4.0
 */

import { PLAYER_PALETTE } from '../config/palette.js';

export class Player {
  /**
   * @param {Object} opts
   * @param {number} opts.index - Player slot index (0..7)
   * @param {string} opts.name
   * @param {boolean} [opts.isAI=false]
   * @param {string} [opts.aiDifficulty='MEDIUM']
   * @param {number} [opts.color] - 0xRRGGBB; defaults to PLAYER_PALETTE[index]
   */
  constructor({ index, name, isAI = false, aiDifficulty = 'MEDIUM', color = null }) {
    this.index = index;
    this.name = name;
    this.isAI = isAI;
    this.aiDifficulty = aiDifficulty;
    this.color = color !== null ? color : PLAYER_PALETTE[index % PLAYER_PALETTE.length];
    this.resources = { wood: 10, stone: 5, food: 50, metal: 0 };
    this.researchedTechs = new Set();
    this.currentResearch = null;
    this.researchProgress = 0;
    this.eliminated = false;

    // Stats (also tracked for Phase 9 dashboards)
    this.stats = {
      citiesFounded: 0,
      citiesCaptured: 0,
      citiesLost: 0,
      unitsBuilt: 0,
      unitsKilled: 0,
      unitsLost: 0,
      resourcesGathered: 0
    };
  }

  /**
   * Add resources, clamping to >= 0.
   * @param {{wood?:number, stone?:number, food?:number, metal?:number}} delta
   */
  addResources(delta) {
    for (const k of ['wood', 'stone', 'food', 'metal']) {
      if (delta[k] !== undefined) {
        this.resources[k] = Math.max(0, this.resources[k] + delta[k]);
        if (delta[k] > 0) this.stats.resourcesGathered += delta[k];
      }
    }
  }

  /**
   * Try to spend resources. Returns true if all costs were paid.
   * @param {{wood?:number, stone?:number, food?:number, metal?:number}} cost
   * @returns {boolean}
   */
  spendResources(cost) {
    for (const k of ['wood', 'stone', 'food', 'metal']) {
      if ((cost[k] || 0) > (this.resources[k] || 0)) return false;
    }
    for (const k of ['wood', 'stone', 'food', 'metal']) {
      this.resources[k] -= (cost[k] || 0);
    }
    return true;
  }

  /**
   * Check whether the player can afford a cost without spending.
   * @param {{wood?:number, stone?:number, food?:number, metal?:number}} cost
   * @returns {boolean}
   */
  canAfford(cost) {
    for (const k of ['wood', 'stone', 'food', 'metal']) {
      if ((cost[k] || 0) > (this.resources[k] || 0)) return false;
    }
    return true;
  }

  /** JSON-safe snapshot for save/load. */
  toJSON() {
    return {
      index: this.index,
      name: this.name,
      isAI: this.isAI,
      aiDifficulty: this.aiDifficulty,
      color: this.color,
      resources: { ...this.resources },
      researchedTechs: Array.from(this.researchedTechs),
      currentResearch: this.currentResearch,
      researchProgress: this.researchProgress,
      eliminated: this.eliminated,
      stats: { ...this.stats }
    };
  }

  static fromJSON(json) {
    const p = new Player({
      index: json.index,
      name: json.name,
      isAI: json.isAI,
      aiDifficulty: json.aiDifficulty,
      color: json.color
    });
    p.resources = { ...json.resources };
    p.researchedTechs = new Set(json.researchedTechs || []);
    p.currentResearch = json.currentResearch || null;
    p.researchProgress = json.researchProgress || 0;
    p.eliminated = !!json.eliminated;
    if (json.stats) p.stats = { ...p.stats, ...json.stats };
    return p;
  }
}
