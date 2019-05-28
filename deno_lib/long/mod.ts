import { Wasm, loadWasm } from "./loadWasm.ts";

const wasm: Wasm = loadWasm();
const INT_CACHE: { [key: number]: Long } = {};
const UINT_CACHE: { [key: number]: Long } = {};

function integer(x: any): boolean {
  return typeof x === "number" && x % 1 === 0;
}

/** A Long class for representing a 64 bit two's-complement integer value. */
export class Long {
  /** An indicator used to reliably determine if an object is a Long or not. */
  protected readonly __isLong__: boolean = true;
  readonly _bsontype: string = "Long";

  readonly low: number;
  readonly high: number;
  protected _unsigned: boolean;

  /**
   * Constructs a 64 bit two's-complement integer, given its low and high 32 bit
   * values as *signed* integers. See the from* functions below for more
   * convenient ways of constructing Longs.
   */
  constructor(low: number, high?: number, unsigned: boolean = false) {
    if (integer(low) && integer(high)) {
      this.low = low | 0;
      this.high = high | 0;
    } else {
      throw new TypeError(`The two topmost params must be integers.`)
    }
    this._unsigned = !!unsigned;
  }

  // The internal representation of a long is the two given signed, 32-bit values.
  // We use 32-bit pieces because these are the size of integers on which
  // Javascript performs bit-operations.  For operations like addition and
  // multiplication, we split each number into 16 bit pieces, which can easily be
  // multiplied within Javascript's floating-point representation without overflow
  // or change in sign.
  //
  // In the algorithms below, we frequently reduce the negative case to the
  // positive case by negating the input(s) and then post-processing the result.
  // Note that we must ALWAYS check specially whether those values are MIN_VALUE
  // (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
  // a positive number, it overflows back into a negative).  Not handling this
  // case would often result in infinite recursion.

  static isLong(x: unknown): boolean {
    return !!x && !!(x as any).__isLong__;
  }

  /** Returns a Long representing the given 32 bit integer value. */
  static fromInt(value: number, unsigned: boolean = false): Long {
    let obj: Long, cachedObj: Long, cache: boolean;
    if (unsigned) {
      value >>>= 0;
      if ((cache = 0 <= value && value < 256)) {
        cachedObj = UINT_CACHE[value];
        if (cachedObj) {
          return cachedObj;
        }
      }
      obj = Long.fromBits(value, (value | 0) < 0 ? -1 : 0, true);
      if (cache) {
        UINT_CACHE[value] = obj;
      }
      return obj;
    } else {
      value |= 0;
      if ((cache = -128 <= value && value < 128)) {
        cachedObj = INT_CACHE[value];
        if (cachedObj) {
          return cachedObj;
        }
      }
      obj = Long.fromBits(value, value < 0 ? -1 : 0, false);
      if (cache) {
        INT_CACHE[value] = obj;
      }
      return obj;
    }
  }

  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number. Otherwise, zero is returned.
   */
  static fromNumber(value: number, unsigned: boolean = false): Long {
    if (Number.isNaN(value)) {
      return unsigned ? UZERO : ZERO;
    }
    if (unsigned) {
      if (value < 0) {
        return UZERO;
      }
      if (value >= TWO_PWR_64_DBL) {
        return MAX_UNSIGNED_VALUE;
      }
    } else {
      if (value <= -TWO_PWR_63_DBL) {
        return MIN_VALUE;
      }
      if (value + 1 >= TWO_PWR_63_DBL) {
        return MAX_VALUE;
      }
    }
    if (value < 0) {
      return Long.fromNumber(-value, unsigned).negate();
    }
    return Long.fromBits(
      value % TWO_PWR_32_DBL | 0,
      (value / TWO_PWR_32_DBL) | 0,
      unsigned
    );
  }

