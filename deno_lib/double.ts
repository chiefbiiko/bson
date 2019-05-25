/** A class representation of the BSON Double type. */
export class Double {
  readonly _bsontype: string = "Double";
  
  readonly value: number;
  
  /** Creates a Double type. */
  constructor(value: number) {
    this.value = value;
  }

  /** Creates a double from its extended JSON representation. */
  static fromExtendedJSON(doc: { $numberDouble: string }, options?: { relaxed?: boolean }): number | Double {
    return options && options.relaxed
      ? parseFloat(doc.$numberDouble)
      : new Double(parseFloat(doc.$numberDouble));
  }

  /** Access the number value. */
  valueOf(): number {
    return this.value;
  }

  /** JSON fragment representation of a double. */
  toJSON(): number {
    return this.value;
  }

  /** Extended JSON representation of a double. */
  toExtendedJSON(options?: { relaxed?: boolean }): number | { $numberDouble: string } {
    if (options && options.relaxed && isFinite(this.value)) {
      return this.value;
    }
    return { $numberDouble: this.value.toString() };
  }
}
