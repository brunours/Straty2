/**
 * @file MainMenuScene.js
 * @description Main menu with stylized background (animated hex pattern +
 * gradient), Cinzel display title, and polished menu buttons.
 * @version 0.4.0
 */

import Phaser from 'phaser';
import { UI, HEX, TERRAIN_PALETTE, PLAYER_PALETTE } from '../config/palette.js';
import { HexGrid } from '../core/HexGrid.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background gradient
    this._drawBackground(width, height);

    // Decorative animated hex field
    this._buildHexField(width, height);

    // Title block
    this._buildTitle(width, height);

    // Menu buttons
    const btnX = width / 2;
    const baseY = height * 0.58;
    this._createButton(btnX, baseY,        'New Game',    () => this.scene.start('GameSetupScene'));
    this._createButton(btnX, baseY + 65,   'Load Game',   () => this._showSoon('Load Game'),     true);
    this._createButton(btnX, baseY + 130,  'Settings',    () => this._showSoon('Settings'),      true);

    // Version footer
    this.add.text(width / 2, height * 0.94, 'v0.4.0 · Cities & Resources', {
      fontSize: '13px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textMuted
    }).setOrigin(0.5);

    this.add.text(width - 12, height - 12, 'Phase 3 build', {
      fontSize: '11px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textMuted
    }).setOrigin(1, 1);
  }

  _drawBackground(w, h) {
    // Layered vertical gradient via stacked rects (cheap & looks good)
    const g = this.add.graphics();
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = this._lerp(0x1d, 0x0d, t);
      const gr = this._lerp(0x24, 0x10, t);
      const b = this._lerp(0x40, 0x20, t);
      const color = (r << 16) | (gr << 8) | b;
      g.fillStyle(color, 1);
      g.fillRect(0, (h / steps) * i, w, h / steps + 1);
    }
  }

  _buildHexField(w, h) {
    // Faint background hex pattern, slowly drifting horizontally
    const container = this.add.container(0, 0).setAlpha(0.15);
    const size = 38;
    const colWidth = size * 1.5;
    const rowHeight = size * Math.sqrt(3);

    const g = this.add.graphics();
    container.add(g);

    const palette = [TERRAIN_PALETTE.grassland.base, TERRAIN_PALETTE.forest.base, TERRAIN_PALETTE.hills.base];

    for (let row = -1; row < Math.ceil(h / rowHeight) + 2; row++) {
      for (let col = -1; col < Math.ceil(w / colWidth) + 2; col++) {
        const cx = col * colWidth;
        const cy = row * rowHeight + (col % 2 === 0 ? 0 : rowHeight / 2);
        const color = palette[(col + row * 3) % palette.length];
        const corners = HexGrid.getHexCorners(cx, cy, size);
        g.fillStyle(color, 1);
        g.beginPath();
        g.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) g.lineTo(corners[i].x, corners[i].y);
        g.closePath();
        g.fillPath();
        g.lineStyle(1, 0x000000, 0.25);
        g.strokePath();
      }
    }

    // Slow horizontal drift
    this.tweens.add({
      targets: container,
      x: -colWidth * 2,
      duration: 60000,
      repeat: -1,
      ease: 'Linear'
    });

    // Vignette overlay
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.55);
    vignette.fillRect(0, 0, w, h);
    // Cut a softer center using a radial-ish ring
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  _buildTitle(w, h) {
    // Glow halo
    const glow = this.add.graphics();
    glow.fillStyle(UI.accent, 0.08);
    glow.fillCircle(w / 2, h * 0.27, 220);
    glow.fillStyle(UI.accent, 0.05);
    glow.fillCircle(w / 2, h * 0.27, 320);

    const title = this.add.text(w / 2, h * 0.24, 'STRATY 2', {
      fontSize: '92px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.accent,
      fontStyle: '900',
      stroke: '#1a1208',
      strokeThickness: 6
    }).setOrigin(0.5).setShadow(0, 4, '#000000', 12, true, true);

    this.add.text(w / 2, h * 0.35, 'BRONZE AGE STRATEGY', {
      fontSize: '20px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: HEX.textSecondary,
      fontStyle: '500',
      letterSpacing: 8
    }).setOrigin(0.5).setAlpha(0.85);

    // Subtle pulse on the title
    this.tweens.add({
      targets: title,
      scale: { from: 1.0, to: 1.025 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Decorative gold horizontal bar
    const bar = this.add.graphics();
    bar.lineStyle(2, UI.accent, 0.7);
    bar.beginPath();
    bar.moveTo(w / 2 - 180, h * 0.41);
    bar.lineTo(w / 2 - 30, h * 0.41);
    bar.moveTo(w / 2 + 30, h * 0.41);
    bar.lineTo(w / 2 + 180, h * 0.41);
    bar.strokePath();
    bar.fillStyle(UI.accent, 0.9);
    bar.fillCircle(w / 2, h * 0.41, 3);
  }

  _createButton(x, y, label, onClick, disabled = false) {
    const btnWidth = 280;
    const btnHeight = 54;

    const bg = this.add.graphics();
    const text = this.add.text(x, y, label, {
      fontSize: '22px',
      fontFamily: 'Cinzel, Georgia, serif',
      color: disabled ? HEX.textMuted : HEX.accent,
      fontStyle: '700'
    }).setOrigin(0.5);

    const draw = (fill, border, textColor) => {
      bg.clear();
      bg.fillStyle(fill, 0.92);
      bg.fillRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 6);
      bg.lineStyle(1.5, border, 1);
      bg.strokeRoundedRect(x - btnWidth / 2, y - btnHeight / 2, btnWidth, btnHeight, 6);
      // Subtle inner highlight line at top
      bg.lineStyle(1, 0xffffff, 0.12);
      bg.beginPath();
      bg.moveTo(x - btnWidth / 2 + 6, y - btnHeight / 2 + 4);
      bg.lineTo(x + btnWidth / 2 - 6, y - btnHeight / 2 + 4);
      bg.strokePath();
      text.setColor(textColor);
    };

    draw(UI.panel, disabled ? UI.panelBorder : UI.accent, disabled ? HEX.textMuted : HEX.accent);

    if (disabled) return;

    const zone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => draw(0x252c4a, UI.accentBright, HEX.accentBright));
    zone.on('pointerout',  () => draw(UI.panel, UI.accent, HEX.accent));
    zone.on('pointerdown', () => {
      draw(0x1a1f38, UI.accent, HEX.accent);
      this.tweens.add({ targets: [text], scale: 0.97, duration: 70, yoyo: true });
      this.time.delayedCall(80, onClick);
    });
  }

  _showSoon(label) {
    // Light toast for unimplemented features
    const { width, height } = this.cameras.main;
    const msg = this.add.text(width / 2, height * 0.88, `${label} — available in a later phase`, {
      fontSize: '14px',
      fontFamily: 'Inter, Arial, sans-serif',
      color: HEX.textSecondary,
      backgroundColor: '#1a1f38',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 200, yoyo: true, hold: 1200, onComplete: () => msg.destroy() });
  }

  _lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }
}
