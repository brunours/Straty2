/**
 * @file GameState.js
 * @description Central game state singleton. Single source of truth for all
 * game data: map, players, units, cities, settings, turn info.
 * @version 0.4.0
 */

import { HexMap } from './HexMap.js';
import { Player } from '../entities/Player.js';
import { City } from '../entities/City.js';
import { Unit } from '../entities/Unit.js';

class GameStateClass {
  constructor() {
    this.reset();
  }

  /**
   * Reset state to defaults. Called before starting a new game.
   */
  reset() {
    /** @type {HexMap|null} */
    this.hexMap = null;

    /** @type {Array<Player>} */
    this.players = [];

    /** @type {number} Index into players array for whose turn it is */
    this.currentPlayerIndex = 0;

    /** @type {number} Current turn number (starts at 1) */
    this.turnNumber = 1;

    /** @type {Map<string, Unit>} All units by ID */
    this.units = new Map();

    /** @type {Map<string, City>} All cities by ID */
    this.cities = new Map();

    /** @type {Object} Game settings from setup screen */
    this.settings = {
      mapSize: 'MEDIUM',
      fogMode: 'none',
      aiDifficulty: 'MEDIUM',
      playerSlots: [] // [{ name, isAI, color }, ...]
    };

    /** @type {string|null} Currently selected entity type: 'hex', 'unit', 'city' */
    this.selectionType = null;

    /** @type {Object|null} Currently selected entity data */
    this.selectionData = null;

    /** @type {boolean} Whether the game is in progress */
    this.isGameActive = false;

    /** @type {number} Next unit ID counter */
    this._nextUnitId = 1;

    /** @type {number} Next city ID counter */
    this._nextCityId = 1;
  }

  /** @returns {Player} */
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  /** @param {number} index */
  getPlayer(index) {
    return this.players[index];
  }

  generateUnitId() {
    return `u${this._nextUnitId++}`;
  }

  generateCityId() {
    return `c${this._nextCityId++}`;
  }

  /** @param {Unit} unit */
  addUnit(unit) {
    this.units.set(unit.id, unit);
    const hex = this.hexMap?.getHex(unit.q, unit.r);
    if (hex) hex.unitId = unit.id;
  }

  /** @param {string} unitId */
  removeUnit(unitId) {
    const unit = this.units.get(unitId);
    if (unit) {
      const hex = this.hexMap?.getHex(unit.q, unit.r);
      if (hex && hex.unitId === unitId) hex.unitId = null;
      this.units.delete(unitId);
    }
  }

  /** @param {City} city */
  addCity(city) {
    this.cities.set(city.id, city);
    const hex = this.hexMap?.getHex(city.q, city.r);
    if (hex) hex.cityId = city.id;
  }

  /** @param {string} cityId */
  removeCity(cityId) {
    const city = this.cities.get(cityId);
    if (city) {
      const hex = this.hexMap?.getHex(city.q, city.r);
      if (hex && hex.cityId === cityId) hex.cityId = null;
      this.cities.delete(cityId);
    }
  }

  /** @param {number} playerIndex */
  getPlayerUnits(playerIndex) {
    const result = [];
    this.units.forEach(unit => {
      if (unit.playerIndex === playerIndex) result.push(unit);
    });
    return result;
  }

  /** @param {number} playerIndex */
  getPlayerCities(playerIndex) {
    const result = [];
    this.cities.forEach(city => {
      if (city.playerIndex === playerIndex) result.push(city);
    });
    return result;
  }

  /**
   * Get the unit at a specific hex, if any.
   * @param {number} q
   * @param {number} r
   * @returns {Unit|null}
   */
  getUnitAt(q, r) {
    const hex = this.hexMap?.getHex(q, r);
    if (!hex || !hex.unitId) return null;
    return this.units.get(hex.unitId) || null;
  }

  /**
   * Get the city at a specific hex, if any.
   * @param {number} q
   * @param {number} r
   * @returns {City|null}
   */
  getCityAt(q, r) {
    const hex = this.hexMap?.getHex(q, r);
    if (!hex || !hex.cityId) return null;
    return this.cities.get(hex.cityId) || null;
  }

  /** Serialize game state for save/load. */
  toJSON() {
    return {
      turnNumber: this.turnNumber,
      currentPlayerIndex: this.currentPlayerIndex,
      settings: { ...this.settings },
      players: this.players.map(p => p.toJSON()),
      map: this.hexMap.toJSON(),
      units: Array.from(this.units.values()).map(u => u.toJSON()),
      cities: Array.from(this.cities.values()).map(c => c.toJSON()),
      nextUnitId: this._nextUnitId,
      nextCityId: this._nextCityId
    };
  }

  /** Load game state from JSON data. */
  fromJSON(json) {
    this.reset();
    this.turnNumber = json.turnNumber;
    this.currentPlayerIndex = json.currentPlayerIndex;
    this.settings = { ...json.settings };
    this.players = (json.players || []).map(p => Player.fromJSON(p));
    this.hexMap = HexMap.fromJSON(json.map);
    this._nextUnitId = json.nextUnitId || 1;
    this._nextCityId = json.nextCityId || 1;

    for (const u of json.units || []) {
      const unit = Unit.fromJSON(u);
      this.addUnit(unit);
    }

    for (const c of json.cities || []) {
      const city = City.fromJSON(c);
      this.addCity(city);
    }

    this.isGameActive = true;
  }
}

/** Singleton GameState instance */
export const GameState = new GameStateClass();
