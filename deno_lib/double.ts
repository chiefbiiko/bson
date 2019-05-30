/** A class representation of the BSON Double type. */
export class Double {
  readonly _bsontype: string = "Double";

  readonly value: number;

  /** Creates a Double type. */
  constructor(value: number | string) {
    switch (typeof value) {
      case "number":
        this.value = value;
        break;
      case "string":
        this.value = parseFloat(value);
        break;
      default:
        throw new TypeError("Input must not be null.");
    }
  }

  /** Creates a double from its extended JSON representation. */
  static fromExtendedJSON(
    doc: { $numberDouble: string },
    options?: { relaxed?: boolean }
  ): number | Double {
    return options && options.relaxed
      ? parseFloat(doc.$numberDouble)
      : new Double(parseFloat(doc.$numberDouble));
  }

  // /** Access the number value. */
  // valueOf(): number {
  //   return this.value;
  // }

  /** JSON representation of a double. */
  toJSON(): { $numberDouble: string } {
    return this.toExtendedJSON() as { $numberDouble: string };
  }

  /** Extended JSON representation of a double. */
  toExtendedJSON(options?: {
    relaxed?: boolean;
  }): number | { $numberDouble: string } {
    // DIRTY WORKAROUND 4 a string representation
    let dbl: string = this.value.toString();
    dbl = !dbl.includes(".") && !dbl.includes("NaN") && !dbl.includes("Infinity") ? `${dbl}.0` : dbl
    return options && options.relaxed && isFinite(this.value)
      ? this.value
      : { $numberDouble: dbl };
  }
}
