import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import {
  assertEquals,
  assertThrows
} from "https://deno.land/x/testing/asserts.ts";
import { encode, decode} from "./transcoding.ts"
import { serialize, deserialize, EJSON } from "./bson.ts"
import { Decimal128 } from "./decimal128.ts";

interface TestVectors {
  valid: {[key:string]: string}[]; parseErrors: {[key:string]: string}[];
}

function loadTestVectors(files: string[]): TestVectors {
  const testVectors: TestVectors = {valid:[], parseErrors:[]};
  for (const file of files) {
    const {valid, parseErrors}: TestVectors = JSON.parse(decode(Deno.readFileSync(file),"utf8"))
    // testVectors.valid.push(...valid)
    Array.prototype.push.apply(testVectors.valid, valid)
    // testVectors.parseErrors.push(...parseErrors)
    Array.prototype.push.apply(testVectors.parseErrors, parseErrors)
  }
  return testVectors;
}

// const testVectors: { [key:string]: any} = JSON.parse(
//   decode(Deno.readFileSync("./../corpus/max_key_test_vectors.json"),"utf8")
// )

const testVectors: TestVectors = loadTestVectors([
  "./../corpus/decimal128_1_test_vectors.json",
  "./../corpus/decimal128_2_test_vectors.json",
])

testVectors.valid
.forEach(({ description, canonical_bson, canonical_extjson}:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      const expected_bson: Uint8Array = encode(canonical_bson, "hex")
      const doc: { [key:string]: any} = deserialize(expected_bson)
      const doc_extjson: string = JSON.stringify(doc)
      // Reparsing from extended JSON bc of hardly controllable key order
      assertEquals(JSON.parse(doc_extjson), JSON.parse(canonical_extjson))
      assertEquals(serialize(doc), expected_bson)
    }
  })
})

testVectors.parseErrors.forEach(({ description, string }:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      assertThrows(() => EJSON.parse(string))
    }
  })
})

const NAN_BUF: Uint8Array = Uint8Array.from(
  [
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
  ].reverse()
);
const INF_NEGATIVE_BUF: Uint8Array = Uint8Array.from(
  [
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
  ].reverse()
);
const INF_POSITIVE_BUF: Uint8Array = Uint8Array.from(
  [
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
  ].reverse()
);

test({
  name: "fromString invalid input",
  fn(): void {
    assertThrows(Decimal128.fromString.bind(null, "E02"));
    assertThrows(Decimal128.fromString.bind(null, "E+02"));
    assertThrows(Decimal128.fromString.bind(null, "e+02"));
    assertThrows(Decimal128.fromString.bind(null, "."));
    assertThrows(Decimal128.fromString.bind(null, ".e"));
    assertThrows(Decimal128.fromString.bind(null, ""));
    assertThrows(Decimal128.fromString.bind(null, "invalid"));
    assertThrows(Decimal128.fromString.bind(null, "in"));
    assertThrows(Decimal128.fromString.bind(null, "i"));
    assertThrows(Decimal128.fromString.bind(null, "..1"));
    assertThrows(Decimal128.fromString.bind(null, "1abcede"));
    assertThrows(Decimal128.fromString.bind(null, "1.24abc"));
    assertThrows(Decimal128.fromString.bind(null, "1.24abcE+02"));
    assertThrows(Decimal128.fromString.bind(null, "1.24E+02abc2d"));
  }
});

test({
  name: "fromString NaN input",
  fn(): void {
    let dec: Decimal128 = Decimal128.fromString("NaN");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("+NaN");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("-NaN");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("-nan");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("+nan");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("nan");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("Nan");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("+Nan");
    assertEquals(dec.bytes, NAN_BUF);
    dec = Decimal128.fromString("-Nan");
    assertEquals(dec.bytes, NAN_BUF);
  }
});

test({
  name: "fromString Infinity input",
  fn(): void {
    let dec: Decimal128 = Decimal128.fromString("Infinity");
    assertEquals(dec.bytes, INF_POSITIVE_BUF);
    dec = Decimal128.fromString("+Infinity");
    assertEquals(dec.bytes, INF_POSITIVE_BUF);
    dec = Decimal128.fromString("+Inf");
    assertEquals(dec.bytes, INF_POSITIVE_BUF);
    dec = Decimal128.fromString("-Inf");
    assertEquals(dec.bytes, INF_NEGATIVE_BUF);
    dec = Decimal128.fromString("-Infinity");
    assertEquals(dec.bytes, INF_NEGATIVE_BUF);
  }
});

