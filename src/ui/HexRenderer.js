/**
 * @file HexRenderer.js
 * @description Renders hex tiles with stylized flat-illustration look:
 *   - Two-tone hexes (base fill + bottom-half shade for fake depth)
 *   - Procedural decorations per terrain (trees on forest, peaks on mountain,
 *     dunes on desert, etc.) drawn as polygons — no external assets needed.
 *   - River overlays, resource markers, selection highlight.
 * Performance-conscious: viewport culling, decorations skipped at low zoom.
 * @version 0.4.0
 */

import { HexGrid } from '../core/HexGrid.js';
import { HEX_SIZE, TERRAIN } from '../config/constants.js';
import { TERRAIN_PALETTE, RIVER_COLOR, RIVER_ALPHA, RESOURCE_COLORS, UI } from '../config/palette.js';

/** Decoration draws can be skipped when the camera is too zoomed out. */
const DECORATION_MIN_ZOOM = 0.55;

export class HexRenderer {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../core/HexMap.js').HexMap} hexMap
   */
  constructor(scene, hexMap) {
    this.scene = scene;
    this.hexMap = hexMap;

    // Layered graphics (back-to-front)
    this._hexGraphics       = scene.add.graphics(); // base fill + shade
    this._decorationGraphics = scene.add.graphics(); // trees/mountains/etc
    this._riverGraphics     = scene.add.graphics();
    this._resourceGraphics  = scene.add.graphics();
    this._borderGraphics    = scene.add.graphics();
    this._selectionGraphics = scene.add.graphics();

    this._selectedHex = null;
    this._cullPadding = 2;

    // Stable per-hex pseudo-random offsets so decorations don't shimmer
    this._decorationSeed = new Map(); // key -> small object
  }

  /**
   * Render visible portion of the map. Call when the camera moves or
   * something on the map changes.
   * @param {Phaser.Cameras.Scene2D.Camera} camera
   */
  render(camera) {
    this._hexGraphics.clear();
    this._decorationGraphics.clear();
    this._riverGraphics.clear();
    this._resourceGraphics.clear();
    this._borderGraphics.clear();

    const bounds = this._getVisibleBounds(camera);
    const drawDecorations = camera.zoom >= DECORATION_MIN_ZOOM;

    this.hexMap.forEachHex((hex) => {
      if (hex.q < bounds.minQ || hex.q > bounds.maxQ ||
          hex.r < bounds.minR || hex.r > bounds.maxR) {
        return;
      }

      const { x, y } = HexGrid.axialToPixel(hex.q, hex.r);
      const corners = HexGrid.getHexCorners(x, y);

      this._drawHexTile(hex, x, y, corners);

      if (hex.hasRiver) this._drawRiver(corners, x, y);
      if (drawDecorations) this._drawDecoration(hex, x, y);
      if (hex.hasResource) this._drawResourceIndicator(hex, x, y);
    });

    this._drawSelection();
  }

  setSelection(q, r) {
    this._selectedHex = (q === null || r === null) ? null : { q, r };
    this._drawSelection();
  }

  getSelection() {
    return this._selectedHex;
  }

  // ---------- Tile drawing ----------

  _drawHexTile(hex, cx, cy, corners) {
    const palette = TERRAIN_PALETTE[hex.terrain];
    if (!palette) {
      this._fillPolygon(this._hexGraphics, corners, 0x000000);
      return;
    }

    // Top half (base)
    this._fillPolygon(this._hexGraphics, corners, palette.base);

    // Lower-half shade for fake depth
    const lower = [
      corners[5], corners[4], corners[3],
      { x: corners[3].x, y: cy },
      { x: corners[5].x, y: cy }
    ];
    this._fillPolygon(this._hexGraphics, lower, palette.shade, 1);

    // Subtle outline
    this._borderGraphics.lineStyle(1, palette.deep, 0.35);
    this._strokePolygon(this._borderGraphics, corners);
  }

  // ---------- Decorations ----------

  _hexSeed(hex) {
    const key = `${hex.q},${hex.r}`;
    let s = this._decorationSeed.get(key);
    if (!s) {
      // Deterministic pseudo-random from coordinates
      const h = Math.abs(Math.sin(hex.q * 374761.0 + hex.r * 668265263.0) * 43758.0);
      s = { a: (h % 1), b: ((h * 1.13) % 1), c: ((h * 2.71) % 1) };
      this._decorationSeed.set(key, s);
    }
    return s;
  }

