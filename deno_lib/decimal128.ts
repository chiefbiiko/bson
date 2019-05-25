// 'use strict';
//
// let Long = require('./long');
// const Buffer = require('buffer').Buffer;

import { ZERO, Long } from "./long/mod.ts";

const PARSE_STRING_REGEXP: RegExp = /^(\+|-)?(\d+|(\d*\.\d*))?(E|e)?([-+])?(\d+)?$/;
const PARSE_INF_REGEXP: RegExp = /^(\+|-)?(Infinity|inf)$/i;
const PARSE_NAN_REGEXP: RegExp = /^(\+|-)?NaN$/i;
const EXPONENT_REGEX: RegExp = /^([-+])?(\d+)?$/;

const EXPONENT_MAX: number = 6111;
const EXPONENT_MIN: number = -6176;
const EXPONENT_BIAS: number = 6176;
const MAX_DIGITS: number = 34;

// Extract least significant 5 bits
const COMBINATION_MASK = 0x1f;
// Extract least significant 14 bits
const EXPONENT_MASK = 0x3fff;
// Value of combination field for Inf
const COMBINATION_INFINITY = 30;
// Value of combination field for NaN
const COMBINATION_NAN = 31;

// Nan value bits as 32 bit values (due to lack of longs)
const NAN_BUF: number[] = [
  0x7c,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00
].reverse();
// Infinity value bits 32 bit values (due to lack of longs)
const INF_NEGATIVE_BUF: number[] = [
  0xf8,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00
].reverse();
const INF_POSITIVE_BUF: number[] = [
  0x78,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00
].reverse();

/** Detects if the value is a digit. */
function isDigit(value: unknown): boolean {
  return !Number.isNaN(parseInt(value as any, 10));
}

/** Divide two uint128 values. */
function divideu128(value: {
  parts: number[];
}): { quotient: { parts: number[] }; rem: Long } {
  const DIVISOR: Long = Long.fromNumber(1000 * 1000 * 1000);
  let _rem: Long = Long.fromNumber(0);

  if (
    !value.parts[0] &&
    !value.parts[1] &&
    !value.parts[2] &&
    !value.parts[3]
  ) {
    return { quotient: value, rem: _rem };
  }

  for (let i: number = 0; i <= 3; i++) {
    // Adjust remainder to match value of next dividend
    _rem = _rem.shiftLeft(32);
    // Add the divided to _rem
    _rem = _rem.add(new Long(value.parts[i], 0));
    value.parts[i] = _rem.divide(DIVISOR).low;
    _rem = _rem.modulo(DIVISOR);
  }

  return { quotient: value, rem: _rem };
}

/** Multiplies two Long values and return the 128 bit value. */
function multiply64x2(left: Long, right: Long): { high: Long; low: Long } {
  if (!left && !right) {
    return { high: Long.fromNumber(0), low: Long.fromNumber(0) };
  }

  const leftHigh: Long = left.shiftRightUnsigned(32);
  const leftLow: Long = new Long(left.getLowBits(), 0);
  const rightHigh: Long = right.shiftRightUnsigned(32);
  const rightLow: Long = new Long(right.getLowBits(), 0);

  let productHigh: Long = leftHigh.multiply(rightHigh);
  let productMid: Long = leftHigh.multiply(rightLow);
  const productMid2: Long = leftLow.multiply(rightHigh);
  let productLow: Long = leftLow.multiply(rightLow);

  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
  productMid = new Long(productMid.getLowBits(), 0)
    .add(productMid2)
    .add(productLow.shiftRightUnsigned(32));

  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
  productLow = productMid
    .shiftLeft(32)
    .add(new Long(productLow.getLowBits(), 0));

  // Return the 128 bit result
  return { high: productHigh, low: productLow };
}

/** A class representation of the BSON Decimal128 type. */
export class Decimal128 {
  readonly _bsontype: "Decimal128";

