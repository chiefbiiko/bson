/** A class representation of the BSON Symbol type. */
export class BSONSymbol {
  readonly _bsontype: string = "BSONSymbol";

  readonly value: string;

  /** Create a Symbol instance. */
  constructor(value: string) {
    this.value = value;
  }

  /** Creates a symbol from its extended JSON representation. */
  static fromExtendedJSON(doc: { $symbol: string }): BSONSymbol {
    return new BSONSymbol(doc.$symbol);
  }

  /** Access the wrapped string value. */
  valueOf(): string {
    return this.value;
  }

  /** String representatin of a symbol. */
  inspect(): string {
    return this.toString();
  }

  /** Extendedd JSON representation of a symbol. */
  toExtendedJSON(): { $symbol: string } {
    return { $symbol: this.value };
  }
  
  /** JSON representation of a szymbol. */
  toJSON(): { $symbol: string } {
    return this.toExtendedJSON();
  }
  
  /** String representatin of a symbol. */
  toString(): string {
    return this.value;
  }
}