  _drawDecoration(hex, cx, cy) {
    const seed = this._hexSeed(hex);
    switch (hex.terrain) {
      case TERRAIN.FOREST:   this._drawTrees(cx, cy, seed); break;
      case TERRAIN.MOUNTAIN: this._drawMountainPeak(cx, cy, seed); break;
      case TERRAIN.HILLS:    this._drawHillMounds(cx, cy, seed); break;
      case TERRAIN.DESERT:   this._drawDunes(cx, cy, seed); break;
      case TERRAIN.SWAMP:    this._drawSwampReeds(cx, cy, seed); break;
      case TERRAIN.OCEAN:    this._drawWaves(cx, cy, seed); break;
      default: break;
    }
  }

  _drawTrees(cx, cy, seed) {
    const g = this._decorationGraphics;
    const trunk = 0x3d2a18;
    const leafLight = TERRAIN_PALETTE.forest.base;
    const leafDark = TERRAIN_PALETTE.forest.deep;

    // 3 stylized trees
    const positions = [
      { x: cx - HEX_SIZE * 0.35, y: cy + 2 + seed.a * 4 },
      { x: cx + HEX_SIZE * 0.05, y: cy - 6 + seed.b * 4 },
      { x: cx + HEX_SIZE * 0.4,  y: cy + 4 + seed.c * 4 }
    ];
    for (const p of positions) {
      // trunk
      g.fillStyle(trunk, 1);
      g.fillRect(p.x - 1.5, p.y, 3, 6);
      // leaves (two triangles stacked)
      g.fillStyle(leafDark, 1);
      g.fillTriangle(p.x - 7, p.y + 2, p.x + 7, p.y + 2, p.x, p.y - 12);
      g.fillStyle(leafLight, 1);
      g.fillTriangle(p.x - 5, p.y - 2, p.x + 5, p.y - 2, p.x, p.y - 13);
    }
  }

  _drawMountainPeak(cx, cy, seed) {
    const g = this._decorationGraphics;
    const peak = TERRAIN_PALETTE.mountain.deep;
    const snow = 0xf2f2f0;
    const shadow = 0x5a5247;

    const off = (seed.a - 0.5) * 4;
    // Back peak
    g.fillStyle(shadow, 1);
    g.fillTriangle(cx - 14 + off, cy + 8, cx + 14 + off, cy + 8, cx + off, cy - 16);
    // Front peak (offset)
    g.fillStyle(peak, 1);
    g.fillTriangle(cx - 18, cy + 12, cx + 6, cy + 12, cx - 4, cy - 10);
    // Snow cap
    g.fillStyle(snow, 1);
    g.fillTriangle(cx - 6, cy - 3, cx - 2, cy - 3, cx - 4, cy - 10);
  }

  _drawHillMounds(cx, cy, seed) {
    const g = this._decorationGraphics;
    const c = TERRAIN_PALETTE.hills.deep;
    g.fillStyle(c, 0.7);
    // Two soft mounds
    g.fillEllipse(cx - 6 + (seed.a - 0.5) * 4, cy + 2, 18, 8);
    g.fillEllipse(cx + 8, cy + 5 + (seed.b - 0.5) * 3, 14, 6);
  }

  _drawDunes(cx, cy, seed) {
    const g = this._decorationGraphics;
    const c = TERRAIN_PALETTE.desert.deep;
    g.lineStyle(2, c, 0.6);
    g.beginPath();
    g.moveTo(cx - 14, cy + 4 + seed.a * 2);
    g.lineTo(cx - 4, cy - 2 + seed.b * 2);
    g.lineTo(cx + 6, cy + 6 + seed.c * 2);
    g.lineTo(cx + 14, cy);
    g.strokePath();
  }

  _drawSwampReeds(cx, cy, seed) {
    const g = this._decorationGraphics;
    const c = TERRAIN_PALETTE.swamp.deep;
    g.lineStyle(1.2, c, 0.9);
    for (let i = 0; i < 4; i++) {
      const x = cx - 10 + i * 6 + (seed.a + i) * 2;
      g.beginPath();
      g.moveTo(x, cy + 6);
      g.lineTo(x + 1, cy - 4 - (i % 2) * 3);
      g.strokePath();
    }
    // small puddle highlight
    g.fillStyle(0x6e9aa8, 0.4);
    g.fillEllipse(cx + 6, cy + 6, 10, 4);
  }

