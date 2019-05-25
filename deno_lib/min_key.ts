/** A class representation of the BSON MinKey type. */
export class MinKey {
  readonly _bsontype: string = "MinKey";

  /** Creates a minkey from its extended JSON representation. */
  static fromExtendedJSON() {
    return new MinKey();
  }

  /** Extended JSON represtation of a minkey. */
  toExtendedJSON() {
    return { $minKey: 1 };
  }
}
