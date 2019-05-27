/** A class representation of the BSON MinKey type. */
export class MinKey {
  readonly _bsontype: string = "MinKey";

  /** bigint bc its numeric value works with number's comparison operators. */
  readonly value: bigint = BigInt("-9223372036854775809");

  /** Creates a minkey from its extended JSON representation. */
  static fromExtendedJSON() {
    return new MinKey();
  }

  /** Extended JSON represtation of a minkey. */
  toExtendedJSON() {
    return { $minKey: this.value };
  }
}
