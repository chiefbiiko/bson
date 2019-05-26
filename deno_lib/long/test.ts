import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals } from "https://deno.land/x/testing/asserts.ts";
import { MIN_VALUE, MAX_VALUE, MAX_UNSIGNED_VALUE, Long } from "./mod.ts";

const ONE: Long = Long.fromInt(1);
const UONE: Long = Long.fromInt(1, true);

test(function basic(): void {
  const longVal: Long = new Long(0xffffffff, 0x7fffffff);
  assertEquals(longVal.toNumber(), 9223372036854775807);
  assertEquals(longVal.toString(), "9223372036854775807");

  const longVal2: Long = Long.fromValue(longVal);
  assertEquals(longVal2.toNumber(), 9223372036854775807);
  assertEquals(longVal2.toString(), "9223372036854775807");
  assertEquals(longVal2.unsigned, longVal.unsigned);
});

test(function isLong(): void {
  let longVal: Long = new Long(0xffffffff, 0x7fffffff);
  assertEquals(Long.isLong(longVal), true);
  let dummy: { __isLong__: boolean } = { __isLong__: true };
  assertEquals(Long.isLong(dummy), true);
});

test(function toString(): void {
  const longVal: Long = Long.fromBits(0xffffffff, 0xffffffff, true);
  // #10
  assertEquals(longVal.toString(16), "ffffffffffffffff");
  assertEquals(longVal.toString(10), "18446744073709551615");
  assertEquals(longVal.toString(8), "1777777777777777777777");
  // #7, obviously wrong in goog.math.Long
  assertEquals(Long.fromString("zzzzzz", 36, false).toString(36), "zzzzzz");
  assertEquals(Long.fromString("-zzzzzz", 36, false).toString(36), "-zzzzzz");
});

test(function toBytes(): void {
  const longVal: Long = Long.fromBits(0x01234567, 0x12345678);
  assertEquals(
    longVal.toBytesBE(),
    Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x01, 0x23, 0x45, 0x67])
  );
  assertEquals(
    longVal.toBytesLE(),
    Uint8Array.from([0x67, 0x45, 0x23, 0x01, 0x78, 0x56, 0x34, 0x12])
  );
});

test(function fromBytes(): void {
  const longVal: Long = Long.fromBits(0x01234567, 0x12345678);
  const ulongVal: Long = Long.fromBits(0x01234567, 0x12345678, true);
  assertEquals(Long.fromBytes(longVal.toBytes()), longVal);
  assertEquals(
    Long.fromBytes(
      Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x01, 0x23, 0x45, 0x67])
    ),
    longVal
  );
  assertEquals(
    Long.fromBytes(
      Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x01, 0x23, 0x45, 0x67]),
      false,
      false
    ),
    longVal
  );
  assertEquals(
    Long.fromBytes(
      Uint8Array.from([0x67, 0x45, 0x23, 0x01, 0x78, 0x56, 0x34, 0x12]),
      false,
      true
    ),
    longVal
  );
  assertEquals(
    Long.fromBytes(
      Uint8Array.from([0x67, 0x45, 0x23, 0x01, 0x78, 0x56, 0x34, 0x12]),
      true,
      true
    ),
    ulongVal
  );
});

test(function unsignedMinMax(): void {
  assertEquals(MIN_VALUE.toString(), "-9223372036854775808");
  assertEquals(MAX_VALUE.toString(), "9223372036854775807");
  assertEquals(MAX_UNSIGNED_VALUE.toString(), "18446744073709551615");
});

test(function unsignedConstructNegint(): void {
  const longVal: Long = Long.fromInt(-1, true);
  assertEquals(longVal.low, -1);
  assertEquals(longVal.high, -1);
  assertEquals(longVal.unsigned, true);
  assertEquals(longVal.toNumber(), 18446744073709551615);
  assertEquals(longVal.toString(), "18446744073709551615");
});

test(function unsignedConstructHighLow(): void {
  const longVal: Long = new Long(0xffffffff, 0xffffffff, true);
  assertEquals(longVal.low, -1);
  assertEquals(longVal.high, -1);
  assertEquals(longVal.unsigned, true);
  assertEquals(longVal.toNumber(), 18446744073709551615);
  assertEquals(longVal.toString(), "18446744073709551615");
});

test(function unsignedConstructNumber(): void {
  const longVal: Long = Long.fromNumber(0xffffffffffffffff, true);
  assertEquals(longVal.low, -1);
  assertEquals(longVal.high, -1);
  assertEquals(longVal.unsigned, true);
  assertEquals(longVal.toNumber(), 18446744073709551615);
  assertEquals(longVal.toString(), "18446744073709551615");
});