  _drawWaves(cx, cy, seed) {
    const g = this._decorationGraphics;
    g.lineStyle(1, 0x82b6da, 0.5);
    const yA = cy - 6 + seed.a * 3;
    const yB = cy + 4 + seed.b * 3;
    g.beginPath();
    g.moveTo(cx - 10, yA);
    g.lineTo(cx - 4, yA - 2);
    g.lineTo(cx + 4, yA);
    g.strokePath();
    g.beginPath();
    g.moveTo(cx - 6, yB);
    g.lineTo(cx, yB - 2);
    g.lineTo(cx + 8, yB);
    g.strokePath();
  }

  // ---------- Rivers, resources, selection ----------

  _drawRiver(corners, cx, cy) {
    // Stylized river: blue ellipse + lighter highlight
    this._riverGraphics.fillStyle(RIVER_COLOR, RIVER_ALPHA);
    this._riverGraphics.fillEllipse(cx, cy, HEX_SIZE * 1.4, HEX_SIZE * 0.8);
    this._riverGraphics.fillStyle(0x8ec9eb, 0.4);
    this._riverGraphics.fillEllipse(cx - 2, cy - 3, HEX_SIZE * 1.0, HEX_SIZE * 0.4);
  }

  _drawResourceIndicator(hex, cx, cy) {
    const c = RESOURCE_COLORS[hex.resourceType] || 0xffffff;
    const y = cy + HEX_SIZE * 0.55;
    // small badge: rounded rect with dot
    this._resourceGraphics.fillStyle(0x1a1828, 0.85);
    this._resourceGraphics.fillRoundedRect(cx - 7, y - 5, 14, 10, 3);
    this._resourceGraphics.fillStyle(c, 1);
    this._resourceGraphics.fillCircle(cx, y, 3.5);
    this._resourceGraphics.lineStyle(1, 0x000000, 0.4);
    this._resourceGraphics.strokeCircle(cx, y, 3.5);
  }

  _drawSelection() {
    this._selectionGraphics.clear();
    if (!this._selectedHex) return;

    const { x, y } = HexGrid.axialToPixel(this._selectedHex.q, this._selectedHex.r);
    const corners = HexGrid.getHexCorners(x, y);

    this._selectionGraphics.fillStyle(UI.highlight, 0.18);
    this._fillPolygon(this._selectionGraphics, corners, UI.highlight, 0.18);

    this._selectionGraphics.lineStyle(2.5, UI.highlight, 1);
    this._strokePolygon(this._selectionGraphics, corners);

    // Inner glow
    const inset = corners.map(c => ({
      x: x + (c.x - x) * 0.88,
      y: y + (c.y - y) * 0.88
    }));
    this._selectionGraphics.lineStyle(1.5, UI.accentBright, 0.7);
    this._strokePolygon(this._selectionGraphics, inset);
  }

  // ---------- Helpers ----------

  _fillPolygon(graphics, points, color, alpha = 1) {
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
  }

  _strokePolygon(graphics, points) {
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();
  }

  _getVisibleBounds(camera) {
    const pad = this._cullPadding;
    const left = camera.worldView.x;
    const right = left + camera.worldView.width;
    const top = camera.worldView.y;
    const bottom = top + camera.worldView.height;

    const topLeft = HexGrid.pixelToAxial(left, top);
    const bottomRight = HexGrid.pixelToAxial(right, bottom);

    return {
      minQ: Math.max(0, topLeft.q - pad),
      maxQ: Math.min(this.hexMap.cols - 1, bottomRight.q + pad),
      minR: Math.max(0, topLeft.r - pad),
      maxR: Math.min(this.hexMap.rows - 1, bottomRight.r + pad)
    };
  }

  destroy() {
    this._hexGraphics.destroy();
    this._decorationGraphics.destroy();
    this._riverGraphics.destroy();
    this._resourceGraphics.destroy();
    this._borderGraphics.destroy();
    this._selectionGraphics.destroy();
  }
}
