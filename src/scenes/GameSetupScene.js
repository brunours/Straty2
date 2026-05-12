/**
 * @file GameSetupScene.js
 * @description Game setup screen. Configure map size, fog of war, AI
 * difficulty, and the names + types of the first two players. Phase 7
 * will expand this to 3-8 player slots.
 * @version 0.4.0
 */

import Phaser from 'phaser';
import { MAP_SIZES, FOG_MODE } from '../config/constants.js';
import { UI, HEX, PLAYER_PALETTE } from '../config/palette.js';
import { GameState } from '../core/GameState.js';
import { Player } from '../entities/Player.js';

const MAP_SIZE_OPTIONS = Object.keys(MAP_SIZES);
const FOG_OPTIONS = [
  { value: FOG_MODE.NONE, label: 'None' },
  { value: FOG_MODE.EXPLORED_ONLY, label: 'Explored Only' },
  { value: FOG_MODE.FULL, label: 'Full Fog' }
];
const AI_DIFFICULTY_OPTIONS = ['EASY', 'MEDIUM', 'HARD'];

export class GameSetupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameSetupScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    // Same gradient background as MainMenu for continuity
    this._drawBackground(width, height);

    this._settings = {
      mapSize: 'MEDIUM',
      fogMode: FOG_MODE.NONE,
      aiDifficulty: 'MEDIUM',
      player1Name: 'Player 1',
      player2Name: 'Player 2',
      player2IsAI: true
    };

    // Header
    this.add.text(width / 2, 50, 'GAME SETUP', {
      fontSize: '40px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.accent,
      fontStyle: '900',
      stroke: '#1a1208', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(width / 2, 88, 'Configure your scenario', {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textMuted
    }).setOrigin(0.5);

    let yPos = 150;
    const leftCol = width * 0.30;
    const rightCol = width * 0.62;
    const rowGap = 62;

    const label = (text, color = HEX.textSecondary) => this.add.text(leftCol, yPos, text, {
      fontSize: '18px',
      fontFamily: 'Cinzel, Georgia, serif',
      color,
      fontStyle: '500'
    }).setOrigin(0.5);

    label('Map Size');
    this._createCycleButton(rightCol, yPos, MAP_SIZE_OPTIONS, 1,
      v => this._settings.mapSize = v,
      v => MAP_SIZES[v].label);
    yPos += rowGap;

    label('Fog of War');
    this._createCycleButton(rightCol, yPos, FOG_OPTIONS.map(o => o.value), 0,
      v => this._settings.fogMode = v,
      v => FOG_OPTIONS.find(o => o.value === v).label);
    yPos += rowGap;

    label('AI Difficulty');
    this._createCycleButton(rightCol, yPos, AI_DIFFICULTY_OPTIONS, 1,
      v => this._settings.aiDifficulty = v,
      v => v.charAt(0) + v.slice(1).toLowerCase());
    yPos += rowGap;

    // Player 1 (with color swatch)
    this.add.text(leftCol, yPos, 'Player 1', {
      fontSize: '18px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: this._intToHex(PLAYER_PALETTE[0]),
      fontStyle: '700'
    }).setOrigin(0.5);
    this._createEditableText(rightCol, yPos, 'Player 1', v => this._settings.player1Name = v);
    yPos += rowGap;

    this.add.text(leftCol, yPos, 'Player 2', {
      fontSize: '18px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: this._intToHex(PLAYER_PALETTE[1]),
      fontStyle: '700'
    }).setOrigin(0.5);
    this._createEditableText(rightCol, yPos, 'Player 2', v => this._settings.player2Name = v);
    yPos += rowGap;

    label('Player 2 Type');
    this._createCycleButton(rightCol, yPos, [true, false], 0,
      v => this._settings.player2IsAI = v,
      v => v ? 'AI' : 'Human');
    yPos += rowGap + 14;

    // Start
    this._createStartButton(width / 2, yPos + 12);

    // Back
    this._createBackButton(64, height - 36);
  }

  _drawBackground(w, h) {
    const g = this.add.graphics();
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(0x1d + (0x0d - 0x1d) * t);
      const gr = Math.round(0x24 + (0x10 - 0x24) * t);
      const b = Math.round(0x40 + (0x20 - 0x40) * t);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      g.fillRect(0, (h / steps) * i, w, h / steps + 1);
    }
  }

  _intToHex(n) { return '#' + n.toString(16).padStart(6, '0'); }

  _createCycleButton(x, y, options, defaultIndex, onChange, formatLabel) {
    let currentIndex = defaultIndex;
    const btnWidth = 240;
    const btnHeight = 38;

    const bg = this.add.graphics();
    const text = this.add.text(x, y, '', {
      fontSize: '17px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textPrimary,
      fontStyle: '500'
    }).setOrigin(0.5);

    const arrowL = this.add.text(x - btnWidth / 2 + 12, y, '◀', {
      fontSize: '13px', fontFamily: 'Inter, Arial, sans-serif', color: HEX.accent
    }).setOrigin(0, 0.5);
    const arrowR = this.add.text(x + btnWidth / 2 - 12, y, '▶', {
      fontSize: '13px', fontFamily: 'Inter, Arial, sans-serif', color: HEX.accent
    }).setOrigin(1, 0.5);

    const draw = (fill, border) => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 6);
      bg.lineStyle(1.2, border, 1);
      bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 6);
    };

    const setVal = () => {
      const val = options[currentIndex];
      text.setText(formatLabel(val));
    };

    draw(UI.panel, UI.panelBorder);
    setVal();

    const zone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      currentIndex = (currentIndex + 1) % options.length;
      setVal();
      onChange(options[currentIndex]);
    });
    zone.on('pointerover', () => draw(0x252c4a, UI.accent));
    zone.on('pointerout',  () => draw(UI.panel, UI.panelBorder));

    return text;
  }

  _createEditableText(x, y, defaultValue, onChange) {
    const btnWidth = 240;
    const btnHeight = 38;

    const bg = this.add.graphics();
    bg.fillStyle(UI.panel, 1);
    bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 6);
    bg.lineStyle(1.2, UI.panelBorder, 1);
    bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 6);

    const text = this.add.text(x, y, defaultValue, {
      fontSize: '17px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textPrimary
    }).setOrigin(0.5);
    const pencil = this.add.text(x + btnWidth / 2 - 12, y, '✎', {
      fontSize: '14px', fontFamily: 'Inter, Arial, sans-serif', color: HEX.accent
    }).setOrigin(1, 0.5);

    const zone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => {
      const input = prompt('Enter player name:', text.text);
      if (input && input.trim()) {
        const name = input.trim().substring(0, 16);
        text.setText(name);
        onChange(name);
      }
    });

    return text;
  }

  _createStartButton(x, y) {
    const btnWidth = 280;
    const btnHeight = 56;

    const bg = this.add.graphics();
    const text = this.add.text(x, y, 'Start Game  ⚔', {
      fontSize: '24px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.accent,
      fontStyle: '700'
    }).setOrigin(0.5);

    const draw = (fill, border, color) => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 8);
      bg.lineStyle(2, border, 1);
      bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 8);
      text.setColor(color);
    };

    draw(UI.successDark, UI.success, HEX.accent);

    const zone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x3d8830, UI.success, HEX.accentBright));
    zone.on('pointerout',  () => draw(UI.successDark, UI.success, HEX.accent));
    zone.on('pointerdown', () => {
      draw(0x1f4a18, UI.success, HEX.accent);
      this.tweens.add({ targets: [text], scale: 0.96, duration: 80, yoyo: true });
      this.time.delayedCall(90, () => this._startGame());
    });
  }

  _createBackButton(x, y) {
    const text = this.add.text(x, y, '◀ Back', {
      fontSize: '16px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.textMuted
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    text.on('pointerover', () => text.setColor(HEX.accentBright));
    text.on('pointerout',  () => text.setColor(HEX.textMuted));
    text.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }

  _startGame() {
    GameState.reset();
    GameState.settings = { ...this._settings };

    GameState.players = [
      new Player({ index: 0, name: this._settings.player1Name, isAI: false }),
      new Player({
        index: 1,
        name: this._settings.player2Name,
        isAI: this._settings.player2IsAI,
        aiDifficulty: this._settings.aiDifficulty
      })
    ];

    this.scene.start('GameScene');
  }
}
