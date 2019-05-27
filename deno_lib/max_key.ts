/** A class representation of the BSON MaxKey type. */
export class MaxKey {
  readonly _bsontype: string = "MaxKey";

  /** bigint bc its numeric value works with number's comparison operators. */
  readonly value: bigint = BigInt("9223372036854775807")

  /** Creates a maxkey from its extended JSON representation. */
  static fromExtendedJSON() {
    return new MaxKey();
  }

  /** Extended JSON represtation of a maxkey. */
  toExtendedJSON() {
    return { $maxKey: this.value };
  }
}
