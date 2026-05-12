/**
 * @file ResourceNode.js
 * @description Resource node entity. A discoverable point of interest on
 * a hex that grants bonus resources when worked. In Phase 3 they exist
 * passively as visual markers and contribute via territory income; active
 * gathering by Worker units arrives in Phase 4.
 * @version 0.4.0
 */

export class ResourceNode {
  /**
   * @param {Object} opts
   * @param {number} opts.q
   * @param {number} opts.r
   * @param {string} opts.type - 'food' | 'wood' | 'stone' | 'metal'
   * @param {number} [opts.amount=Infinity] - Optional finite stockpile
   */
  constructor({ q, r, type, amount = Infinity }) {
    this.q = q;
    this.r = r;
    this.type = type;
    this.amount = amount;
    this.workedBy = null; // unit id once a worker is assigned (Phase 4)
  }

  toJSON() {
    return { q: this.q, r: this.r, type: this.type, amount: this.amount, workedBy: this.workedBy };
  }

  static fromJSON(json) {
    const n = new ResourceNode({ q: json.q, r: json.r, type: json.type, amount: json.amount });
    n.workedBy = json.workedBy || null;
    return n;
  }
}
