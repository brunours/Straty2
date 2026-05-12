/**
 * @file FoundCityCommand.js
 * @description Consumes a Settler unit to found a new city on its hex.
 * @version 0.4.0
 */

import { Command } from '../Command.js';
import { GameState } from '../GameState.js';
import { CityFoundingSystem } from '../../systems/CityFoundingSystem.js';

export class FoundCityCommand extends Command {
  /**
   * @param {string} unitId - The Settler to consume
   */
  constructor(unitId) {
    super();
    this.unitId = unitId;
    this.cityCreated = null;
  }

  execute() {
    const unit = GameState.units.get(this.unitId);
    if (!unit || !unit.canFoundCity) return false;
    if (unit.hasActed) return false;

    const city = CityFoundingSystem.foundCity(
      unit.playerIndex, unit.q, unit.r,
      { consumeUnitId: unit.id }
    );
    if (!city) return false;

    this.cityCreated = city.id;
    return true;
  }

  toString() {
    return `FoundCity(unit=${this.unitId})`;
  }
}
