/** A class representation of the BSON MaxKey type. */
export class MaxKey {
  readonly _bsontype: string = "MaxKey";

  /** bigint bc its numeric value works with number's comparison operators. */
  readonly value: number = Infinity;

  /** Creates a maxkey from its extended JSON representation. */
  static fromExtendedJSON(): MaxKey {
    return new MaxKey();
  }

  /** String representation of a maxkey's value. */
  toString(): string {
    return this.value.toString();
  }

  /** JSON representation of a maxkey. */
  toJSON(): { $maxKey: number } {
    return this.toExtendedJSON();
  }

  /** Extended JSON represtation of a maxkey. */
  toExtendedJSON(): { $maxKey: number } {
    return { $maxKey: this.value };
  }
}
