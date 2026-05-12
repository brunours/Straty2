/**
 * @file CityFoundingSystem.js
 * @description Logic for founding a new city from a Settler unit and for
 * picking suitable starting locations for the initial spawn.
 * @version 0.4.0
 */

import { GameState } from '../core/GameState.js';
import { HexGrid } from '../core/HexGrid.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { TERRAIN } from '../config/constants.js';
import { City } from '../entities/City.js';

/** Cities must be at least this many hexes apart. */
const MIN_CITY_DISTANCE = 3;

export class CityFoundingSystem {
  /**
   * Whether the given hex is a valid place to found a city.
   * @param {number} q
   * @param {number} r
   * @returns {boolean}
   */
  static canFoundCity(q, r) {
    const hex = GameState.hexMap?.getHex(q, r);
    if (!hex) return false;
    if (hex.terrain === TERRAIN.OCEAN || hex.terrain === TERRAIN.MOUNTAIN) return false;
    if (hex.cityId) return false;

    // Check distance from existing cities
    for (const city of GameState.cities.values()) {
      if (HexGrid.hexDistance(q, r, city.q, city.r) < MIN_CITY_DISTANCE) return false;
    }
    return true;
  }

  /**
   * Found a city on the given hex for the player. Returns the created city
   * or null if invalid.
   * @param {number} playerIndex
   * @param {number} q
   * @param {number} r
   * @param {Object} [opts]
   * @param {string} [opts.consumeUnitId] - If provided, this unit is removed
   * @returns {City|null}
   */
  static foundCity(playerIndex, q, r, opts = {}) {
    if (!CityFoundingSystem.canFoundCity(q, r)) return null;

    const id = GameState.generateCityId();
    const city = new City({ id, playerIndex, q, r });
    city.foundedTurn = GameState.turnNumber;

    GameState.addCity(city);

    if (opts.consumeUnitId) {
      GameState.removeUnit(opts.consumeUnitId);
    }

    const player = GameState.getPlayer(playerIndex);
    if (player) player.stats.citiesFounded += 1;

    EventBus.emit(EVENTS.CITY_FOUNDED, { city });
    return city;
  }

  /**
   * Find a good starting hex for a player. Tries to spread players out
   * by maximizing distance from any already-placed start hex.
   * @param {Array<{q:number,r:number}>} existingStarts
   * @returns {{q:number,r:number}|null}
   */
  static findStartHex(existingStarts) {
    const map = GameState.hexMap;
    if (!map) return null;

    let best = null;
    let bestScore = -Infinity;

    // Sample candidates: any passable, non-mountain, non-coastal-edge hex
    const candidates = [];
    map.forEachHex((hex) => {
      if (hex.terrain === TERRAIN.OCEAN || hex.terrain === TERRAIN.MOUNTAIN) return;
      if (hex.cityId) return;
      // Prefer grassland / hills / forest
      if (hex.terrain === TERRAIN.SWAMP || hex.terrain === TERRAIN.DESERT) return;
      candidates.push(hex);
    });

    if (candidates.length === 0) {
      // Fall back to any passable hex
      map.forEachHex((hex) => {
        if (hex.terrain !== TERRAIN.OCEAN && hex.terrain !== TERRAIN.MOUNTAIN && !hex.cityId) {
          candidates.push(hex);
        }
      });
    }

    if (candidates.length === 0) return null;

    // Score: prefer high-yield interior tiles, farther from other starts
    const cx = map.cols / 2;
    const cy = map.rows / 2;

    for (const hex of candidates) {
      let score = 0;
      // Distance from other starts (biggest weight)
      let minDist = Infinity;
      for (const s of existingStarts) {
        const d = HexGrid.hexDistance(hex.q, hex.r, s.q, s.r);
        if (d < minDist) minDist = d;
      }
      if (existingStarts.length === 0) minDist = 0;
      score += minDist * 10;

      // Slight pull toward map center (avoid edges)
      const distFromCenter = Math.hypot(hex.q - cx, hex.r - cy);
      score -= distFromCenter * 0.5;

      // Hex preference: grassland > hills > forest > others
      if (hex.terrain === TERRAIN.GRASSLAND) score += 5;
      else if (hex.terrain === TERRAIN.HILLS) score += 3;
      else if (hex.terrain === TERRAIN.FOREST) score += 2;

      if (hex.hasRiver) score += 3;

      // Small random jitter so picks aren't deterministic
      score += Math.random() * 2;

      if (score > bestScore) {
        bestScore = score;
        best = { q: hex.q, r: hex.r };
      }
    }

    return best;
  }
}