  /**
   * Returns a Long representing the 64 bit integer that comes by concatenating
   * the given low and high bits. Each is assumed to use 32 bits.
   */
  static fromBits(
    lowBits: number,
    highBits: number,
    unsigned: boolean = false
  ): Long {
    return new Long(lowBits, highBits, unsigned);
  }

  /**
   * Returns a Long representation of the given string, written using the
   * specified radix.
   */
  static fromString(
    str: string,
    radix: number = 10,
    unsigned: boolean = false
  ): Long {
    if (str.length === 0) {
      throw Error("Empty string.");
    }
    if (
      str === "NaN" ||
      str === "Infinity" ||
      str === "+Infinity" ||
      str === "-Infinity"
    ) {
      return ZERO;
    }
    // if (typeof unsigned === 'number') {
    //     // For goog.math.long compatibility
    //     radix = unsigned,
    //     unsigned = false;
    // } else {
    //     unsigned = !! unsigned;
    // }
    if (radix < 2 || 36 < radix) {
      throw RangeError("Invalid radix.");
    }

    let p: number;
    if ((p = str.indexOf("-")) > 0) {
      throw Error("Interior hyphen.");
    } else if (p === 0) {
      return Long.fromString(str.substring(1), radix, unsigned).negate();
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    let radixToPower: Long = Long.fromNumber(Math.pow(radix, 8));

    let result: Long = ZERO;
    for (let i: number = 0; i < str.length; i += 8) {
      const size: number = Math.min(8, str.length - i),
        value: number = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        const power: Long = Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(Long.fromNumber(value));
      }
    }
    result._unsigned = unsigned;
    return result;
  }

  /**
   * Converts the specified value to a Long using the appropriate from* function
   *  for its type.
   */
  static fromValue(
    val: number | string | Long,
    unsigned: boolean = false
  ): Long {
    if (typeof val === "number") {
      return Long.fromNumber(val, unsigned);
    }
    if (typeof val === "string") {
      return Long.fromString(val, 10, unsigned);
    }
    // Throws for non-objects, converts non-instanceof Long:
    return Long.fromBits(
      val.low,
      val.high,
      typeof unsigned === "boolean" ? unsigned : val.unsigned
    );
  }

  /** Creates a long  from its extended JSON representation.  */
  static fromExtendedJSON(
    doc: { [key: string]: any },
    options?: { relaxed?: boolean }
  ): number | Long {
    const result: Long = Long.fromString(doc.$numberLong);
    return options && options.relaxed ? result.toNumber() : result;
  }

  /** Creates a Long from its byte representation. */
  static fromBytes(
    bytes: Uint8Array,
    unsigned: boolean = false,
    le: boolean = false
  ): Long {
    return le
      ? Long.fromBytesLE(bytes, unsigned)
      : Long.fromBytesBE(bytes, unsigned);
  }

