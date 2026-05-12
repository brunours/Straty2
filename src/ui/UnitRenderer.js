/**
 * @file UnitRenderer.js
 * @description Draws units on the map. Phase 3 only handles the Settler
 * silhouette (a hooded figure with a small wagon); other unit types get
 * placeholder shapes so the renderer is ready for Phase 4 expansion.
 * @version 0.4.0
 */

import { HexGrid } from '../core/HexGrid.js';
import { GameState } from '../core/GameState.js';
import { HEX_SIZE } from '../config/constants.js';
import { UNIT_TYPE } from '../entities/Unit.js';

export class UnitRenderer {
  constructor(scene) {
    this.scene = scene;
    this._graphics = scene.add.graphics();
    this._labels = [];
  }

  renderAll() {
    this._graphics.clear();
    for (const t of this._labels) t.destroy();
    this._labels = [];

    GameState.units.forEach(unit => this._drawUnit(unit));
  }

  _drawUnit(unit) {
    const { x, y } = HexGrid.axialToPixel(unit.q, unit.r);
    const owner = GameState.getPlayer(unit.playerIndex);
    const color = owner ? owner.color : 0xffffff;

    // Shadow
    this._graphics.fillStyle(0x000000, 0.3);
    this._graphics.fillEllipse(x, y + 12, 18, 5);

    // Owner-colored disc (selection-friendly)
    this._graphics.fillStyle(color, 1);
    this._graphics.fillCircle(x, y + 6, 10);
    this._graphics.lineStyle(1.5, 0x111111, 0.9);
    this._graphics.strokeCircle(x, y + 6, 10);

    switch (unit.type) {
      case UNIT_TYPE.SETTLER: this._drawSettler(x, y, color); break;
      case UNIT_TYPE.WORKER:  this._drawWorker(x, y); break;
      case UNIT_TYPE.SCOUT:   this._drawScout(x, y); break;
      default: this._drawGenericFigure(x, y); break;
    }
  }

  _drawSettler(cx, cy, color) {
    const g = this._graphics;
    // Body / robe
    g.fillStyle(0xe6d6b3, 1);
    g.fillTriangle(cx - 6, cy + 6, cx + 6, cy + 6, cx, cy - 8);
    // Head
    g.fillStyle(0xf2c799, 1);
    g.fillCircle(cx, cy - 9, 3);
    // Hood band in player color
    g.fillStyle(color, 1);
    g.fillRect(cx - 4, cy - 1, 8, 2);
    // Small banner pole
    g.lineStyle(1.2, 0x4d2f17, 1);
    g.beginPath(); g.moveTo(cx + 7, cy - 12); g.lineTo(cx + 7, cy + 4); g.strokePath();
    g.fillStyle(color, 1);
    g.fillTriangle(cx + 7, cy - 12, cx + 13, cy - 10, cx + 7, cy - 8);
  }

  _drawWorker(cx, cy) {
    const g = this._graphics;
    g.fillStyle(0xd6a05a, 1);
    g.fillRect(cx - 4, cy - 6, 8, 10);
    g.fillStyle(0xf2c799, 1);
    g.fillCircle(cx, cy - 8, 3);
    // Tool (pickaxe)
    g.lineStyle(1.2, 0x4d2f17, 1);
    g.beginPath(); g.moveTo(cx + 4, cy - 10); g.lineTo(cx + 8, cy + 2); g.strokePath();
  }

  _drawScout(cx, cy) {
    const g = this._graphics;
    g.fillStyle(0x6b4a2a, 1);
    g.fillTriangle(cx - 5, cy + 6, cx + 5, cy + 6, cx, cy - 6);
    g.fillStyle(0xf2c799, 1);
    g.fillCircle(cx, cy - 7, 3);
  }

  _drawGenericFigure(cx, cy) {
    const g = this._graphics;
    g.fillStyle(0xcccccc, 1);
    g.fillRect(cx - 3, cy - 6, 6, 10);
    g.fillStyle(0xf2c799, 1);
    g.fillCircle(cx, cy - 8, 3);
  }

  destroy() {
    this._graphics.destroy();
    for (const t of this._labels) t.destroy();
  }
}
