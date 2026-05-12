/**
 * @file TurnManager.js
 * @description Manages turn sequencing: start turn processing, end turn,
 * advance to next player, trigger systems and AI turns.
 * @version 0.4.0
 */

import { GameState } from './GameState.js';
import { EventBus, EVENTS } from './EventBus.js';
import { ResourceSystem } from '../systems/ResourceSystem.js';
import { CityGrowthSystem } from '../systems/CityGrowthSystem.js';

export class TurnManager {
  constructor() {
    /** @type {boolean} Whether it's currently processing a turn transition */
    this._processing = false;
  }

  /**
   * Initialize a new game turn sequence (called at game start).
   */
  startGame() {
    GameState.isGameActive = true;
    GameState.turnNumber = 1;
    GameState.currentPlayerIndex = 0;

    EventBus.emit(EVENTS.GAME_STARTED, {
      turnNumber: GameState.turnNumber,
      playerIndex: GameState.currentPlayerIndex
    });

    this._startTurn();
  }

  /**
   * End the current player's turn and advance to the next.
   */
  endTurn() {
    if (this._processing) return;
    this._processing = true;

    const playerIndex = GameState.currentPlayerIndex;

    // Reset unit movement for current player
    GameState.getPlayerUnits(playerIndex).forEach(unit => {
      unit.hasMoved = false;
      unit.hasActed = false;
      unit.movementRemaining = unit.movement;
    });

    EventBus.emit(EVENTS.TURN_ENDED, {
      turnNumber: GameState.turnNumber,
      playerIndex
    });

    // Advance to next non-eliminated player
    const playerCount = GameState.players.length;
    let safety = playerCount + 1;
    do {
      GameState.currentPlayerIndex = (GameState.currentPlayerIndex + 1) % playerCount;
      if (GameState.currentPlayerIndex === 0) GameState.turnNumber++;
      safety--;
    } while (safety > 0 && GameState.getCurrentPlayer()?.eliminated);

    this._processing = false;
    this._startTurn();
  }

  /**
   * Process start-of-turn effects for the current player:
   *   1. Resource income from cities
   *   2. City population growth
   *   3. Reset movement on player units
   *   4. Emit TURN_STARTED
   * @private
   */
  _startTurn() {
    const playerIndex = GameState.currentPlayerIndex;
    const player = GameState.getCurrentPlayer();
    if (!player) return;

    // Per-turn systems
    ResourceSystem.applyTurnIncome(playerIndex);
    CityGrowthSystem.processPlayer(playerIndex);

    // Reset movement for new turn's units
    GameState.getPlayerUnits(playerIndex).forEach(unit => {
      unit.movementRemaining = unit.movement;
      unit.hasMoved = false;
      unit.hasActed = false;
    });

    EventBus.emit(EVENTS.TURN_STARTED, {
      turnNumber: GameState.turnNumber,
      playerIndex,
      playerName: player.name,
      isAI: player.isAI
    });
  }

  /**
   * Check if the current player is AI.
   * @returns {boolean}
   */
  isAITurn() {
    const player = GameState.getCurrentPlayer();
    return player && player.isAI;
  }
}