  readonly bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  /** Create a Decimal128 instance from a string representation. */
  static fromString(str: string): Decimal128 {
    // Parse state tracking
    let isNegative: boolean = false;
    let sawRadix: boolean = false;
    let foundNonZero: boolean = false;

    // Total number of significant digits (no leading or trailing zero)
    let significantDigits: number = 0;
    // Total number of significand digits read
    let nDigitsRead: number = 0;
    // Total number of digits (no leading zeros)
    let nDigits: number = 0;
    // The number of the digits after radix
    let radixPosition: number = 0;
    // The index of the first non-zero in *str*
    let firstNonZero: number = 0;

    // Digits Array
    const digits: number[] = [0];
    // The number of digits in digits
    let nDigitsStored: number = 0;
    // Insertion pointer for digits
    let digitsInsert: number = 0;
    // The index of the first non-zero digit
    let firstDigit: number = 0;
    // The index of the last digit
    let lastDigit: number = 0;

    // Exponent
    let exponent: number = 0;
    // loop index over array
    let i: number = 0;
    // The high 17 digits of the significand
    let significandHigh: Long;
    // The low 17 digits of the significand
    let significandLow: Long;
    // The biased exponent
    let biasedExponent: number = 0;

    // Read index
    let index: number = 0;

    if (str === null) {
      throw new TypeError("Input must not be null.");
    }
    // Naively prevent against REDOS attacks.
    // TODO: implementing a custom parsing for this, or refactoring the regex would yield
    //       further gains.
    if (str.length >= 7000) {
      throw new TypeError(`${str} must not be longer than 7000.`);
    }

    // Results
    const stringMatch: string[] = str.match(PARSE_STRING_REGEXP);
    const infMatch: string[] = str.match(PARSE_INF_REGEXP);
    const nanMatch: string[] = str.match(PARSE_NAN_REGEXP);

    // Validate the string
    if ((!stringMatch && !infMatch && !nanMatch) || str.length === 0) {
      throw new TypeError(`${str} is not a valid Decimal128 string.`);
    }

    if (stringMatch) {
      // full_match = stringMatch[0]
      // sign = stringMatch[1]

      let unsignedNumber: string = stringMatch[2];
      // stringMatch[3] is undefined if a whole number (ex "1", 12")
      // but defined if a number w/ decimal in it (ex "1.0, 12.2")

      let e: string = stringMatch[4];
      let expSign: string = stringMatch[5];
      let expNumber: string = stringMatch[6];

      // they provided e, but didn't give an exponent number. for ex "1e"
      if (e && expNumber === undefined) {
        throw new TypeError(`${str} is missing exponent power.`);
      }

      // they provided e, but didn't give a number before it. for ex "e1"
      if (e && unsignedNumber === undefined) {
        throw new TypeError(`${str} is missing exponent base.`);
      }

      if (e === undefined && (expSign || expNumber)) {
        throw new TypeError(`${str} is missing e before exponent.`);
      }
    }

    // Get the negative or positive sign
    if (str[index] === "+" || str[index] === "-") {
      isNegative = str[index++] === "-";
    }

    // Check if user passed Infinity or NaN
    if (!isDigit(str[index]) && str[index] !== ".") {
      if (str[index] === "i" || str[index] === "I") {
        return new Decimal128(
          Uint8Array.from(
            isNegative ? INF_NEGATIVE_BUF : INF_POSITIVE_BUF
          )
        );
      } else if (str[index] === "N") {
        return new Decimal128(Uint8Array.from(NAN_BUF));
      }
    }

    // Read all the digits
    while (isDigit(str[index]) || str[index] === ".") {
      if (str[index] === ".") {
        if (sawRadix) {
          throw new TypeError(`${str} contains multiple periods.`);
        }

        sawRadix = true;
        ++index;
        continue;
      }

      if (nDigitsStored < 34) {
        if (str[index] !== "0" || foundNonZero) {
          if (!foundNonZero) {
            firstNonZero = nDigitsRead;
          }

          foundNonZero = true;

          // Only store 34 digits
          digits[digitsInsert++] = parseInt(str[index], 10);
          ++nDigitsStored;
        }
      }

      if (foundNonZero) {
        ++nDigits;
      }
      if (sawRadix) {
        ++radixPosition;
      }

      ++nDigitsRead;
      ++index;
    }

    if (sawRadix && !nDigitsRead) {
      throw new TypeError(`${str} is not a valid Decimal128 string.`);
    }

    // Read exponent if exists
    if (str[index] === "e" || str[index] === "E") {
      // Read exponent digits
      const match: string[] = str.substr(++index).match(EXPONENT_REGEX);

      // No digits read
      if (!match || !match[2]) {
        return new Decimal128(Uint8Array.from(NAN_BUF));
      }

      // Get exponent
      exponent = parseInt(match[0], 10);

      // Adjust the index
      index += match[0].length;
    }

    // Return not a number
    if (str[index]) {
      return new Decimal128(Uint8Array.from(NAN_BUF));
    }

    // Done reading input
    // Find first non-zero digit in digits
    firstDigit = 0;

    if (!nDigitsStored) {
      firstDigit = 0;
      lastDigit = 0;
      digits[0] = 0;
      nDigits = 1;
      nDigitsStored = 1;
      significantDigits = 0;
    } else {
      lastDigit = nDigitsStored - 1;
      significantDigits = nDigits;
      if (significantDigits !== 1) {
        while (str[firstNonZero + significantDigits - 1] === "0") {
          significantDigits = significantDigits - 1;
        }
      }
    }

    // Normalization of exponent
    // Correct exponent based on radix position, and shift significand as needed
    // to represent user input

    // Overflow prevention
    if (exponent <= radixPosition && radixPosition - exponent > 1 << 14) {
      exponent = EXPONENT_MIN;
    } else {
      exponent = exponent - radixPosition;
    }

    // Attempt to normalize the exponent
    while (exponent > EXPONENT_MAX) {
      // Shift exponent to significand and decrease
      lastDigit = lastDigit + 1;

      if (lastDigit - firstDigit > MAX_DIGITS) {
        // Check if we have a zero then just hard clamp, otherwise fail
        const digitsString: string = digits.join("");
        if (digitsString.match(/^0+$/)) {
          exponent = EXPONENT_MAX;
          break;
        }

        throw new TypeError(`${str} overflow.`);
      }
      --exponent;
    }

    while (exponent < EXPONENT_MIN || nDigitsStored < nDigits) {
      // Shift last digit. can only do this if < significant digits than # stored.
      if (lastDigit === 0 && significantDigits < nDigitsStored) {
        exponent = EXPONENT_MIN;
        significantDigits = 0;
        break;
      }

      if (nDigitsStored < nDigits) {
        // adjust to match digits not stored
        nDigits = nDigits - 1;
      } else {
        // adjust to round
        lastDigit = lastDigit - 1;
      }

      if (exponent < EXPONENT_MAX) {
        exponent = exponent + 1;
      } else {
        // Check if we have a zero then just hard clamp, otherwise fail
        const digitsString: string = digits.join("");
        if (digitsString.match(/^0+$/)) {
          exponent = EXPONENT_MAX;
          break;
        }

        throw new TypeError(`${str} overflow.`);
      }
    }

    // Round
    // We've normalized the exponent, but might still need to round.
    if (lastDigit - firstDigit + 1 < significantDigits) {
      let endOfString = nDigitsRead;

      // If we have seen a radix point, 'string' is 1 longer than we have
      // documented with ndigits_read, so inc the position of the first nonzero
      // digit and the position that digits are read to.
      if (sawRadix) {
        firstNonZero = firstNonZero + 1;
        endOfString = endOfString + 1;
      }
      // if negative, we need to increment again to account for - sign at start.
      if (isNegative) {
        firstNonZero = firstNonZero + 1;
        endOfString = endOfString + 1;
      }

      const roundDigit: number = parseInt(
        str[firstNonZero + lastDigit + 1],
        10
      );
      let roundBit = 0;

      if (roundDigit >= 5) {
        roundBit = 1;
        if (roundDigit === 5) {
          roundBit = digits[lastDigit] % 2; // === 1;
          for (i = firstNonZero + lastDigit + 2; i < endOfString; i++) {
            if (parseInt(str[i], 10)) {
              roundBit = 1;
              break;
            }
          }
        }
      }

      if (roundBit) {
        let dIdx: number = lastDigit;

        for (; dIdx >= 0; dIdx--) {
          if (++digits[dIdx] > 9) {
            digits[dIdx] = 0;

            // overflowed most significant digit
            if (dIdx === 0) {
              if (exponent < EXPONENT_MAX) {
                exponent = exponent + 1;
                digits[dIdx] = 1;
              } else {
                return new Decimal128(
                  Uint8Array.from(
                    isNegative ? INF_NEGATIVE_BUF : INF_POSITIVE_BUF
                  )
                );
              }
            }
          }
        }
      }
    }

    // Encode significand
    // // The high 17 digits of the significand
    // significandHigh = Long.fromNumber(0);
    // // The low 17 digits of the significand
    // significandLow = Long.fromNumber(0);

    // read a zero
    if (significantDigits === 0) {
      significandHigh = Long.fromNumber(0);
      significandLow = Long.fromNumber(0);
    } else if (lastDigit - firstDigit < 17) {
      let dIdx = firstDigit;
      significandLow = Long.fromNumber(digits[dIdx++]);
      significandHigh = new Long(0, 0);

      for (; dIdx <= lastDigit; dIdx++) {
        significandLow = significandLow.multiply(Long.fromNumber(10));
        significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
      }
    } else {
      let dIdx = firstDigit;
      significandHigh = Long.fromNumber(digits[dIdx++]);

      for (; dIdx <= lastDigit - 17; dIdx++) {
        significandHigh = significandHigh.multiply(Long.fromNumber(10));
        significandHigh = significandHigh.add(Long.fromNumber(digits[dIdx]));
      }

      significandLow = Long.fromNumber(digits[dIdx++]);

      for (; dIdx <= lastDigit; dIdx++) {
        significandLow = significandLow.multiply(Long.fromNumber(10));
        significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
      }
    }

    const significand: { low: Long; high: Long } = multiply64x2(
      significandHigh,
      Long.fromString("100000000000000000")
    );
    significand.low = significand.low.add(significandLow);

    // if (lessThan(significand.low, significandLow)) {
    if (significand.low.lessThan(significandLow)) {
      significand.high = significand.high.add(Long.fromNumber(1));
    }

    // Biased exponent
    biasedExponent = exponent + EXPONENT_BIAS;
    const dec: { low: Long; high: Long } = {
      low: Long.fromNumber(0),
      high: Long.fromNumber(0)
    };

    // Encode combination, exponent, and significand.
    if (
      significand.high
        .shiftRightUnsigned(49)
        .and(Long.fromNumber(1))
        .equals(Long.fromNumber(1))
    ) {
      // Encode '11' into bits 1 to 3
      dec.high = dec.high.or(Long.fromNumber(0x3).shiftLeft(61));
      dec.high = dec.high.or(
        Long.fromNumber(biasedExponent).and(
          Long.fromNumber(0x3fff).shiftLeft(47)
        )
      );
      dec.high = dec.high.or(
        significand.high.and(Long.fromNumber(0x7fffffffffff))
      );
    } else {
      dec.high = dec.high.or(
        Long.fromNumber(biasedExponent & 0x3fff).shiftLeft(49)
      );
      dec.high = dec.high.or(
        significand.high.and(Long.fromNumber(0x1ffffffffffff))
      );
    }

    dec.low = significand.low;

    // Encode sign
    if (isNegative) {
      dec.high = dec.high.or(Long.fromString("9223372036854775808"));
    }

    // Encode into a buffer
    const buf = new Uint8Array(16);
    index = 0;

    // Encode the low 64 bits of the decimal
    // Encode low bits
    buf[index++] = dec.low.low & 0xff;
    buf[index++] = (dec.low.low >> 8) & 0xff;
    buf[index++] = (dec.low.low >> 16) & 0xff;
    buf[index++] = (dec.low.low >> 24) & 0xff;
    // Encode high bits
    buf[index++] = dec.low.high & 0xff;
    buf[index++] = (dec.low.high >> 8) & 0xff;
    buf[index++] = (dec.low.high >> 16) & 0xff;
    buf[index++] = (dec.low.high >> 24) & 0xff;

    // Encode the high 64 bits of the decimal
    // Encode low bits
    buf[index++] = dec.high.low & 0xff;
    buf[index++] = (dec.high.low >> 8) & 0xff;
    buf[index++] = (dec.high.low >> 16) & 0xff;
    buf[index++] = (dec.high.low >> 24) & 0xff;
    // Encode high bits
    buf[index++] = dec.high.high & 0xff;
    buf[index++] = (dec.high.high >> 8) & 0xff;
    buf[index++] = (dec.high.high >> 16) & 0xff;
    buf[index++] = (dec.high.high >> 24) & 0xff;

    // Return the new Decimal128
    return new Decimal128(buf);
  }

