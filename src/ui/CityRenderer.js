/**
 * @file CityRenderer.js
 * @description Draws cities on the map. Each city renders as a stylized
 * cluster of buildings whose silhouette grows by evolution level.
 * Owner color is shown as a banner / roof accent.
 * Procedural (no external assets), low-poly flat illustration vibe.
 * @version 0.4.0
 */

import { HexGrid } from '../core/HexGrid.js';
import { GameState } from '../core/GameState.js';
import { HEX_SIZE } from '../config/constants.js';
import { CITY_LEVEL } from '../config/cityConfig.js';
import { UI } from '../config/palette.js';

export class CityRenderer {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this._graphics = scene.add.graphics();
    this._labels = []; // Phaser.GameObjects.Text array, reused
  }

  /** Render every city in GameState. Called when something changes. */
  renderAll() {
    this._graphics.clear();
    this._destroyLabels();

    GameState.cities.forEach(city => this._drawCity(city));
  }

  _destroyLabels() {
    for (const t of this._labels) t.destroy();
    this._labels = [];
  }

  _drawCity(city) {
    const { x, y } = HexGrid.axialToPixel(city.q, city.r);
    const owner = GameState.getPlayer(city.playerIndex);
    const ownerColor = owner ? owner.color : 0xffffff;

    // Territory ring (subtle)
    this._graphics.lineStyle(2, ownerColor, 0.35);
    this._graphics.strokeCircle(x, y, HEX_SIZE * 0.85);

    // Shadow under city
    this._graphics.fillStyle(0x000000, 0.25);
    this._graphics.fillEllipse(x, y + 14, HEX_SIZE * 0.9, HEX_SIZE * 0.25);

    switch (city.level) {
      case CITY_LEVEL.CAMP:    this._drawCamp(x, y, ownerColor); break;
      case CITY_LEVEL.VILLAGE: this._drawVillage(x, y, ownerColor); break;
      case CITY_LEVEL.TOWN:    this._drawTown(x, y, ownerColor); break;
      case CITY_LEVEL.CITY:    this._drawCity4(x, y, ownerColor); break;
    }

    // Name label below
    const label = this.scene.add.text(x, y + HEX_SIZE * 0.7, city.name, {
      fontSize: '12px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: '#f1ead9',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this._labels.push(label);

    // Population badge above
    const popLabel = this.scene.add.text(x, y - HEX_SIZE * 0.55, `★${city.population}`, {
      fontSize: '11px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: '#fff066',
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this._labels.push(popLabel);
  }

  // ---------- Per-level silhouettes ----------

  _drawCamp(cx, cy, color) {
    // Two simple tents
    const g = this._graphics;
    // Tent A
    g.fillStyle(0x8d6b3a, 1);
    g.fillTriangle(cx - 16, cy + 8, cx - 2, cy + 8, cx - 9, cy - 6);
    g.fillStyle(color, 1);
    g.fillTriangle(cx - 11, cy + 8, cx - 7, cy + 8, cx - 9, cy + 1); // flag/door
    // Tent B
    g.fillStyle(0xa6814a, 1);
    g.fillTriangle(cx + 0, cy + 8, cx + 14, cy + 8, cx + 7, cy - 4);
    // Smoke / campfire
    g.fillStyle(0xe27a44, 1);
    g.fillCircle(cx + 9, cy + 10, 2);
  }

  _drawVillage(cx, cy, color) {
    const g = this._graphics;
    // Three small huts
    const huts = [
      { x: cx - 14, y: cy + 4, w: 12, h: 10 },
      { x: cx,      y: cy + 2, w: 12, h: 12 },
      { x: cx + 13, y: cy + 5, w: 10, h: 9 }
    ];
    for (const h of huts) {
      // wall
      g.fillStyle(0xc3a16a, 1);
      g.fillRect(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h);
      // roof
      g.fillStyle(0x6c3b1f, 1);
      g.fillTriangle(h.x - h.w / 2 - 1, h.y - h.h / 2, h.x + h.w / 2 + 1, h.y - h.h / 2, h.x, h.y - h.h);
    }
    // Player banner on center hut
    g.fillStyle(color, 1);
    g.fillRect(cx - 1, cy - 10, 2, 6);
    g.fillTriangle(cx + 1, cy - 10, cx + 7, cy - 8, cx + 1, cy - 6);
  }

  _drawTown(cx, cy, color) {
    const g = this._graphics;
    // Wall base
    g.fillStyle(0xa68a5c, 1);
    g.fillRect(cx - 22, cy + 2, 44, 10);
    g.fillStyle(0x7c6740, 1);
    g.fillRect(cx - 22, cy + 10, 44, 3);
    // Crenellations
    for (let i = 0; i < 5; i++) {
      g.fillStyle(0xa68a5c, 1);
      g.fillRect(cx - 22 + i * 10, cy - 2, 5, 4);
    }
    // Central tower
    g.fillStyle(0xb89870, 1);
    g.fillRect(cx - 7, cy - 14, 14, 16);
    g.fillStyle(color, 1);
    g.fillTriangle(cx - 7, cy - 14, cx + 7, cy - 14, cx, cy - 22);
    // Windows
    g.fillStyle(0x2a1d10, 1);
    g.fillRect(cx - 2, cy - 8, 4, 5);
  }

  _drawCity4(cx, cy, color) {
    const g = this._graphics;
    // Stepped ziggurat-ish silhouette
    g.fillStyle(0xb89870, 1);
    g.fillRect(cx - 26, cy + 4, 52, 12);
    g.fillStyle(0xa68053, 1);
    g.fillRect(cx - 20, cy - 4, 40, 10);
    g.fillStyle(0x8e6a3e, 1);
    g.fillRect(cx - 14, cy - 12, 28, 10);
    g.fillStyle(0x6f5230, 1);
    g.fillRect(cx - 8, cy - 20, 16, 10);
    // Crowning banner
    g.fillStyle(color, 1);
    g.fillRect(cx - 1, cy - 28, 2, 10);
    g.fillTriangle(cx + 1, cy - 28, cx + 9, cy - 25, cx + 1, cy - 22);
    // Windows
    g.fillStyle(0x2a1d10, 1);
    g.fillRect(cx - 12, cy - 8, 3, 4);
    g.fillRect(cx + 9, cy - 8, 3, 4);
    g.fillRect(cx - 4, cy - 16, 3, 4);
    g.fillRect(cx + 1, cy - 16, 3, 4);
  }

  destroy() {
    this._graphics.destroy();
    this._destroyLabels();
  }
}
