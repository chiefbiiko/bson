import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import {
  assert,
  assertEquals,
  assertThrows
} from "https://deno.land/x/testing/asserts.ts";
import { encode } from "./transcoding.ts";
import { ObjectId } from "./object_id.ts";

test({
  name: "should correctly handle objectId timestamps",
  fn(): void {
    const a: ObjectId = ObjectId.fromTime(1);
    assertEquals(a.id.slice(0, 4), Uint8Array.from([0, 0, 0, 1]));
    assertEquals(a.generationTime, 1);
    assertEquals(a.getTimestamp().getTime(), 1000);
    const b: ObjectId = new ObjectId();
    b.generationTime = 1;
    assertEquals(b.id.slice(0, 4), Uint8Array.from([0, 0, 0, 1]));
    assertEquals(b.generationTime, 1);
    assertEquals(b.getTimestamp().getTime(), 1000);
  }
});

test({
  name: "should correctly create ObjectId from uppercase hexstring",
  fn(): void {
    let a: string = "AAAAAAAAAAAAAAAAAAAAAAAA";
    let b: ObjectId = new ObjectId(a);
    let c: boolean = b.equals(a);
    assert(c);
    a = "aaaaaaaaaaaaaaaaaaaaaaaa";
    b = new ObjectId(a);
    c = b.equals(a);
    assert(c);
    assertEquals(b.toString(), a);
  }
});

test({
  name: "should correctly create ObjectId from Buffer",
  fn(): void {
    let a: string = "AAAAAAAAAAAAAAAAAAAAAAAA";
    let b: ObjectId = new ObjectId(encode(a, "hex"));
    let c: boolean = b.equals(a);
    assert(c);
    a = "aaaaaaaaaaaaaaaaaaaaaaaa";
    b = new ObjectId(encode(a, "hex"));
    c = b.equals(a);
    assert(c);
    assertEquals(b.toString(), a);
  }
});

test({
  name: "should correctly allow for node.js inspect to work with ObjectId",
  fn(): void {
    let a: string = "AAAAAAAAAAAAAAAAAAAAAAAA";
    let b: ObjectId = new ObjectId(a);
    assertEquals(b.inspect(), a.toLowerCase());
  }
});

test({
  name: "should isValid check input Buffer length",
  fn(): void {
    let bufTooShort: Uint8Array = Uint8Array.from([]);
    let bufTooLong: Uint8Array = Uint8Array.from([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13
    ]);
    let buf12Bytes: Uint8Array = Uint8Array.from([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12
    ]);
    assert(!ObjectId.isValid(bufTooShort));
    assert(!ObjectId.isValid(bufTooLong));
    assert(ObjectId.isValid(buf12Bytes));
  }
});

test({
  name:
    "should throw if a 12-char string is passed in with character codes greater than 256",
  fn(): void {
    const hex: string = "abcdefabcdefabcdefabcdef";
    const oid: ObjectId = new ObjectId(hex);
    assertEquals(oid.toString("hex"), hex);
    assertThrows(() => new ObjectId("abcdefŽhijklabcdefabcdef"));
  }
});

test({
  name: "should correctly interpret timestamps beyond 2038",
  fn(): void {
    let farFuture: number = new Date("2040-01-01T00:00:00.000Z").getTime();
    const oid: ObjectId = new ObjectId(ObjectId.generate(farFuture / 1000));
    assertEquals(oid.getTimestamp().getTime(), farFuture);
  }
});

runIfMain(import.meta, { parallel: true });
