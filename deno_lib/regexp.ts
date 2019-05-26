/** A class representation of the BSON RegExp type. */
export class BSONRegExp {
  readonly _bsontype: string = "BSONRegExp";

  readonly pattern: string;
  readonly options: string;

  /** Creates a RegExp type. */
  constructor(pattern: string, options?: string) {
    this.pattern = pattern || "";
    this.options = options ? BSONRegExp.alphabetize(options) : "";
    const invalid: any[] = this.options.match(/[^ixmlsu]/g);
    if (invalid) {
      throw new TypeError(
        `Option [${invalid[0]}] is not supported by BSONRegExp.`
      );
    }
  }

  /** Sorts lexicpgraphically. */
  static alphabetize(str: string): string {
    return str
      .split("")
      .sort()
      .join("");
  }

  /** Creates a BSONRegExp instance from its extended JSON representation. */
  static fromExtendedJSON(doc: {
    $regularExpression: { pattern: string; options: string };
  }): BSONRegExp {
    return new BSONRegExp(
      doc.$regularExpression.pattern,
      doc.$regularExpression.options
    );
  }

  /** Extended JSON representation of a BSONRegExp instance. */
  toExtendedJSON(): {
    $regularExpression: { pattern: string; options: string };
  } {
    return {
      $regularExpression: { pattern: this.pattern, options: this.options }
    };
  }
}
