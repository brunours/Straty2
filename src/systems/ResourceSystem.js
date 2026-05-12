/**
 * @file ResourceSystem.js
 * @description Computes per-turn resource income from each city's territory
 * and credits the owning player.
 * @version 0.4.0
 */

import { GameState } from '../core/GameState.js';
import { HexGrid } from '../core/HexGrid.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import {
  TILE_YIELD, RIVER_FOOD_BONUS, RESOURCE_NODE_BONUS, CITY_LEVELS
} from '../config/cityConfig.js';
import { TERRAIN } from '../config/constants.js';

export class ResourceSystem {
  /**
   * Compute the income for a single city this turn.
   * @param {Object} city
   * @returns {{wood:number, stone:number, food:number, metal:number, tiles:Array<{q:number,r:number,yield:object}>}}
   */
  static computeCityIncome(city) {
    const total = { wood: 0, stone: 0, food: 0, metal: 0 };
    const tilesDetail = [];
    const level = CITY_LEVELS[city.level];

    // Base income (represents food/wood/etc the city center always produces)
    for (const k of Object.keys(level.baseIncome)) {
      total[k] += level.baseIncome[k];
    }

    // Tile yields inside territory radius (excluding center which is the city itself)
    const tiles = HexGrid.hexSpiral(city.q, city.r, level.territoryRadius);
    for (const t of tiles) {
      const hex = GameState.hexMap?.getHex(t.q, t.r);
      if (!hex) continue;

      // Skip tiles owned by another city
      const otherCity = GameState.getCityAt(t.q, t.r);
      if (otherCity && otherCity.id !== city.id) continue;

      const yieldFor = TILE_YIELD[hex.terrain] || {};
      const tileYield = { ...yieldFor };

      // River bonus on grassland
      if (hex.hasRiver && hex.terrain === TERRAIN.GRASSLAND) {
        tileYield.food = (tileYield.food || 0) + RIVER_FOOD_BONUS;
      }

      // Resource node bonus matches node type
      if (hex.hasResource && hex.resourceType) {
        tileYield[hex.resourceType] = (tileYield[hex.resourceType] || 0) + RESOURCE_NODE_BONUS;
      }

      for (const k of Object.keys(tileYield)) {
        if (total[k] !== undefined) total[k] += tileYield[k];
      }
      tilesDetail.push({ q: t.q, r: t.r, yield: tileYield });
    }

    return { ...total, tiles: tilesDetail };
  }

  /**
   * Apply income for every city owned by a player. Returns aggregate gain.
   * @param {number} playerIndex
   */
  static applyTurnIncome(playerIndex) {
    const player = GameState.getPlayer(playerIndex);
    if (!player) return null;

    const gain = { wood: 0, stone: 0, food: 0, metal: 0 };
    const cities = GameState.getPlayerCities(playerIndex);

    for (const city of cities) {
      const inc = ResourceSystem.computeCityIncome(city);
      gain.wood  += inc.wood;
      gain.stone += inc.stone;
      gain.metal += inc.metal;

      // Food is split: half goes to player stockpile, half feeds city growth
      const cityFoodShare = Math.ceil(inc.food / 2);
      const playerFoodShare = inc.food - cityFoodShare;
      city.foodStockpile += cityFoodShare;
      gain.food += playerFoodShare;
    }

    player.addResources(gain);
    EventBus.emit(EVENTS.RESOURCE_CHANGED, { playerIndex, gain });
    return gain;
  }
}
