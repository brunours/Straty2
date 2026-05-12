/**
 * @file CityGrowthSystem.js
 * @description Per-turn city population growth and optional auto-evolution.
 * Pop grows when foodStockpile crosses the next threshold. Evolution
 * remains a player-driven action (resource cost), but population can
 * grow up to the level's maxPop.
 * @version 0.4.0
 */

import { GameState } from '../core/GameState.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { CITY_LEVELS, popGrowthThreshold } from '../config/cityConfig.js';

export class CityGrowthSystem {
  /**
   * Process growth for all cities owned by a player.
   * @param {number} playerIndex
   */
  static processPlayer(playerIndex) {
    const cities = GameState.getPlayerCities(playerIndex);
    for (const city of cities) {
      CityGrowthSystem.processCity(city);
    }
  }

  /**
   * Process growth for a single city. May raise pop by 1 (or more if
   * the stockpile has overflowed several thresholds — rare, but valid).
   * @param {Object} city
   */
  static processCity(city) {
    const level = CITY_LEVELS[city.level];
    if (!level) return;

    while (city.population < level.maxPop) {
      const threshold = popGrowthThreshold(city.population) * level.growthMultiplier;
      if (city.foodStockpile < threshold) break;
      city.foodStockpile -= threshold;
      city.population += 1;
      EventBus.emit(EVENTS.CITY_EVOLVED, { city, kind: 'pop', newPop: city.population });
    }

    // Cap food stockpile at twice the next threshold so it doesn't grow unbounded
    const cap = popGrowthThreshold(city.population) * 2;
    if (city.foodStockpile > cap) city.foodStockpile = cap;
  }

  /**
   * Attempt to evolve a city to the next level. Spends player resources
   * if the requirements are met.
   * @param {Object} city
   * @returns {boolean} success
   */
  static tryEvolve(city) {
    const next = CITY_LEVELS[city.level + 1];
    if (!next) return false;
    if (city.population < next.popRequired) return false;

    const player = GameState.getPlayer(city.playerIndex);
    if (!player || !player.spendResources(next.upgradeCost)) return false;

    city.level += 1;
    EventBus.emit(EVENTS.CITY_EVOLVED, { city, kind: 'level', newLevel: city.level });
    EventBus.emit(EVENTS.RESOURCE_CHANGED, { playerIndex: player.index });
    return true;
  }
}