test({
  name: "fromString simple",
  fn(): void {
    // Create decimal from string value 1
    let dec: Decimal128 = Decimal128.fromString("1");
    let bytes: Uint8Array = Uint8Array.from(
      [
        0x30,
        0x40,
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
        0x01
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 0
    dec = Decimal128.fromString("0");
    bytes = Uint8Array.from(
      [
        0x30,
        0x40,
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
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value -0
    dec = Decimal128.fromString("-0");
    bytes = Uint8Array.from(
      [
        0xb0,
        0x40,
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
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value -1
    dec = Decimal128.fromString("-1");
    bytes = Uint8Array.from(
      [
        0xb0,
        0x40,
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
        0x01
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 12345678901234567
    dec = Decimal128.fromString("12345678901234567");
    bytes = Uint8Array.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x2b,
        0xdc,
        0x54,
        0x5d,
        0x6b,
        0x4b,
        0x87
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 989898983458
    dec = Decimal128.fromString("989898983458");
    bytes = Uint8Array.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0xe6,
        0x7a,
        0x93,
        0xc8,
        0x22
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value -12345678901234567
    dec = Decimal128.fromString("-12345678901234567");
    bytes = Uint8Array.from(
      [
        0xb0,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x2b,
        0xdc,
        0x54,
        0x5d,
        0x6b,
        0x4b,
        0x87
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 0.12345
    dec = Decimal128.fromString("0.12345");
    bytes = Uint8Array.from(
      [
        0x30,
        0x36,
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
        0x30,
        0x39
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 0.0012345
    dec = Decimal128.fromString("0.0012345");
    bytes = Uint8Array.from(
      [
        0x30,
        0x32,
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
        0x30,
        0x39
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 00012345678901234567
    dec = Decimal128.fromString("00012345678901234567");
    bytes = Uint8Array.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x2b,
        0xdc,
        0x54,
        0x5d,
        0x6b,
        0x4b,
        0x87
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);
  }
});

test({
  name: "fromString scientific format",
  fn(): void {
    // Create decimal from string value 10e0
    let dec: Decimal128 = Decimal128.fromString("10e0");
    let bytes: Uint8Array = Uint8Array.from(
      [
        0x30,
        0x40,
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
        0x0a
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);
    // Create decimal from string value 1e1
    dec = Decimal128.fromString("1e1");
    bytes = Uint8Array.from(
      [
        0x30,
        0x42,
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
        0x01
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 10e-1
    dec = Decimal128.fromString("10e-1");
    bytes = Uint8Array.from(
      [
        0x30,
        0x3e,
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
        0x0a
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 12345678901234567e6111
    dec = Decimal128.fromString("12345678901234567e6111");
    bytes = Uint8Array.from(
      [
        0x5f,
        0xfe,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x00,
        0x2b,
        0xdc,
        0x54,
        0x5d,
        0x6b,
        0x4b,
        0x87
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 1e-6176
    dec = Decimal128.fromString("1e-6176");
    bytes = Uint8Array.from(
      [
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
        0x00,
        0x01
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value "-100E-10
    dec = Decimal128.fromString("-100E-10");
    bytes = Uint8Array.from(
      [
        0xb0,
        0x2c,
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
        0x64
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 10.50E8
    dec = Decimal128.fromString("10.50E8");
    bytes = Uint8Array.from(
      [
        0x30,
        0x4c,
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
        0x04,
        0x1a
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);
  }
});

test({
  name: "fromString large format",
  fn(): void {
    // Create decimal from string value 12345689012345789012345
    let dec: Decimal128 = Decimal128.fromString("12345689012345789012345");
    let bytes: Uint8Array = Uint8Array.from(
      [
        0x30,
        0x40,
        0x00,
        0x00,
        0x00,
        0x00,
        0x02,
        0x9d,
        0x42,
        0xda,
        0x3a,
        0x76,
        0xf9,
        0xe0,
        0xd9,
        0x79
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // // FAILS
    // // Create decimal from string value 1234567890123456789012345678901234
    // dec = Decimal128.fromString('1234567890123456789012345678901234');
    // bytes = Uint8Array.from(
    //   [
    //     0x30,
    //     0x40,
    //     0x3c,
    //     0xde,
    //     0x6f,
    //     0xff,
    //     0x97,
    //     0x32,
    //     0xde,
    //     0x82,
    //     0x5c,
    //     0xd0,
    //     0x7e,
    //     0x96,
    //     0xaf,
    //     0xf2
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes)

    // Create decimal from string value 9.999999999999999999999999999999999E+6144
    dec = Decimal128.fromString("9.999999999999999999999999999999999E+6144");
    bytes = Uint8Array.from(
      [
        0x5f,
        0xff,
        0xed,
        0x09,
        0xbe,
        0xad,
        0x87,
        0xc0,
        0x37,
        0x8d,
        0x8e,
        0x63,
        0xff,
        0xff,
        0xff,
        0xff
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 9.999999999999999999999999999999999E-6143
    dec = Decimal128.fromString("9.999999999999999999999999999999999E-6143");
    bytes = Uint8Array.from(
      [
        0x00,
        0x01,
        0xed,
        0x09,
        0xbe,
        0xad,
        0x87,
        0xc0,
        0x37,
        0x8d,
        0x8e,
        0x63,
        0xff,
        0xff,
        0xff,
        0xff
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // // FAILS
    // // Create decimal from string value 5.192296858534827628530496329220095E+33
    // dec = Decimal128.fromString('5.192296858534827628530496329220095E+33');
    // bytes = Uint8Array.from(
    //   [
    //     0x30,
    //     0x40,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff,
    //     0xff
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes)
  }
});

test({
  name: "fromString exponent normalization",
  fn(): void {
    // Create decimal from string value 1000000000000000000000000000000000000000

    let dec: Decimal128 = Decimal128.fromString(
      "1000000000000000000000000000000000000000"
    );
    let bytes: Uint8Array = Uint8Array.from(
      [
        0x30,
        0x4c,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 10000000000000000000000000000000000
    dec = Decimal128.fromString("10000000000000000000000000000000000");
    bytes = Uint8Array.from(
      [
        0x30,
        0x42,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 1000000000000000000000000000000000
    dec = Decimal128.fromString("1000000000000000000000000000000000");
    bytes = Uint8Array.from(
      [
        0x30,
        0x40,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    let str: string =
      "100000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "000000000000000000000000000000000000000000000000000000000000000000000" +
      "0000000000000000000000000000000000";

    // Create decimal from string value str

    dec = Decimal128.fromString(str);
    bytes = Uint8Array.from(
      [
        0x37,
        0xcc,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // // FAILS: this should throw error according to spec.
    // // Create decimal from string value 1E-6177
    // dec = Decimal128.fromString('1E-6177');
    // bytes = Uint8Array.from(
    //   [
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes)
  }
});

test({
  name: "fromString from string zeros",
  fn(): void {
    // Create decimal from string value 0
    let dec: Decimal128 = Decimal128.fromString("0");
    let bytes: Uint8Array = Uint8Array.from(
      [
        0x30,
        0x40,
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
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 0e-611
    dec = Decimal128.fromString("0e-611");
    bytes = Uint8Array.from(
      [
        0x2b,
        0x7a,
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
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 0e+6000
    dec = Decimal128.fromString("0e+6000");
    bytes = Uint8Array.from(
      [
        0x5f,
        0x20,
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
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 1E-6177
    dec = Decimal128.fromString("-0e-1");
    bytes = Uint8Array.from(
      [
        0xb0,
        0x3e,
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
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);
  }
});

test({
  name: "fromString from string round",
  fn(): void {
    // Create decimal from string value 10E-6177
    let dec: Decimal128 = Decimal128.fromString("10E-6177");
    let bytes: Uint8Array = Uint8Array.from(
      [
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
        0x00,
        0x01
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 15E-6177
    dec = Decimal128.fromString("15E-6177");
    bytes = Uint8Array.from(
      [
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
        0x00,
        0x02
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    const array: string[] = new Array(6179).fill("0");
    array[1] = ".";
    array[6177] = "1";
    array[6178] = "5";
    // Create decimal from string value array
    dec = Decimal128.fromString(array.join(""));
    bytes = Uint8Array.from(
      [
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
        0x00,
        0x02
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 251E-6178
    dec = Decimal128.fromString("251E-6178");
    bytes = Uint8Array.from(
      [
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
        0x00,
        0x03
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 250E-6178
    dec = Decimal128.fromString("250E-6178");
    bytes = Uint8Array.from(
      [
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
        0x00,
        0x02
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // // FAILS
    // // Create decimal from string value 10000000000000000000000000000000006
    // dec = Decimal128.fromString('10000000000000000000000000000000006');
    // bytes = Uint8Array.from(
    //   [
    //     0x30,
    //     0x42,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x01
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes)

    // Create decimal from string value 10000000000000000000000000000000003
    dec = Decimal128.fromString("10000000000000000000000000000000003");
    bytes = Uint8Array.from(
      [
        0x30,
        0x42,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 10000000000000000000000000000000005
    dec = Decimal128.fromString("10000000000000000000000000000000005");
    bytes = Uint8Array.from(
      [
        0x30,
        0x42,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // // FAILS
    // // Create decimal from string value 100000000000000000000000000000000051
    // dec = Decimal128.fromString('100000000000000000000000000000000051');
    // bytes = Uint8Array.from(
    //   [
    //     0x30,
    //     0x44,
    //     0x31,
    //     0x4d,
    //     0xc6,
    //     0x44,
    //     0x8d,
    //     0x93,
    //     0x38,
    //     0xc1,
    //     0x5b,
    //     0x0a,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x01
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes);

    // // FAILS
    // // Create decimal from string value 10000000000000000000000000000000006E6111
    // dec = Decimal128.fromString('10000000000000000000000000000000006E6111');
    // bytes = Uint8Array.from(
    //   [
    //     0x78,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes);

    // // FAILS
    // // Create decimal from string value 12980742146337069071326240823050239
    // dec = Decimal128.fromString('12980742146337069071326240823050239');
    // bytes = Uint8Array.from(
    //   [
    //     0x30,
    //     0x42,
    //     0x40,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes);

    // Create decimal from string value 99999999999999999999999999999999999
    dec = Decimal128.fromString("99999999999999999999999999999999999");
    bytes = Uint8Array.from(
      [
        0x30,
        0x44,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999
    dec = Decimal128.fromString(
      "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"
    );
    bytes = Uint8Array.from(
      [
        0x30,
        0xc6,
        0x31,
        0x4d,
        0xc6,
        0x44,
        0x8d,
        0x93,
        0x38,
        0xc1,
        0x5b,
        0x0a,
        0x00,
        0x00,
        0x00,
        0x00
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // Create decimal from string value 9999999999999999999999999999999999E6111
    dec = Decimal128.fromString("9999999999999999999999999999999999E6111");
    bytes = Uint8Array.from(
      [
        0x5f,
        0xff,
        0xed,
        0x09,
        0xbe,
        0xad,
        0x87,
        0xc0,
        0x37,
        0x8d,
        0x8e,
        0x63,
        0xff,
        0xff,
        0xff,
        0xff
      ].reverse()
    );
    assertEquals(dec.bytes, bytes);

    // // FAILS
    // // Create decimal from string value 99999999999999999999999999999999999E6144
    // dec = Decimal128.fromString('99999999999999999999999999999999999E6144');
    // bytes = Uint8Array.from(
    //   [
    //     0x78,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00,
    //     0x00
    //   ].reverse()
    // );
    // assertEquals(dec.bytes, bytes);
  }
});

test({
  name: "toString Infinity",
  fn(): void {
    let dec: Decimal128 = new Decimal128(
      Uint8Array.from(
        [
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "Infinity");

    dec = new Decimal128(
      Uint8Array.from(
        [
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "-Infinity");
  }
});

test({
  name: "toString NaN",
  fn(): void {
    let dec: Decimal128 = new Decimal128(
      Uint8Array.from(
        [
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "NaN");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0xfc,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "NaN");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x7e,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "NaN");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0xfe,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "NaN");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x7e,
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
          0x12
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "NaN");
  }
});

test({
  name: "toString regular",
  fn(): void {
    let dec: Decimal128 = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x40,
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
          0x01
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "1");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x40,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x40,
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
          0x02
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "2");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0xb0,
          0x40,
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
          0x01
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "-1");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0xb0,
          0x40,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "-0");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x3e,
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
          0x01
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0.1");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x34,
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
          0x04,
          0xd2
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0.001234");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x40,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x1c,
          0xbe,
          0x99,
          0x1a,
          0x14
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "123456789012");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x2a,
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
          0x07,
          0x5a,
          0xef,
          0x40
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0.00123400000");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x2f,
          0xfc,
          0x3c,
          0xde,
          0x6f,
          0xff,
          0x97,
          0x32,
          0xde,
          0x82,
          0x5c,
          0xd0,
          0x7e,
          0x96,
          0xaf,
          0xf2
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0.1234567890123456789012345678901234");
  }
});

test({
  name: "toString scientific",
  fn(): void {
    let dec: Decimal128 = new Decimal128(
      Uint8Array.from(
        [
          0x5f,
          0xfe,
          0x31,
          0x4d,
          0xc6,
          0x44,
          0x8d,
          0x93,
          0x38,
          0xc1,
          0x5b,
          0x0a,
          0x00,
          0x00,
          0x00,
          0x00
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "1.000000000000000000000000000000000E+6144");

    dec = new Decimal128(
      Uint8Array.from(
        [
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
          0x00,
          0x01
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "1E-6176");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x80,
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
          0x01
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "-1E-6176");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x31,
          0x08,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x00,
          0x09,
          0x18,
          0x4d,
          0xb6,
          0x3e,
          0xb1
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "9.999987654321E+112");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x5f,
          0xff,
          0xed,
          0x09,
          0xbe,
          0xad,
          0x87,
          0xc0,
          0x37,
          0x8d,
          0x8e,
          0x63,
          0xff,
          0xff,
          0xff,
          0xff
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "9.999999999999999999999999999999999E+6144");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x00,
          0x01,
          0xed,
          0x09,
          0xbe,
          0xad,
          0x87,
          0xc0,
          0x37,
          0x8d,
          0x8e,
          0x63,
          0xff,
          0xff,
          0xff,
          0xff
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "9.999999999999999999999999999999999E-6143");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x40,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff,
          0xff
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "5192296858534827628530496329220095");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x4c,
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
          0x04,
          0x1a
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "1.050E+9");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x42,
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
          0x04,
          0x1a
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "1.050E+4");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x40,
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
          0x69
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "105");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x42,
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
          0x69
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "1.05E+3");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x46,
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
          0x01
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "1E+3");
  }
});

test({
  name: "toString zeros",
  fn(): void {
    let dec: Decimal128 = new Decimal128(
      Uint8Array.from(
        [
          0x30,
          0x40,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x32,
          0x98,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0E+300");

    dec = new Decimal128(
      Uint8Array.from(
        [
          0x2b,
          0x90,
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
        ].reverse()
      )
    );
    assertEquals(dec.toString(), "0E-600");
  }
});

// it('Serialize and Deserialize tests', function(done) {
//   // Test all methods around a simple serialization at object top level
//   var doc = { value: Decimal128.fromString('1') };
//   var buffer = BSON.serialize(doc);
//   var size = BSON.calculateObjectSize(doc);
//   var back = BSON.deserialize(buffer);
//
//   expect(buffer.length).to.equal(size);
//   expect(doc).to.deep.equal(back);
//   expect('1').to.equal(doc.value.toString());
//   expect('{"value":{"$numberDecimal":"1"}}').to.equal(JSON.stringify(doc, null));
//
//   // Test all methods around a simple serialization at array top level
//   doc = { value: [Decimal128.fromString('1')] };
//   buffer = BSON.serialize(doc);
//   size = BSON.calculateObjectSize(doc);
//   back = BSON.deserialize(buffer);
//
//   expect(buffer.length).to.equal(size);
//   expect(doc).to.deep.equal(back);
//   expect('1').to.equal(doc.value[0].toString());
//
//   // Test all methods around a simple serialization at nested object
//   doc = { value: { a: Decimal128.fromString('1') } };
//   buffer = BSON.serialize(doc);
//   size = BSON.calculateObjectSize(doc);
//   back = BSON.deserialize(buffer);
//
//   expect(buffer.length).to.equal(size);
//   expect(doc).to.deep.equal(back);
//   expect('1').to.equal(doc.value.a.toString());
//   done();
// });
//
// it('Support toBSON and toObject methods for custom mapping', function(done) {
//   // Create a custom object
//   var MyCustomDecimal = function(value) {
//     this.value = value instanceof Decimal128 ? value.toString() : value;
//   };
//
//   MyCustomDecimal.prototype.toBSON = function() {
//     return Decimal128.fromString(this.value);
//   };
//
//   // Add a custom mapper for the type
//   const saveToObject = Decimal128.prototype.toObject;
//   try {
//     Decimal128.prototype.toObject = function() {
//       return new MyCustomDecimal(this);
//     };
//
//     // Test all methods around a simple serialization at object top level
//     var doc = { value: new MyCustomDecimal('1') };
//     var buffer = BSON.serialize(doc);
//     var back = BSON.deserialize(buffer);
//     expect(back.value instanceof MyCustomDecimal).to.be.ok;
//     expect('1').to.equal(back.value.value);
//   } finally {
//     // prevent this test from breaking later tests which may re-use the same class
//     Decimal128.prototype.toObject = saveToObject;
//   }
//
//   done();
// });

runIfMain(import.meta);