  static fromExtendedJSON(doc: { $numberDecimal: string }): Decimal128 {
    return Decimal128.fromString(doc.$numberDecimal);
  }

  /** Creates a string representation of the raw Decimal128 value. */
  toString(): string {
    // Note: bits in this routine are referred to starting at 0,
    // from the sign bit, towards the coefficient.

    // bits 0 - 31
    let high: number;
    // bits 32 - 63
    let midh: number;
    // bits 64 - 95
    let midl: number;
    // bits 96 - 127
    let low: number;
    // bits 1 - 5
    let combination: number;
    // decoded biased exponent (14 bits)
    let biased_exponent: number;
    // the number of significand digits
    let significand_digits: number = 0;
    // the base-10 digits in the significand
    const significand: number[] = new Array(36).fill(0);
    // for (let i = 0; i < significand.length; i++) significand[i] = 0;
    // read pointer into significand
    let index: number = 0;

    // unbiased exponent
    let exponent: number;
    // the exponent if scientific notation is used
    let scientific_exponent: number;

    // true if the number is zero
    let is_zero: boolean = false;

    // the most signifcant significand bits (50-46)
    let significand_msb: number;
    // temporary storage for significand decoding
    let significand128: { parts: number[] } = { parts: new Array(4) };
    // indexing variables
    let j: number, k: number;

    // Output string
    const str: any[] = [];

    //// Unpack index
    // index = 0;

    // Buffer reference
    const buf: Uint8Array = this.bytes;

    // Unpack the low 64bits into a long
    low =
      buf[index++] |
      (buf[index++] << 8) |
      (buf[index++] << 16) |
      (buf[index++] << 24);
    midl =
      buf[index++] |
      (buf[index++] << 8) |
      (buf[index++] << 16) |
      (buf[index++] << 24);

    // Unpack the high 64bits into a long
    midh =
      buf[index++] |
      (buf[index++] << 8) |
      (buf[index++] << 16) |
      (buf[index++] << 24);
    high =
      buf[index++] |
      (buf[index++] << 8) |
      (buf[index++] << 16) |
      (buf[index++] << 24);

    // Unpack index
    index = 0;

    // Create the state of the decimal
    const dec: { low: Long; high: Long } = {
      low: new Long(low, midl),
      high: new Long(midh, high)
    };

    if (dec.high.lessThan(ZERO)) {
      str.push("-");
    }

    // Decode combination field and exponent
    combination = (high >> 26) & COMBINATION_MASK;

    if (combination >> 3 === 3) {
      // Check for 'special' values
      if (combination === COMBINATION_INFINITY) {
        return str.join("") + "Infinity";
      } else if (combination === COMBINATION_NAN) {
        return "NaN";
      } else {
        biased_exponent = (high >> 15) & EXPONENT_MASK;
        significand_msb = 0x08 + ((high >> 14) & 0x01);
      }
    } else {
      significand_msb = (high >> 14) & 0x07;
      biased_exponent = (high >> 17) & EXPONENT_MASK;
    }

    exponent = biased_exponent - EXPONENT_BIAS;

    // Create string of significand digits

    // Convert the 114-bit binary number represented by
    // (significand_high, significand_low) to at most 34 decimal
    // digits through modulo and division.
    significand128.parts[0] = (high & 0x3fff) + ((significand_msb & 0xf) << 14);
    significand128.parts[1] = midh;
    significand128.parts[2] = midl;
    significand128.parts[3] = low;

    if (
      significand128.parts[0] === 0 &&
      significand128.parts[1] === 0 &&
      significand128.parts[2] === 0 &&
      significand128.parts[3] === 0
    ) {
      is_zero = true;
    } else {
      for (k = 3; k >= 0; k--) {
        // Peform the divide
        let result: { quotient: { parts: number[] }; rem: Long } = divideu128(
          significand128
        );
        significand128 = result.quotient;
        let least_digits: number = result.rem.low;

        // We now have the 9 least significant digits (in base 2).
        // Convert and output to string.
        if (!least_digits) {
          continue;
        }

        for (j = 8; j >= 0; j--) {
          // significand[k * 9 + j] = Math.round(least_digits % 10);
          significand[k * 9 + j] = least_digits % 10;
          // least_digits = Math.round(least_digits / 10);
          least_digits = Math.floor(least_digits / 10);
        }
      }
    }

    // Output format options:
    // Scientific - [-]d.dddE(+/-)dd or [-]dE(+/-)dd
    // Regular    - ddd.ddd

    if (is_zero) {
      significand_digits = 1;
      significand[index] = 0;
    } else {
      significand_digits = 36;
      while (!significand[index]) {
        --significand_digits;
        ++index;
      }
    }

    scientific_exponent = significand_digits - 1 + exponent;

    // The scientific exponent checks are dictated by the string conversion
    // specification and are somewhat arbitrary cutoffs.
    //
    // We must check exponent > 0, because if this is the case, the number
    // has trailing zeros.  However, we *cannot* output these trailing zeros,
    // because doing so would change the precision of the value, and would
    // change stored data if the string converted number is round tripped.
    if (
      scientific_exponent >= 34 ||
      scientific_exponent <= -7 ||
      exponent > 0
    ) {
      // Scientific format

      // if there are too many significant digits, we should just be treating numbers
      // as + or - 0 and using the non-scientific exponent (this is for the "invalid
      // representation should be treated as 0/-0" spec cases in decimal128-1.json)
      if (significand_digits > 34) {
        str.push(0);
        if (exponent > 0) {
          str.push("E+" + exponent);
        } else if (exponent < 0) {
          str.push("E" + exponent);
        }
        return str.join("");
      }

      str.push(significand[index++]);
      --significand_digits;

      if (significand_digits) {
        str.push(".");
      }

      for (let i: number = 0; i < significand_digits; i++) {
        str.push(significand[index++]);
      }

      // Exponent
      str.push("E");
      if (scientific_exponent > 0) {
        str.push("+" + scientific_exponent);
      } else {
        str.push(scientific_exponent);
      }
    } else {
      // Regular format with no decimal place
      if (exponent >= 0) {
        for (let i: number = 0; i < significand_digits; i++) {
          str.push(significand[index++]);
        }
      } else {
        let radix_position: number = significand_digits + exponent;

        // non-zero digits before radix
        if (radix_position > 0) {
          for (let i: number = 0; i < radix_position; i++) {
            str.push(significand[index++]);
          }
        } else {
          str.push("0");
        }

        str.push(".");
        // add leading zeros after radix
        while (radix_position++ < 0) {
          str.push("0");
        }

        for (
          let i: number = 0;
          i < significand_digits - Math.max(radix_position - 1, 0);
          i++
        ) {
          str.push(significand[index++]);
        }
      }
    }

    return str.join("");
  }

  toJSON(): { $numberDecimal: string } {
    return { $numberDecimal: this.toString() };
  }

  toExtendedJSON(): { $numberDecimal: string } {
    return { $numberDecimal: this.toString() };
  }
}
