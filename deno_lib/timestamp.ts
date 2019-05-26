import { MAX_UNSIGNED_VALUE, Long } from "./long/mod.ts";

/** A class representation of the BSON Timestamp type. */
export class Timestamp extends Long {
  static MAX_VALUE: Long = MAX_UNSIGNED_VALUE;
  readonly _bsontype: string = "Timestamp";

  low: number;
  high: number;
  unsigned: boolean;

  constructor(low: number | Long, high?: number) {
    super(...(Long.isLong(low) ? [low.low, low.high] : [low, high]), true);
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
    return new Timestamp(Long.fromString(str, true, radix));
  }

  /** Creates a timestamp from a string, optionally using the given radix. */
  static fromExtendedJSON(doc: {
    $timestamp: { t: number; i: number };
  }): Timestamp {
    return new Timestamp(doc.$timestamp.i, doc.$timestamp.t);
  }

  /** JSON representation of a timestamp. */
  toJSON(): { $timestamp: string } {
    return { $timestamp: this.toString() };
  }

  /** Extended JSON representation of a timestamp. */
  toExtendedJSON(): { $timestamp: { t: number; i: number } } {
    return { $timestamp: { t: this.high >>> 0, i: this.low >>> 0 } };
  }
}
