/**
 * @file HUDPanel.js
 * @description Top bar HUD: current player banner, turn counter, resource
 * pills (food / wood / stone / metal) and End Turn button.
 * Glassmorphic palette-aligned styling.
 * @version 0.4.0
 */

import { GameState } from '../core/GameState.js';
import { EventBus, EVENTS } from '../core/EventBus.js';
import { UI, HEX, RESOURCE_COLORS } from '../config/palette.js';

const HUD_HEIGHT = 52;

const RESOURCE_ORDER = ['food', 'wood', 'stone', 'metal'];
const RESOURCE_GLYPH = {
  food:  '✦',
  wood:  '✿',
  stone: '◆',
  metal: '✸'
};

export class HUDPanel {
  /**
   * @param {Phaser.Scene} scene - The UIScene
   */
  constructor(scene) {
    this.scene = scene;
    const { width } = scene.cameras.main;

    // Bar background
    this._bg = scene.add.graphics();
    this._bg.fillStyle(UI.bg, 0.92);
    this._bg.fillRect(0, 0, width, HUD_HEIGHT);
    // Bottom gold pinstripe
    this._bg.lineStyle(1, UI.accent, 0.55);
    this._bg.lineBetween(0, HUD_HEIGHT - 1, width, HUD_HEIGHT - 1);
    // Subtle top highlight
    this._bg.lineStyle(1, 0xffffff, 0.08);
    this._bg.lineBetween(0, 0, width, 0);

    // Player banner (left side)
    this._playerDot = scene.add.graphics();
    this._playerText = scene.add.text(34, HUD_HEIGHT / 2, '', {
      fontSize: '18px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.textPrimary,
      fontStyle: '700'
    }).setOrigin(0, 0.5);

    // Turn counter
    this._turnText = scene.add.text(width / 2, HUD_HEIGHT / 2, '', {
      fontSize: '15px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textSecondary,
      fontStyle: '500'
    }).setOrigin(0.5);

    // Resource pills (right side, before End Turn)
    this._resPillX = width - 130;
    this._pillTexts = {};
    this._displayed = { food: 0, wood: 0, stone: 0, metal: 0 };
    this._buildResourcePills();

    // End Turn button (far right)
    this._createEndTurnButton(width - 78, HUD_HEIGHT / 2);

    // Listeners
    this._unsub = [];
    this._unsub.push(EventBus.on(EVENTS.TURN_STARTED,     () => this.update()));
    this._unsub.push(EventBus.on(EVENTS.TURN_ENDED,       () => this.update()));
    this._unsub.push(EventBus.on(EVENTS.RESOURCE_CHANGED, () => this.update()));
    this._unsub.push(EventBus.on(EVENTS.CITY_FOUNDED,     () => this.update()));
    this._unsub.push(EventBus.on(EVENTS.CITY_EVOLVED,     () => this.update()));

    this.update();
  }

  _buildResourcePills() {
    let x = this._resPillX;
    const y = HUD_HEIGHT / 2;
    for (const key of RESOURCE_ORDER) {
      const color = RESOURCE_COLORS[key];
      const glyph = this.scene.add.text(x, y, RESOURCE_GLYPH[key], {
        fontSize: '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: this._intToHex(color),
        fontStyle: '700'
      }).setOrigin(0.5);
      const val = this.scene.add.text(x + 14, y, '0', {
        fontSize: '14px',
        fontFamily: 'Inter, Arial, sans-serif',
        color: HEX.textPrimary,
        fontStyle: '500'
      }).setOrigin(0, 0.5);
      this._pillTexts[key] = { glyph, val };
      x -= 90;
    }
  }

  _intToHex(n) {
    return '#' + n.toString(16).padStart(6, '0');
  }

  update() {
    const player = GameState.getCurrentPlayer();
    if (!player) return;

    // Player dot + name
    this._playerDot.clear();
    this._playerDot.fillStyle(0x000000, 0.4);
    this._playerDot.fillCircle(16, HUD_HEIGHT / 2 + 1, 10);
    this._playerDot.fillStyle(player.color, 1);
    this._playerDot.fillCircle(16, HUD_HEIGHT / 2, 9);
    this._playerDot.lineStyle(1.5, 0xffffff, 0.55);
    this._playerDot.strokeCircle(16, HUD_HEIGHT / 2, 9);

    this._playerText.setText(`${player.name}${player.isAI ? ' (AI)' : ''}`);

    // Turn label
    this._turnText.setText(`Turn ${GameState.turnNumber}`);

    // Resources — tween numeric values from current displayed to target
    const target = player.resources || { wood: 0, stone: 0, food: 0, metal: 0 };
    for (const key of RESOURCE_ORDER) {
      const from = this._displayed[key];
      const to = target[key] || 0;
      if (from === to) {
        this._pillTexts[key].val.setText(`${to}`);
        continue;
      }
      this.scene.tweens.addCounter({
        from, to,
        duration: 350,
        ease: 'Cubic.easeOut',
        onUpdate: (tween) => {
          const v = Math.round(tween.getValue());
          this._pillTexts[key].val.setText(`${v}`);
        },
        onComplete: () => this._displayed[key] = to
      });
    }
  }

  _createEndTurnButton(x, y) {
    const btnW = 130;
    const btnH = 34;

    const draw = (fill, border, textColor) => {
      this._endTurnBg.clear();
      this._endTurnBg.fillStyle(fill, 1);
      this._endTurnBg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
      this._endTurnBg.lineStyle(1.5, border, 1);
      this._endTurnBg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, 6);
      this._endTurnText.setColor(textColor);
    };

    this._endTurnBg = this.scene.add.graphics();
    this._endTurnText = this.scene.add.text(x, y, 'End Turn  ▶', {
      fontSize: '14px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.accent,
      fontStyle: '700'
    }).setOrigin(0.5);

    draw(UI.successDark, UI.success, HEX.accent);

    const zone = this.scene.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x3d8830, UI.success, HEX.accentBright));
    zone.on('pointerout',  () => draw(UI.successDark, UI.success, HEX.accent));
    zone.on('pointerdown', () => {
      draw(0x1f4a18, UI.success, HEX.accent);
      this.scene.tweens.add({ targets: [this._endTurnText], scale: 0.95, duration: 80, yoyo: true });
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene && gameScene.turnManager) gameScene.turnManager.endTurn();
    });
  }

  destroy() {
    this._unsub.forEach(fn => fn());
  }
}
