import { Long } from "./long/mod.ts";

/** A class representation of the BSON MinKey type. */
export class MinKey {
  readonly _bsontype: string = "MinKey";

  /** bigint bc its numeric value works with number's comparison operators. */
  readonly value: Long = Long.fromString("-9223372036854775808");

  /** Creates a minkey from its extended JSON representation. */
  static fromExtendedJSON() {
    return new MinKey();
  }
  
  /** String representation of a minkey's value. */
  toString(): string {
    return this.value.toString();
  }

  /** Extended JSON represtation of a minkey. */
  toExtendedJSON() {
    return { $minKey: this.value.toString() };
  }
}
