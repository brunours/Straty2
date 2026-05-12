/**
 * @file UpgradeCityCommand.js
 * @description Attempts to evolve a city to its next level, paying resources.
 * @version 0.4.0
 */

import { Command } from '../Command.js';
import { GameState } from '../GameState.js';
import { CityGrowthSystem } from '../../systems/CityGrowthSystem.js';

export class UpgradeCityCommand extends Command {
  /**
   * @param {string} cityId
   */
  constructor(cityId) {
    super();
    this.cityId = cityId;
  }

  execute() {
    const city = GameState.cities.get(this.cityId);
    if (!city) return false;
    return CityGrowthSystem.tryEvolve(city);
  }

  toString() {
    return `UpgradeCity(city=${this.cityId})`;
  }
}
