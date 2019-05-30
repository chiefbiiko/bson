import { MAX_UNSIGNED_VALUE, Long } from "./long/mod.ts";

function assembleSuperParams(
  low?: number | Long | Timestamp,
  high?: number
): [number, number, boolean] {
  if (typeof low === "number" && typeof high === "number") {
    return [low, high, true];
  } else if (low instanceof Timestamp || low instanceof Long) {
    return [low.low, low.high, true];
  } else {
    const time: Long = Long.fromInt(new Date().getTime());
    return [time.low, time.high, true];
  }
}

export const MAX_VALUE: Long = MAX_UNSIGNED_VALUE;

/** A class representation of the BSON Timestamp type. */
export class Timestamp extends Long {
  readonly _bsontype: string = "Timestamp";

  low: number;
  high: number;
  unsigned: boolean;

  constructor(low?: number | Long | Timestamp, high?: number) {
    super(...assembleSuperParams(low, high));
  }

  /** Returns a Timestamp represented by the given (32-bit) integer value.  */
  static fromInt(value: number): Timestamp {
    return new Timestamp(Long.fromInt(value, true));
  }

  /**
   * Returns a Timestamp representing the given number value, provided that it
   * is a finite number. Otherwise, zero is returned.
   */
  static fromNumber(value: number): Timestamp {
    return new Timestamp(Long.fromNumber(value, true));
  }

  /**
   * Returns a Timestamp for the given high and low bits. Each is assumed to
   * use 32 bits.
   */
  static fromBits(lowBits: number, highBits: number): Timestamp {
    return new Timestamp(lowBits, highBits);
  }

  /** Creates a timestamp from a string, optionally using the given radix. */
  static fromString(str: string, radix: number = 10) {
    return new Timestamp(Long.fromString(str, radix, true));
  }

  /** Creates a timestamp from a string, optionally using the given radix. */
  static fromExtendedJSON(doc: {
    $timestamp: { t: number; i: number };
  }): Timestamp {
    return new Timestamp(doc.$timestamp.i, doc.$timestamp.t);
  }

  /** JSON representation of a timestamp. */
  toJSON(): { $timestamp: { t: number; i: number } } {
    return this.toExtendedJSON();
  }

  /** Extended JSON representation of a timestamp. */
  toExtendedJSON(): { $timestamp: { t: number; i: number } } {
    return { $timestamp: { t: this.high >>> 0, i: this.low >>> 0 } };
  }
}
