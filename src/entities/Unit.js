/**
 * @file Unit.js
 * @description Minimal Unit entity. Full pathfinding + combat live in Phase 4/6;
 * for now this exists so that Settlers can spawn and found cities, which is
 * Phase 3's interactive payoff. Stats are kept simple and will be replaced
 * by data-driven unit configs in Phase 4.
 * @version 0.4.0
 */

/** Unit type identifiers. Phase 3 only spawns SETTLER. */
export const UNIT_TYPE = {
  SETTLER:  'settler',
  WORKER:   'worker',
  SCOUT:    'scout',
  SPEARMAN: 'spearman',
  ARCHER:   'archer',
  CHARIOT:  'chariot',
  BOAT:     'boat'
};

/** Stat skeletons — refined in Phase 4. */
export const UNIT_DEFAULTS = {
  [UNIT_TYPE.SETTLER]: {
    maxHp: 3, attack: 0, defense: 0, range: 0,
    movement: 2, visionRange: 2, canFoundCity: true
  },
  [UNIT_TYPE.WORKER]: {
    maxHp: 5, attack: 1, defense: 1, range: 1,
    movement: 2, visionRange: 2
  },
  [UNIT_TYPE.SCOUT]: {
    maxHp: 8, attack: 3, defense: 2, range: 1,
    movement: 4, visionRange: 4
  }
};

export class Unit {
  /**
   * @param {Object} opts
   * @param {string} opts.id
   * @param {string} opts.type
   * @param {number} opts.playerIndex
   * @param {number} opts.q
   * @param {number} opts.r
   */
  constructor({ id, type, playerIndex, q, r }) {
    this.id = id;
    this.type = type;
    this.playerIndex = playerIndex;
    this.q = q;
    this.r = r;

    const defaults = UNIT_DEFAULTS[type] || UNIT_DEFAULTS[UNIT_TYPE.SETTLER];
    this.maxHp = defaults.maxHp;
    this.hp = defaults.maxHp;
    this.attack = defaults.attack;
    this.defense = defaults.defense;
    this.range = defaults.range;
    this.movement = defaults.movement;
    this.movementRemaining = defaults.movement;
    this.visionRange = defaults.visionRange;
    this.canFoundCity = !!defaults.canFoundCity;
    this.hasMoved = false;
    this.hasActed = false;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      playerIndex: this.playerIndex,
      q: this.q,
      r: this.r,
      hp: this.hp,
      movementRemaining: this.movementRemaining,
      hasMoved: this.hasMoved,
      hasActed: this.hasActed
    };
  }

  static fromJSON(json) {
    const u = new Unit({
      id: json.id, type: json.type, playerIndex: json.playerIndex,
      q: json.q, r: json.r
    });
    u.hp = json.hp;
    u.movementRemaining = json.movementRemaining;
    u.hasMoved = !!json.hasMoved;
    u.hasActed = !!json.hasActed;
    return u;
  }
}
