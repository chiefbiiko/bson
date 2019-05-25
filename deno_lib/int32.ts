/** A class representation of a BSON Int32 type. */
export class Int32 {
  readonly _bsontype: string = "Int32";

  readonly value: number;

  /** Creates an Int32 type. */
  constructor(value: number | string) {
    switch (typeof value) {
      case "number":
        this.value = value;
        break;
      case "string":
        this.value = parseInt(value, 10);
        break;
      default:
        throw new TypeError("Input must not be null.");
    }
  }

  /** Creates a n int32 from its extended JSON representation. */
  static fromExtendedJSON(
    doc: { $numberInt: string },
    options?: { relaxed?: boolean }
  ) {
    return options && options.relaxed
      ? parseInt(doc.$numberInt, 10)
      : new Int32(doc.$numberInt);
  }

  /**  Access the number value.*/
  valueOf(): number {
    return this.value;
  }

  /** JSON representation of an int32. */
  toJSON(): number {
    return this.value;
  }

  /** Extended JSON representation of an int32. */
  toExtendedJSON(options?: {
    relaxed?: boolean;
  }): number | { $numberInt: string } {
    return options && options.relaxed
      ? this.value
      : { $numberInt: this.value.toString() };
  }
}
