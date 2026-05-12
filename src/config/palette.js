/**
 * @file palette.js
 * @description Locked color palette for Straty2. All rendering code should
 * pull colors from here so the game stays visually consistent. Stylized
 * low-poly / flat-illustration palette: warm earthy tones for land,
 * desaturated cool tones for sea and UI.
 * @version 0.4.0
 */

/** Terrain base + shade colors (flat illustration, two-tone per terrain) */
export const TERRAIN_PALETTE = {
  ocean:     { base: 0x2e6e9e, shade: 0x245b85, deep: 0x1a4263 },
  grassland: { base: 0x7ec850, shade: 0x6cb144, deep: 0x4f8a2f },
  forest:    { base: 0x4a8a3a, shade: 0x3a6e2d, deep: 0x2a5220 },
  mountain:  { base: 0x8b8275, shade: 0x6e6759, deep: 0x4f483d },
  desert:    { base: 0xe6c878, shade: 0xd2b35e, deep: 0xb5934a },
  hills:     { base: 0xa8b35a, shade: 0x8a9647, deep: 0x6d7935 },
  swamp:     { base: 0x5d7a4a, shade: 0x49603a, deep: 0x37482c }
};

/** River overlay */
export const RIVER_COLOR = 0x4ea3d6;
export const RIVER_ALPHA = 0.7;

/** Resource indicators (small icons on hexes) */
export const RESOURCE_COLORS = {
  food:  0xff7a5c,
  wood:  0x9a6b3a,
  stone: 0xbfbfbf,
  metal: 0xe2b956
};

/** Player slot colors — supports up to 8 players (Phase 7 uses all of them). */
export const PLAYER_PALETTE = [
  0x4f8cff, // 1 azure
  0xff5151, // 2 crimson
  0x6cc24a, // 3 emerald
  0xe9b948, // 4 amber
  0xb764d4, // 5 violet
  0xff8e3c, // 6 ember
  0x4ad9d0, // 7 teal
  0xe75ea0  // 8 rose
];

/** UI palette — used for menus, panels, buttons, text */
export const UI = {
  bg:           0x141828,
  bgGradTop:    0x1d2440,
  bgGradBottom: 0x0d1020,
  panel:        0x1c2238,
  panelBorder:  0x39426b,
  accent:       0xd4b16a, // gold
  accentBright: 0xefd28f,
  textPrimary:  0xf1ead9,
  textSecondary:0xa9a59a,
  textMuted:    0x6e6960,
  success:      0x6cc24a,
  successDark:  0x2f6a26,
  danger:       0xff5151,
  dangerDark:   0x6a2222,
  info:         0x4f8cff,
  highlight:    0xfff066,
  shadow:       0x000000
};

/** Hex string helpers for Phaser text colors */
export const HEX = {
  accent:        '#d4b16a',
  accentBright:  '#efd28f',
  textPrimary:   '#f1ead9',
  textSecondary: '#a9a59a',
  textMuted:     '#6e6960',
  success:       '#6cc24a',
  danger:        '#ff5151',
  info:          '#4f8cff',
  highlight:     '#fff066'
};

/** Convert 0xRRGGBB int to CSS hex string */
export function toHex(intColor) {
  return '#' + intColor.toString(16).padStart(6, '0');
}
