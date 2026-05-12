/**
 * @file MinimapRenderer.js
 * @description Bottom-right minimap. Renders the full map with palette
 * colors, overlays city dots in owner color, draws a camera viewport
 * rectangle, and supports click-to-jump.
 * @version 0.4.0
 */

import { HexGrid } from '../core/HexGrid.js';
import { GameState } from '../core/GameState.js';
import { TERRAIN_PALETTE, UI } from '../config/palette.js';
import { EventBus, EVENTS } from '../core/EventBus.js';

const MINIMAP_WIDTH = 220;
const MINIMAP_HEIGHT = 150;
const MINIMAP_MARGIN = 12;

export class MinimapRenderer {
  /**
   * @param {Phaser.Scene} scene - The UIScene
   */
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;

    this._x = width - MINIMAP_WIDTH - MINIMAP_MARGIN;
    this._y = height - MINIMAP_HEIGHT - MINIMAP_MARGIN;

    // Background
    this._bgGraphics = scene.add.graphics();
    this._bgGraphics.fillStyle(UI.bg, 0.94);
    this._bgGraphics.fillRoundedRect(this._x, this._y, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);
    this._bgGraphics.lineStyle(1.5, UI.panelBorder, 1);
    this._bgGraphics.strokeRoundedRect(this._x, this._y, MINIMAP_WIDTH, MINIMAP_HEIGHT, 6);

    // Map dots layer
    this._mapGraphics = scene.add.graphics();

    // City + viewport overlay
    this._overlayGraphics = scene.add.graphics();

    this._scaleX = 1;
    this._scaleY = 1;
    this._mapPixelWidth = 0;
    this._mapPixelHeight = 0;
    this._padX = 4;
    this._padY = 4;

    const zone = scene.add.zone(
      this._x + MINIMAP_WIDTH / 2,
      this._y + MINIMAP_HEIGHT / 2,
      MINIMAP_WIDTH,
      MINIMAP_HEIGHT
    ).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (pointer) => this._handleClick(pointer));

    this._rendered = false;

    this._unsub = [];
    this._unsub.push(EventBus.on(EVENTS.CITY_FOUNDED, () => this._drawOverlay()));
    this._unsub.push(EventBus.on(EVENTS.CITY_CAPTURED, () => this._drawOverlay()));
  }

  /** Render the static map tile dots. Called once after map gen. */
  renderMap() {
    if (!GameState.hexMap) return;
    const hexMap = GameState.hexMap;
    const cols = hexMap.cols;
    const rows = hexMap.rows;

    const topLeft = HexGrid.axialToPixel(0, 0);
    const bottomRight = HexGrid.axialToPixel(cols - 1, rows - 1);
    this._mapPixelWidth = bottomRight.x - topLeft.x;
    this._mapPixelHeight = bottomRight.y - topLeft.y;
    this._mapOriginX = topLeft.x;
    this._mapOriginY = topLeft.y;

    this._scaleX = (MINIMAP_WIDTH - this._padX * 2) / this._mapPixelWidth;
    this._scaleY = (MINIMAP_HEIGHT - this._padY * 2) / this._mapPixelHeight;

    this._mapGraphics.clear();
    hexMap.forEachHex((hex) => {
      const { x, y } = HexGrid.axialToPixel(hex.q, hex.r);
      const mx = this._x + this._padX + (x - this._mapOriginX) * this._scaleX;
      const my = this._y + this._padY + (y - this._mapOriginY) * this._scaleY;

      const palette = TERRAIN_PALETTE[hex.terrain];
      const color = palette ? palette.base : 0x000000;
      this._mapGraphics.fillStyle(color, 1);
      this._mapGraphics.fillRect(mx - 1, my - 1, 2.2, 2.2);

      if (hex.hasRiver) {
        this._mapGraphics.fillStyle(0x82b6da, 0.7);
        this._mapGraphics.fillRect(mx - 1, my - 1, 2.2, 2.2);
      }
    });

    this._rendered = true;
    this._drawOverlay();
  }

  /** Update overlay layer (city markers + viewport). Called each frame. */
  updateViewport(gameCamera) {
    if (!this._rendered) return;

    this._overlayGraphics.clear();

    // City dots
    GameState.cities.forEach(city => {
      const { x, y } = HexGrid.axialToPixel(city.q, city.r);
      const mx = this._x + this._padX + (x - this._mapOriginX) * this._scaleX;
      const my = this._y + this._padY + (y - this._mapOriginY) * this._scaleY;
      const owner = GameState.getPlayer(city.playerIndex);
      const color = owner ? owner.color : 0xffffff;
      this._overlayGraphics.fillStyle(0x000000, 0.6);
      this._overlayGraphics.fillCircle(mx, my, 3);
      this._overlayGraphics.fillStyle(color, 1);
      this._overlayGraphics.fillCircle(mx, my, 2);
    });

    // Viewport rectangle
    const view = gameCamera.worldView;
    const vx = this._x + this._padX + (view.x - this._mapOriginX) * this._scaleX;
    const vy = this._y + this._padY + (view.y - this._mapOriginY) * this._scaleY;
    const vw = view.width * this._scaleX;
    const vh = view.height * this._scaleY;
    this._overlayGraphics.lineStyle(1.5, UI.highlight, 0.85);
    this._overlayGraphics.strokeRect(vx, vy, vw, vh);
  }

  _drawOverlay() {
    // Cities only; viewport rect refreshed every frame via updateViewport
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene) this.updateViewport(gameScene.cameras.main);
  }

  _handleClick(pointer) {
    if (!this._rendered) return;
    const localX = pointer.x - this._x - this._padX;
    const localY = pointer.y - this._y - this._padY;
    const worldX = this._mapOriginX + localX / this._scaleX;
    const worldY = this._mapOriginY + localY / this._scaleY;
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene) gameScene.cameras.main.centerOn(worldX, worldY);
  }

  destroy() {
    this._unsub.forEach(fn => fn());
    this._bgGraphics.destroy();
    this._mapGraphics.destroy();
    this._overlayGraphics.destroy();
  }
}