  /** Creates a Long from its little endian byte representation. */
  static fromBytesLE(bytes: Uint8Array, unsigned: boolean = false): Long {
    return new Long(
      bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24),
      bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24),
      unsigned
    );
  }

  /** Creates a Long from its big endian byte representation. */
  static fromBytesBE(bytes: Uint8Array, unsigned: boolean = false): Long {
    return new Long(
      (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7],
      (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3],
      unsigned
    );
  }

  get unsigned(): boolean {
    return this._unsigned;
  }

  /** Converts the Long to a 32 bit integer, assuming it is a 32 bit integer. */
  toInt(): number {
    return this._unsigned ? this.low >>> 0 : this.low;
  }

  /**
   * Converts the Long to a the nearest floating-point representation of this
   * value (double, 53 bit mantissa).
   */
  toNumber(): number {
    if (this._unsigned) {
      return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
    }
    return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
  }

  /** Gets the high 32 bits as a signed integer. */
  getHighBits(): number {
    return this.high;
  }

  /** Gets the high 32 bits as an unsigned integer. */
  getHighBitsUnsigned(): number {
    return this.high >>> 0;
  }

  /** Gets the low 32 bits as a signed integer. */
  getLowBits(): number {
    return this.low;
  }

  /** Gets the low 32 bits as an unsigned integer. */
  getLowBitsUnsigned(): number {
    return this.low >>> 0;
  }

  /** Gets the number of bits needed to represent the absolute value of this. */
  getNumBitsAbs(): number {
    if (this.isNegative()) {
      // Unsigned Longs are never negative
      return this.equals(MIN_VALUE) ? 64 : this.negate().getNumBitsAbs();
    }
    let val: number = this.high != 0 ? this.high : this.low;
    let bit: number = 31;
    for (; bit > 0; bit--) {
      if ((val & (1 << bit)) != 0) {
        break;
      }
    }
    return this.high != 0 ? bit + 33 : bit + 1;
  }

  /** Tests if this Long's value equals zero. */
  isZero(): boolean {
    return this.high === 0 && this.low === 0;
  }

  /** Tests if this Long's value is negative. */
  isNegative(): boolean {
    return !this._unsigned && this.high < 0;
  }

  /** Tests if this Long's value is positive. */
  isPositive(): boolean {
    return this._unsigned || this.high >= 0;
  }

  /** Tests if this Long's value is odd. */
  isOdd(): boolean {
    return (this.low & 1) === 1;
  }

  /** Tests if this Long's value is even. */
  isEven(): boolean {
    return (this.low & 1) === 0;
  }

  /** Tests if this Long's value equals the specified's. */
  equals(other: number | string | Long): boolean {
    if (!Long.isLong(other)) {
      other = Long.fromValue(other);
    } else {
      other = other as Long;
    }
    if (
      this._unsigned !== other._unsigned &&
      this.high >>> 31 === 1 &&
      other.high >>> 31 === 1
    ) {
      return false;
    }
    return this.high === other.high && this.low === other.low;
  }

  /** Tests if this Long's value differs from the specified's. */
  notEquals(other: number | string | Long): boolean {
    return !this.equals(/* validates */ other);
  }

  /** Tests if this Long's value is less than the specified's. */
  lessThan(other: number | string | Long): boolean {
    return this.compare(/* validates */ other) < 0;
  }

  /** Tests if this Long's value is less than or equal the specified's. */
  lessThanOrEqual(other: number | string | Long): boolean {
    return this.compare(/* validates */ other) <= 0;
  }

  /** Tests if this Long's value is greater than the specified's. */
  greaterThan(other: number | string | Long): boolean {
    return this.compare(/* validates */ other) > 0;
  }

  /** Tests if this Long's value is greater than or equal the specified's. */
  greaterThanOrEqual(other: number | string | Long): boolean {
    return this.compare(/* validates */ other) >= 0;
  }

  /** Compares this Long's value with the specified's. */
  compare(other: number | string | Long): number {
    if (!Long.isLong(other)) {
      other = Long.fromValue(other);
    } else {
      other = other as Long;
    }
    if (this.equals(other)) {
      return 0;
    }
    const thisNeg: boolean = this.isNegative(),
      otherNeg: boolean = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // At this point the sign bits are the same
    if (!this._unsigned) {
      return this.subtract(other).isNegative() ? -1 : 1;
    }
    // Both are positive if at least one is unsigned
    return other.high >>> 0 > this.high >>> 0 ||
      (other.high === this.high && other.low >>> 0 > this.low >>> 0)
      ? -1
      : 1;
  }

  /** Negates this Long's value. */
  negate(): Long {
    if (!this._unsigned && this.equals(MIN_VALUE)) {
      return MIN_VALUE;
    }
    return this.not().add(ONE);
  }

  /** Returns the sum of this and the specified Long. */
  add(addend: number | string | Long): Long {
    if (!Long.isLong(addend)) {
      addend = Long.fromValue(addend);
    } else {
      addend = addend as Long;
    }

    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    const a48 = this.high >>> 16;
    const a32 = this.high & 0xffff;
    const a16 = this.low >>> 16;
    const a00 = this.low & 0xffff;

    const b48 = addend.high >>> 16;
    const b32 = addend.high & 0xffff;
    const b16 = addend.low >>> 16;
    const b00 = addend.low & 0xffff;

    let c48 = 0,
      c32 = 0,
      c16 = 0,
      c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xffff;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xffff;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xffff;
    c48 += a48 + b48;
    c48 &= 0xffff;
    return Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32, this._unsigned);
  }

  /** Returns the difference of this and the specified Long. */
  subtract(subtrahend: number | string | Long): Long {
    if (!Long.isLong(subtrahend)) {
      subtrahend = Long.fromValue(subtrahend);
    } else {
      subtrahend = subtrahend as Long;
    }
    return this.add(subtrahend.negate());
  }

  /** Returns the product of this and the specified Long. */
  multiply(multiplier: number | string | Long): Long {
    if (this.isZero()) {
      return ZERO;
    }
    if (!Long.isLong(multiplier)) {
      multiplier = Long.fromValue(multiplier);
    } else {
      multiplier = multiplier as Long;
    }
    const low: number = wasm.exports.mul(
      this.low,
      this.high,
      multiplier.low,
      multiplier.high
    );
    const high: number = wasm.exports.get_high();
    return Long.fromBits(low, high, this._unsigned);
  }

  /**
   * Returns this Long divided by the specified. The result is signed if this Long is signed or
   *  unsigned if this Long is unsigned.
   */
  divide(divisor: number | string | Long): Long {
    if (!Long.isLong(divisor)) {
      divisor = Long.fromValue(divisor);
    } else {
      divisor = divisor as Long;
    }
    if (divisor.isZero()) {
      throw Error("Division by zero.");
    }
    // Guard against signed division overflow: the largest
    // negative number / -1 would be 1 larger than the largest
    // positive number, due to two's complement.
    if (
      !this._unsigned &&
      this.high === -0x80000000 &&
      divisor.low === -1 &&
      divisor.high === -1
    ) {
      // be consistent with non-wasm code path
      return this;
    }
    let low: number;
    if (this._unsigned) {
      low = wasm.exports.div_u(this.low, this.high, divisor.low, divisor.high);
    } else {
      low = wasm.exports.div_s(this.low, this.high, divisor.low, divisor.high);
    }
    const high: number = wasm.exports.get_high();
    return Long.fromBits(low, high, this._unsigned);
  }

  /** Returns this Long modulo the specified. */
  modulo(divisor: number | string | Long): Long {
    if (!Long.isLong(divisor)) {
      divisor = Long.fromValue(divisor);
    } else {
      divisor = divisor as Long;
    }
    let low: number;
    if (this._unsigned) {
      low = wasm.exports.rem_u(this.low, this.high, divisor.low, divisor.high);
    } else {
      low = wasm.exports.rem_s(this.low, this.high, divisor.low, divisor.high);
    }
    const high: number = wasm.exports.get_high();
    return Long.fromBits(low, high, this._unsigned);
  }

  /**  Returns the bitwise NOT of this Long. */
  not() {
    return Long.fromBits(~this.low, ~this.high, this._unsigned);
  }

  /** Returns the bitwise AND of this Long and the specified. */
  and(other: number | string | Long): Long {
    if (!Long.isLong(other)) {
      other = Long.fromValue(other);
    } else {
      other = other as Long;
    }
    return Long.fromBits(
      this.low & other.low,
      this.high & other.high,
      this._unsigned
    );
  }

  /** Returns the bitwise OR of this Long and the specified. */
  or(other: number | string | Long): Long {
    if (!Long.isLong(other)) {
      other = Long.fromValue(other);
    } else {
      other = other as Long;
    }
    return Long.fromBits(
      this.low | other.low,
      this.high | other.high,
      this._unsigned
    );
  }

  /** Returns the bitwise XOR of this Long and the given one. */
  xor(other: number | string | Long): Long {
    if (!Long.isLong(other)) {
      other = Long.fromValue(other);
    } else {
      other = other as Long;
    }
    return Long.fromBits(
      this.low ^ other.low,
      this.high ^ other.high,
      this._unsigned
    );
  }

  /** Returns this Long with bits shifted to the left by the given amount. */
  shiftLeft(numBits: number | Long): Long {
    if (Long.isLong(numBits)) {
      numBits = (numBits as Long).toInt() as number;
    } else {
      numBits = numBits as number;
    }
    if ((numBits &= 63) === 0) {
      return this;
    } else if (numBits < 32) {
      return Long.fromBits(
        this.low << numBits,
        (this.high << numBits) | (this.low >>> (32 - numBits)),
        this._unsigned
      );
    } else {
      return Long.fromBits(0, this.low << (numBits - 32), this._unsigned);
    }
  }

  /**
   * Returns this Long with bits arithmetically shifted to the right by the
   * given amount.
   */
  shiftRight(numBits: number | Long): Long {
    if (Long.isLong(numBits)) {
      numBits = (numBits as Long).toInt() as number;
    } else {
      numBits = numBits as number;
    }
    if ((numBits &= 63) === 0) {
      return this;
    } else if (numBits < 32) {
      return Long.fromBits(
        (this.low >>> numBits) | (this.high << (32 - numBits)),
        this.high >> numBits,
        this._unsigned
      );
    } else {
      return Long.fromBits(
        this.high >> (numBits - 32),
        this.high >= 0 ? 0 : -1,
        this._unsigned
      );
    }
  }

  /**
   * Returns this Long with bits logically shifted to the right by the given
   * amount.
   */
  shiftRightUnsigned(numBits: number | Long): Long {
    if (Long.isLong(numBits)) {
      numBits = (numBits as Long).toInt();
    } else {
      numBits = numBits as number;
    }
    if ((numBits &= 63) === 0) {
      return this;
    }
    if (numBits < 32) {
      return Long.fromBits(
        (this.low >>> numBits) | (this.high << (32 - numBits)),
        this.high >>> numBits,
        this._unsigned
      );
    }
    if (numBits === 32) {
      return Long.fromBits(this.high, 0, this._unsigned);
    }
    return Long.fromBits(this.high >>> (numBits - 32), 0, this._unsigned);
  }

  /** Returns this Long with bits rotated to the left by the given amount. */
  rotateLeft(numBits: number | Long): Long {
    let b: number;
    if (Long.isLong(numBits)) {
      numBits = (numBits as Long).toInt();
    } else {
      numBits = numBits as number;
    }
    if ((numBits &= 63) === 0) {
      return this;
    }
    if (numBits === 32) {
      return Long.fromBits(this.high, this.low, this._unsigned);
    }
    if (numBits < 32) {
      b = 32 - numBits;
      return Long.fromBits(
        (this.low << numBits) | (this.high >>> b),
        (this.high << numBits) | (this.low >>> b),
        this._unsigned
      );
    }
    numBits -= 32;
    b = 32 - numBits;
    return Long.fromBits(
      (this.high << numBits) | (this.low >>> b),
      (this.low << numBits) | (this.high >>> b),
      this._unsigned
    );
  }

  /** Returns this Long with bits rotated to the right by the given amount. */
  rotateRight(numBits: number | Long): Long {
    let b: number;
    if (Long.isLong(numBits)) {
      numBits = (numBits as Long).toInt() as number;
    } else {
      numBits = numBits as number;
    }
    if ((numBits &= 63) === 0) {
      return this;
    }
    if (numBits === 32) {
      return Long.fromBits(this.high, this.low, this._unsigned);
    }
    if (numBits < 32) {
      b = 32 - numBits;
      return Long.fromBits(
        (this.high << b) | (this.low >>> numBits),
        (this.low << b) | (this.high >>> numBits),
        this._unsigned
      );
    }
    numBits -= 32;
    b = 32 - numBits;
    return Long.fromBits(
      (this.low << b) | (this.high >>> numBits),
      (this.high << b) | (this.low >>> numBits),
      this._unsigned
    );
  }

  /** Converts this Long to signed. */
  toSigned() {
    if (!this._unsigned) return this;
    return Long.fromBits(this.low, this.high, false);
  }

  /** Converts this Long to unsigned. */
  toUnsigned() {
    if (this._unsigned) return this;
    return Long.fromBits(this.low, this.high, true);
  }

  /** Converts this Long to its byte representation. */
  toBytes(le: boolean = false): Uint8Array {
    return le ? this.toBytesLE() : this.toBytesBE();
  }

  /** Converts this Long to its little endian byte representation. */
  toBytesLE(): Uint8Array {
    let hi: number = this.high,
      lo: number = this.low;
    return Uint8Array.from([
      lo & 0xff,
      (lo >>> 8) & 0xff,
      (lo >>> 16) & 0xff,
      lo >>> 24,
      hi & 0xff,
      (hi >>> 8) & 0xff,
      (hi >>> 16) & 0xff,
      hi >>> 24
    ]);
  }

  /** Converts this Long to its big endian byte representation. */
  toBytesBE(): Uint8Array {
    var hi = this.high,
      lo = this.low;
    return Uint8Array.from([
      hi >>> 24,
      (hi >>> 16) & 0xff,
      (hi >>> 8) & 0xff,
      hi & 0xff,
      lo >>> 24,
      (lo >>> 16) & 0xff,
      (lo >>> 8) & 0xff,
      lo & 0xff
    ]);
  }

  /** Converts the Long to a string written in the specified radix. */
  toString(radix: number = 10): string {
    if (radix < 2 || 36 < radix) {
      throw RangeError("Invalid radix.");
    }
    if (this.isZero()) {
      return "0";
    }
    if (this.isNegative()) {
      // Unsigned Longs are never negative
      if (this.equals(MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        let radixLong: Long = Long.fromNumber(radix),
          div: Long = this.divide(radixLong),
          rem1: Long = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem1.toInt().toString(radix);
      } else return "-" + this.negate().toString(radix);
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    let radixToPower: Long = Long.fromNumber(
        Math.pow(radix, 6),
        this._unsigned
      ),
      rem: Long = this;
    let result: string = "";
    for (;;) {
      let remDiv: Long = rem.divide(radixToPower),
        intval: number =
          rem.subtract(remDiv.multiply(radixToPower)).toInt() >>> 0,
        digits: string = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = "0" + digits;
        }
        result = "" + digits + result;
      }
    }
  }

  /** Extended JSON representation of a long. */
  toExtendedJSON(options?: {
    relaxed?: boolean;
  }): number | { [key: string]: any } {
    if (options && options.relaxed) {
      return this.toNumber();
    }
    return { $numberLong: this.toString() };
  }
}

export const TWO_PWR_16_DBL: number = 1 << 16;
export const TWO_PWR_32_DBL: number = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
export const TWO_PWR_64_DBL: number = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
export const TWO_PWR_63_DBL: number = TWO_PWR_64_DBL / 2;

export const ZERO: Long = Long.fromInt(0);
export const UZERO: Long = Long.fromInt(0, true);
export const ONE: Long = Long.fromInt(1);
export const UONE: Long = Long.fromInt(1, true);
export const NEG_ONE: Long = Long.fromInt(-1);

export const MAX_VALUE: Long = Long.fromBits(
  0xffffffff | 0,
  0x7fffffff | 0,
  false
);
export const MAX_UNSIGNED_VALUE: Long = Long.fromBits(
  0xffffffff | 0,
  0xffffffff | 0,
  true
);
export const MIN_VALUE: Long = Long.fromBits(0, 0x80000000 | 0, false);
