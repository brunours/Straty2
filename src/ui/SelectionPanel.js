/**
 * @file SelectionPanel.js
 * @description Bottom-left panel showing info + actions for the currently
 * selected hex, unit, or city. Phase 3 introduces the "Found City" and
 * "Upgrade City" action buttons.
 * @version 0.4.0
 */

import { GameState } from '../core/GameState.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { TERRAIN_CONFIG } from '../config/terrainConfig.js';
import { CITY_LEVELS } from '../config/cityConfig.js';
import { UI, HEX } from '../config/palette.js';

const PANEL_WIDTH = 280;
const PANEL_HEIGHT = 210;
const PANEL_MARGIN = 12;

export class SelectionPanel {
  /**
   * @param {Phaser.Scene} scene - The UIScene
   */
  constructor(scene) {
    this.scene = scene;
    const { height } = scene.cameras.main;
    this._x = PANEL_MARGIN;
    this._y = height - PANEL_HEIGHT - PANEL_MARGIN;

    this._drawBackground();

    this._titleText = scene.add.text(this._x + 14, this._y + 12, 'No Selection', {
      fontSize: '17px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.accent,
      fontStyle: '700'
    });

    this._subtitleText = scene.add.text(this._x + 14, this._y + 36, '', {
      fontSize: '12px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textMuted
    });

    this._infoText = scene.add.text(this._x + 14, this._y + 58, '', {
      fontSize: '13px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textSecondary,
      lineSpacing: 4,
      wordWrap: { width: PANEL_WIDTH - 28 }
    });

    // Action buttons live at the bottom; created lazily per-selection
    this._buttons = [];

    this._clearInfo();

    this._unsub = [];
    this._unsub.push(EventBus.on(EVENTS.HEX_SELECTED,      d => this._showHexInfo(d.hex)));
    this._unsub.push(EventBus.on(EVENTS.UNIT_SELECTED,     d => this._showUnitInfo(d.unit)));
    this._unsub.push(EventBus.on(EVENTS.CITY_SELECTED,     d => this._showCityInfo(d.city)));
    this._unsub.push(EventBus.on(EVENTS.SELECTION_CLEARED, ()  => this._clearInfo()));
    this._unsub.push(EventBus.on(EVENTS.CITY_EVOLVED,      ()  => this._refreshActiveSelection()));
    this._unsub.push(EventBus.on(EVENTS.RESOURCE_CHANGED,  ()  => this._refreshActiveSelection()));
  }

  _drawBackground() {
    const bg = this.scene.add.graphics();
    this._bg = bg;
    bg.fillStyle(UI.bg, 0.94);
    bg.fillRoundedRect(this._x, this._y, PANEL_WIDTH, PANEL_HEIGHT, 8);
    bg.lineStyle(1.5, UI.panelBorder, 1);
    bg.strokeRoundedRect(this._x, this._y, PANEL_WIDTH, PANEL_HEIGHT, 8);
    // Gold accent line under title
    bg.lineStyle(1, UI.accent, 0.6);
    bg.lineBetween(this._x + 14, this._y + 56, this._x + PANEL_WIDTH - 14, this._y + 56);
  }

  _refreshActiveSelection() {
    if (GameState.selectionType === 'city') this._showCityInfo(GameState.selectionData);
    else if (GameState.selectionType === 'unit') this._showUnitInfo(GameState.selectionData);
  }

  _showHexInfo(hex) {
    this._clearButtons();
    const terrain = TERRAIN_CONFIG[hex.terrain];
    this._titleText.setText(terrain.label);
    this._subtitleText.setText(`Hex (${hex.q}, ${hex.r})`);

    const lines = [
      `Move Cost: ${terrain.moveCost === Infinity ? 'Impassable' : terrain.moveCost}`,
      `Defense:   ${terrain.defenseBonus >= 0 ? '+' : ''}${terrain.defenseBonus}`
    ];
    if (hex.hasRiver) lines.push('Has river  (+1 food on grassland)');
    if (hex.hasResource) lines.push(`Resource node: ${hex.resourceType}`);
    this._infoText.setText(lines.join('\n'));
  }

