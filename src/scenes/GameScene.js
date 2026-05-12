/**
 * @file GameScene.js
 * @description Primary gameplay scene. Generates the map, places starting
 * units, renders hexes / cities / units, handles input, and drives the
 * turn loop via TurnManager.
 * @version 0.4.0
 */

import Phaser from 'phaser';
import { HexGrid } from '../core/HexGrid.js';
import { MapGenerator } from '../core/MapGenerator.js';
import { HexRenderer } from '../ui/HexRenderer.js';
import { CityRenderer } from '../ui/CityRenderer.js';
import { UnitRenderer } from '../ui/UnitRenderer.js';
import { GameState } from '../core/GameState.js';
import { TurnManager } from '../core/TurnManager.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { CommandManager } from '../core/CommandManager.js';
import { FoundCityCommand } from '../core/commands/FoundCityCommand.js';
import { UpgradeCityCommand } from '../core/commands/UpgradeCityCommand.js';
import { CityFoundingSystem } from '../systems/CityFoundingSystem.js';
import { MAP_SIZES, HEX_SIZE, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, PAN_SPEED } from '../config/constants.js';
import { Unit, UNIT_TYPE } from '../entities/Unit.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.hexRenderer = null;
    this.cityRenderer = null;
    this.unitRenderer = null;
    this.turnManager = null;
    this.commandManager = null;
    this._cursors = null;
    this._wasd = null;
    this._needsRedraw = true;
    this._needsEntityRedraw = true;
    this._isDragging = false;
    this._dragStartX = 0;
    this._dragStartY = 0;
  }

  create() {
    // Background colour for the world view (visible behind map edges)
    this.cameras.main.setBackgroundColor('#0d1020');

    // Generate map based on settings
    const mapSizeKey = GameState.settings.mapSize || 'MEDIUM';
    const { cols, rows } = MAP_SIZES[mapSizeKey];

    console.log(`Generating ${cols}x${rows} map...`);
    const startTime = performance.now();
    GameState.hexMap = MapGenerator.generateValidated(cols, rows);
    const genTime = (performance.now() - startTime).toFixed(1);
    console.log(`Map generated in ${genTime}ms (${GameState.hexMap.size} hexes)`);

    // Spawn starting Settlers
    this._spawnStarters();

    // Renderers
    this.hexRenderer = new HexRenderer(this, GameState.hexMap);
    this.cityRenderer = new CityRenderer(this);
    this.unitRenderer = new UnitRenderer(this);
    this.commandManager = new CommandManager();

    // Camera bounds
    const bottomRight = HexGrid.axialToPixel(cols, rows);
    const padding = HEX_SIZE * 4;
    this.cameras.main.setBounds(
      -padding, -padding,
      bottomRight.x + padding * 2,
      bottomRight.y + padding * 2
    );

    // Center camera on player 1's starting unit, fall back to map center
    const myUnits = GameState.getPlayerUnits(0);
    if (myUnits.length > 0) {
      const u = myUnits[0];
      const p = HexGrid.axialToPixel(u.q, u.r);
      this.cameras.main.centerOn(p.x, p.y);
    } else {
      const center = HexGrid.axialToPixel(Math.floor(cols / 2), Math.floor(rows / 2));
      this.cameras.main.centerOn(center.x, center.y);
    }

    // Input setup
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Mouse wheel zoom
    this.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY) => {
      const cam = this.cameras.main;
      const newZoom = deltaY > 0
        ? Math.max(ZOOM_MIN, cam.zoom - ZOOM_STEP)
        : Math.min(ZOOM_MAX, cam.zoom + ZOOM_STEP);
      cam.setZoom(newZoom);
      this._needsRedraw = true;
    });

    // Middle-mouse drag pan
    this.input.on('pointerdown', (pointer) => {
      if (pointer.middleButtonDown()) {
        this._isDragging = true;
        this._dragStartX = pointer.x;
        this._dragStartY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (this._isDragging) {
        const cam = this.cameras.main;
        cam.scrollX -= (pointer.x - this._dragStartX) / cam.zoom;
        cam.scrollY -= (pointer.y - this._dragStartY) / cam.zoom;
        this._dragStartX = pointer.x;
        this._dragStartY = pointer.y;
        this._needsRedraw = true;
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (pointer.middleButtonReleased()) {
        this._isDragging = false;
      }
    });

    // Left-click hex selection
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        const { q, r } = HexGrid.pixelToAxial(pointer.worldX, pointer.worldY);
        this._handleHexClick(q, r);
      }
    });

    // Escape: deselect
    this.input.keyboard.on('keydown-ESC', () => this._clearSelection());

    // Parallel UI scene
    this.scene.launch('UIScene');

    // Turn loop
    this.turnManager = new TurnManager();
    this.turnManager.startGame();

    // First render
    this.hexRenderer.render(this.cameras.main);
    this.cityRenderer.renderAll();
    this.unitRenderer.renderAll();

    this._setupEventListeners();
  }

  /**
   * Place a Settler for each player on a good starting hex.
   * @private
   */
  _spawnStarters() {
    const starts = [];
    for (let i = 0; i < GameState.players.length; i++) {
      const start = CityFoundingSystem.findStartHex(starts);
      if (!start) continue;
      starts.push(start);

      const settler = new Unit({
        id: GameState.generateUnitId(),
        type: UNIT_TYPE.SETTLER,
        playerIndex: i,
        q: start.q,
        r: start.r
      });
      GameState.addUnit(settler);
    }
  }

  update() {
    const cam = this.cameras.main;
    const panSpeed = PAN_SPEED / cam.zoom;
    let moved = false;

    if (this._cursors.left.isDown || this._wasd.left.isDown)   { cam.scrollX -= panSpeed; moved = true; }
    if (this._cursors.right.isDown || this._wasd.right.isDown) { cam.scrollX += panSpeed; moved = true; }
    if (this._cursors.up.isDown || this._wasd.up.isDown)       { cam.scrollY -= panSpeed; moved = true; }
    if (this._cursors.down.isDown || this._wasd.down.isDown)   { cam.scrollY += panSpeed; moved = true; }

    if (moved || this._needsRedraw) {
      this.hexRenderer.render(cam);
      this._needsRedraw = false;
    }
    if (this._needsEntityRedraw) {
      this.cityRenderer.renderAll();
      this.unitRenderer.renderAll();
      this._needsEntityRedraw = false;
    }
  }

  // ---------- Selection / commands ----------

  _handleHexClick(q, r) {
    const hex = GameState.hexMap.getHex(q, r);
    if (!hex) { this._clearSelection(); return; }

    // Unit takes priority, then city, then hex
    const unit = GameState.getUnitAt(q, r);
    if (unit) {
      GameState.selectionType = 'unit';
      GameState.selectionData = unit;
      this.hexRenderer.setSelection(q, r);
      EventBus.emit(EVENTS.UNIT_SELECTED, { unit, hex });
      return;
    }

    const city = GameState.getCityAt(q, r);
    if (city) {
      GameState.selectionType = 'city';
      GameState.selectionData = city;
      this.hexRenderer.setSelection(q, r);
      EventBus.emit(EVENTS.CITY_SELECTED, { city, hex });
      return;
    }

    GameState.selectionType = 'hex';
    GameState.selectionData = hex;
    this.hexRenderer.setSelection(q, r);
    EventBus.emit(EVENTS.HEX_SELECTED, { hex });
  }

  _clearSelection() {
    GameState.selectionType = null;
    GameState.selectionData = null;
    this.hexRenderer.setSelection(null, null);
    EventBus.emit(EVENTS.SELECTION_CLEARED);
  }

  /** Issue FoundCity for the currently selected Settler. */
  requestFoundCity() {
    if (GameState.selectionType !== 'unit') return false;
    const unit = GameState.selectionData;
    if (!unit?.canFoundCity) return false;
    const cmd = new FoundCityCommand(unit.id);
    const ok = this.commandManager.execute(cmd);
    if (ok) {
      // Re-select the new city
      const city = GameState.cities.get(cmd.cityCreated);
      if (city) {
        GameState.selectionType = 'city';
        GameState.selectionData = city;
        EventBus.emit(EVENTS.CITY_SELECTED, { city, hex: GameState.hexMap.getHex(city.q, city.r) });
      } else {
        this._clearSelection();
      }
    }
    return ok;
  }

  /** Issue UpgradeCity for the currently selected city. */
  requestUpgradeCity() {
    if (GameState.selectionType !== 'city') return false;
    const city = GameState.selectionData;
    const cmd = new UpgradeCityCommand(city.id);
    const ok = this.commandManager.execute(cmd);
    if (ok) {
      EventBus.emit(EVENTS.CITY_SELECTED, { city, hex: GameState.hexMap.getHex(city.q, city.r) });
    }
    return ok;
  }

  _setupEventListeners() {
    EventBus.on(EVENTS.UNIT_MOVED,      () => { this._needsRedraw = true; this._needsEntityRedraw = true; });
    EventBus.on(EVENTS.UNIT_CREATED,    () => { this._needsEntityRedraw = true; });
    EventBus.on(EVENTS.UNIT_DESTROYED,  () => { this._needsEntityRedraw = true; });
    EventBus.on(EVENTS.CITY_FOUNDED,    () => { this._needsEntityRedraw = true; this._needsRedraw = true; });
    EventBus.on(EVENTS.CITY_EVOLVED,    () => { this._needsEntityRedraw = true; });
    EventBus.on(EVENTS.COMBAT_RESOLVED, () => { this._needsRedraw = true; this._needsEntityRedraw = true; });
    EventBus.on(EVENTS.FOG_UPDATED,     () => { this._needsRedraw = true; });
    EventBus.on(EVENTS.TURN_STARTED,    () => { this._needsEntityRedraw = true; });
  }

  centerOnHex(q, r) {
    const { x, y } = HexGrid.axialToPixel(q, r);
    this.cameras.main.centerOn(x, y);
    this._needsRedraw = true;
  }

  shutdown() {
    EventBus.clear();
    if (this.hexRenderer) this.hexRenderer.destroy();
    if (this.cityRenderer) this.cityRenderer.destroy();
    if (this.unitRenderer) this.unitRenderer.destroy();
    this.scene.stop('UIScene');
  }
}
