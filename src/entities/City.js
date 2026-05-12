/**
 * @file City.js
 * @description City entity. Tracks owner, position, evolution level,
 * population, food stockpile (for growth), and build queue placeholder.
 * @version 0.4.0
 */

import { CITY_LEVELS, popGrowthThreshold } from '../config/cityConfig.js';

export class City {
  /**
   * @param {Object} opts
   * @param {string} opts.id
   * @param {number} opts.playerIndex
   * @param {number} opts.q
   * @param {number} opts.r
   * @param {string} [opts.name]
   * @param {number} [opts.level=0]
   * @param {number} [opts.population=1]
   */
  constructor({ id, playerIndex, q, r, name = null, level = 0, population = 1 }) {
    this.id = id;
    this.playerIndex = playerIndex;
    this.q = q;
    this.r = r;
    this.name = name || City.generateName();
    this.level = level;
    this.population = population;
    this.foodStockpile = 0;
    this.productionQueue = []; // future: built units
    this.foundedTurn = 1;
  }

  /** Current level config block. */
  get config() {
    return CITY_LEVELS[this.level];
  }

  /** Next level config, or null at max. */
  get nextLevelConfig() {
    return this.level < CITY_LEVELS.length - 1 ? CITY_LEVELS[this.level + 1] : null;
  }

  /** Food needed for the next population increase. */
  get nextGrowthAt() {
    return popGrowthThreshold(this.population);
  }

  /** Can this city evolve to the next level right now (pop check only)? */
  canEvolvePop() {
    const next = this.nextLevelConfig;
    return next !== null && this.population >= next.popRequired;
  }

  toJSON() {
    return {
      id: this.id,
      playerIndex: this.playerIndex,
      q: this.q,
      r: this.r,
      name: this.name,
      level: this.level,
      population: this.population,
      foodStockpile: this.foodStockpile,
      productionQueue: [...this.productionQueue],
      foundedTurn: this.foundedTurn
    };
  }

  static fromJSON(json) {
    const c = new City({
      id: json.id,
      playerIndex: json.playerIndex,
      q: json.q,
      r: json.r,
      name: json.name,
      level: json.level,
      population: json.population
    });
    c.foodStockpile = json.foodStockpile || 0;
    c.productionQueue = json.productionQueue || [];
    c.foundedTurn = json.foundedTurn || 1;
    return c;
  }

  /** Pick a plausible Bronze-Age sounding name. */
  static generateName() {
    const names = [
      'Ur', 'Lagash', 'Eridu', 'Uruk', 'Nippur', 'Kish', 'Akkad', 'Mari',
      'Ebla', 'Byblos', 'Tyre', 'Sidon', 'Memphis', 'Thebes', 'Knossos',
      'Mycenae', 'Hattusa', 'Babylon', 'Susa', 'Anshan', 'Harappa',
      'Mohenjo', 'Lothal', 'Avaris', 'Pylos', 'Troy', 'Carchemish'
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
}