  _showUnitInfo(unit) {
    this._clearButtons();
    const owner = GameState.getPlayer(unit.playerIndex);
    const ownerName = owner ? owner.name : 'Unknown';
    this._titleText.setText(`${this._labelForUnitType(unit.type)}`);
    this._subtitleText.setText(`${ownerName} · (${unit.q}, ${unit.r})`);

    const lines = [
      `HP:    ${unit.hp}/${unit.maxHp}`,
      `Atk:   ${unit.attack}    Def: ${unit.defense}`,
      `Move:  ${unit.movementRemaining}/${unit.movement}`,
      `Sight: ${unit.visionRange}`
    ];
    this._infoText.setText(lines.join('\n'));

    if (unit.canFoundCity && unit.playerIndex === GameState.currentPlayerIndex) {
      this._addActionButton('Found City', () => {
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) gameScene.requestFoundCity();
      });
    }
  }

  _showCityInfo(city) {
    this._clearButtons();
    const owner = GameState.getPlayer(city.playerIndex);
    const level = CITY_LEVELS[city.level];
    const next = CITY_LEVELS[city.level + 1];

    this._titleText.setText(`${city.name} · ${level.name}`);
    this._subtitleText.setText(`${owner ? owner.name : 'Unknown'} · (${city.q}, ${city.r})`);

    const lines = [
      `Population: ${city.population} / ${level.maxPop}`,
      `Food:       ${city.foodStockpile} / ${Math.round(city.nextGrowthAt * level.growthMultiplier)} → +1 pop`,
      `Territory:  radius ${level.territoryRadius}`
    ];
    if (next) {
      const cost = next.upgradeCost;
      const costStr = ['wood', 'stone', 'metal']
        .filter(k => (cost[k] || 0) > 0)
        .map(k => `${cost[k]} ${k}`).join(', ');
      lines.push(`Next level: ${next.name} (pop ${next.popRequired}, ${costStr || 'free'})`);
    } else {
      lines.push('Maxed out.');
    }
    this._infoText.setText(lines.join('\n'));

    if (next && city.playerIndex === GameState.currentPlayerIndex) {
      const player = GameState.getPlayer(city.playerIndex);
      const canUpgrade = city.population >= next.popRequired && player.canAfford(next.upgradeCost);
      this._addActionButton(`Upgrade → ${next.name}`, () => {
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) gameScene.requestUpgradeCity();
      }, !canUpgrade);
    }
  }

  _clearInfo() {
    this._clearButtons();
    this._titleText.setText('No Selection');
    this._subtitleText.setText('');
    this._infoText.setText('Click a hex, unit, or city for details.');
  }

  _clearButtons() {
    this._buttons.forEach(b => {
      b.bg.destroy();
      b.text.destroy();
      b.zone.destroy();
    });
    this._buttons = [];
  }

  _addActionButton(label, onClick, disabled = false) {
    const i = this._buttons.length;
    const w = PANEL_WIDTH - 28;
    const h = 28;
    const x = this._x + 14 + w / 2;
    const y = this._y + PANEL_HEIGHT - 14 - (i * (h + 6)) - h / 2;

    const bg = this.scene.add.graphics();
    const text = this.scene.add.text(x, y, label, {
      fontSize: '13px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: disabled ? HEX.textMuted : HEX.accent,
      fontStyle: '700'
    }).setOrigin(0.5);

    const draw = (fill, border, color) => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 5);
      bg.lineStyle(1, border, 1);
      bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 5);
      text.setColor(color);
    };

    draw(disabled ? 0x1a1f30 : UI.panel, disabled ? UI.panelBorder : UI.accent,
         disabled ? HEX.textMuted : HEX.accent);

    const zone = this.scene.add.zone(x, y, w, h);
    if (!disabled) {
      zone.setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => draw(0x252c4a, UI.accentBright, HEX.accentBright));
      zone.on('pointerout',  () => draw(UI.panel, UI.accent, HEX.accent));
      zone.on('pointerdown', () => {
        draw(0x1a1f38, UI.accent, HEX.accent);
        onClick();
      });
    }

    this._buttons.push({ bg, text, zone });
  }

  _labelForUnitType(t) {
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Unit';
  }

  destroy() {
    this._unsub.forEach(fn => fn());
    this._clearButtons();
  }
}
