/**
 * @file cityConfig.js
 * @description City evolution levels and per-level mechanics.
 * @version 0.4.0
 */

/** City evolution level identifiers */
export const CITY_LEVEL = {
  CAMP:    0,
  VILLAGE: 1,
  TOWN:    2,
  CITY:    3
};

/**
 * Per-level configuration.
 *  - popRequired: minimum population to evolve INTO this level
 *  - upgradeCost: resources needed to evolve from previous level into this one
 *  - maxPop:      population cap at this level
 *  - territoryRadius: hex ring radius the city controls
 *  - baseIncome:  resources granted to the owner each turn
 *  - growthMultiplier: scales how fast food converts into pop
 */
export const CITY_LEVELS = [
  {
    id: CITY_LEVEL.CAMP,
    name: 'Camp',
    popRequired: 1,
    upgradeCost: { wood: 0, stone: 0, metal: 0 },
    maxPop: 3,
    territoryRadius: 1,
    baseIncome: { food: 2, wood: 1, stone: 0, metal: 0 },
    growthMultiplier: 1.0
  },
  {
    id: CITY_LEVEL.VILLAGE,
    name: 'Village',
    popRequired: 3,
    upgradeCost: { wood: 20, stone: 10, metal: 0 },
    maxPop: 7,
    territoryRadius: 2,
    baseIncome: { food: 4, wood: 2, stone: 1, metal: 0 },
    growthMultiplier: 1.0
  },
  {
    id: CITY_LEVEL.TOWN,
    name: 'Town',
    popRequired: 7,
    upgradeCost: { wood: 50, stone: 30, metal: 10 },
    maxPop: 15,
    territoryRadius: 3,
    baseIncome: { food: 7, wood: 3, stone: 2, metal: 1 },
    growthMultiplier: 0.85
  },
  {
    id: CITY_LEVEL.CITY,
    name: 'City',
    popRequired: 15,
    upgradeCost: { wood: 100, stone: 80, metal: 40 },
    maxPop: 30,
    territoryRadius: 4,
    baseIncome: { food: 11, wood: 5, stone: 4, metal: 3 },
    growthMultiplier: 0.7
  }
];

/**
 * Food threshold needed for the next population increase, given current pop.
 * Same formula across all levels: 10 + currentPop * 5.
 * @param {number} currentPop
 * @returns {number}
 */
export function popGrowthThreshold(currentPop) {
  return 10 + currentPop * 5;
}

/**
 * Resource yield from a single terrain tile when worked.
 * Phase 3 only uses this for the passive territory income (sum over tiles
 * inside the city's territory radius). Workers gathering on resource nodes
 * will be added in a future phase.
 */
export const TILE_YIELD = {
  grassland: { food: 1, wood: 0, stone: 0, metal: 0 },
  forest:    { food: 0, wood: 1, stone: 0, metal: 0 },
  mountain:  { food: 0, wood: 0, stone: 1, metal: 0 },
  hills:     { food: 0, wood: 0, stone: 0, metal: 1 },
  desert:    { food: 0, wood: 0, stone: 0, metal: 0 },
  swamp:     { food: 0, wood: 0, stone: 0, metal: 0 },
  ocean:     { food: 0, wood: 0, stone: 0, metal: 0 }
};

/** River-adjacent grassland yields +1 food */
export const RIVER_FOOD_BONUS = 1;

/** Bonus yield if a resource node is present on a worked tile */
export const RESOURCE_NODE_BONUS = 2;