test(function unsignedToSignedUnsigned(): void {
  let longVal: Long = Long.fromNumber(-1, false);
  assertEquals(longVal.toNumber(), -1);
  longVal = longVal.toUnsigned();
  assertEquals(longVal.toNumber(), 0xffffffffffffffff);
  assertEquals(longVal.toString(16), "ffffffffffffffff");
  longVal = longVal.toSigned();
  assertEquals(longVal.toNumber(), -1);
});

test(function unsignedMaxSubtractMaxSigned(): void {
  const longVal: Long = MAX_UNSIGNED_VALUE.subtract(MAX_VALUE).subtract(ONE);
  assertEquals(longVal.toNumber(), MAX_VALUE.toNumber());
  assertEquals(longVal.toString(), MAX_VALUE.toString());
});

test(function unsignedMaxSubtractMax(): void {
  const longVal: Long = MAX_UNSIGNED_VALUE.subtract(MAX_UNSIGNED_VALUE);
  assertEquals(longVal.low, 0);
  assertEquals(longVal.high, 0);
  assertEquals(longVal.unsigned, true);
  assertEquals(longVal.toNumber(), 0);
  assertEquals(longVal.toString(), "0");
});

test(function unsignedZeroSubtractSigned(): void {
  const longVal: Long = Long.fromInt(0, true).add(Long.fromInt(-1, false));
  assertEquals(longVal.low, -1);
  assertEquals(longVal.high, -1);
  assertEquals(longVal.unsigned, true);
  assertEquals(longVal.toNumber(), 18446744073709551615);
  assertEquals(longVal.toString(), "18446744073709551615");
});

test(function unsignedMaxDivideMaxSigned(): void {
  const longVal: Long = MAX_UNSIGNED_VALUE.divide(MAX_VALUE);
  assertEquals(longVal.toNumber(), 2);
  assertEquals(longVal.toString(), "2");
});

test(function unsignedDivideMaxUnsigned(): void {
  const longVal: Long = MAX_UNSIGNED_VALUE;
  assertEquals(longVal.divide(longVal).toString(), "1");
});

test(function unsignedDivideNegativeSigned(): void {
  const a: Long = MAX_UNSIGNED_VALUE;
  const b: Long = Long.fromInt(-2);
  assertEquals(
    b.toUnsigned().toString(),
    MAX_UNSIGNED_VALUE.subtract(1).toString()
  );
  const longVal: Long = a.divide(b);
  assertEquals(longVal.toString(), "1");
});

test(function unsignedMinSignedDivideOne(): void {
  const longVal: Long = MIN_VALUE.divide(ONE);
  assertEquals(longVal.toString(), MIN_VALUE.toString());
});

test(function unsignedMostSignificantBitUnsigned(): void {
  const longVal: Long = UONE.shiftLeft(63);
  assertEquals(longVal.notEquals(MIN_VALUE), true);
  assertEquals(longVal.toString(), "9223372036854775808");
  assertEquals(
    Long.fromString("9223372036854775808", 10, true).toString(),
    "9223372036854775808"
  );
});

test(function issue31(): void {
  const a: Long = new Long(0, 8, true);
  const b: Long = Long.fromNumber(2656901066, true);
  assertEquals(a.unsigned, true);
  assertEquals(b.unsigned, true);
  const x: Long = a.divide(b);
  assertEquals(x.toString(), "12");
  assertEquals(x.unsigned, true);
});

test(function rotateLeft(): void {
  const longVal: Long = Long.fromBits(0x01234567, 0x89abcdef);
  const longValL: Long = Long.fromBits(0x12345678, 0x9abcdef0);
  const longValR: Long = Long.fromBits(0xf0123456, 0x789abcde);
  const longValS: Long = Long.fromBits(0x89abcdef, 0x01234567);
  // little rotate
  let v = longVal.rotateLeft(4);
  assertEquals(v, longValL);
  // big rotate
  v = longVal.rotateLeft(60);
  assertEquals(v, longValR);
  // swap
  v = longVal.rotateLeft(32);
  assertEquals(v, longValS);
});

test(function rotateRight(): void {
  const longVal: Long = Long.fromBits(0x01234567, 0x89abcdef);
  const longValL: Long = Long.fromBits(0x12345678, 0x9abcdef0);
  const longValR: Long = Long.fromBits(0xf0123456, 0x789abcde);
  const longValS: Long = Long.fromBits(0x89abcdef, 0x01234567);
  // little rotate
  let v = longVal.rotateRight(4);
  assertEquals(v, longValR);
  // big rotate
  v = longVal.rotateRight(60);
  assertEquals(v, longValL);
  // swap
  v = longVal.rotateRight(32);
  assertEquals(v, longValS);
});

runIfMain(import.meta, { parallel: true });
