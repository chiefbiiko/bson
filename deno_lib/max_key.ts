/** A class representation of the BSON MaxKey type. */
export class MaxKey {
  readonly _bsontype: string = "MaxKey";

  /** Creates a maxkey from its extended JSON representation. */
  static fromExtendedJSON() {
    return new MaxKey();
  }

  /** Extended JSON represtation of a maxkey. */
  toExtendedJSON() {
    return { $maxKey: 1 };
  }
}
