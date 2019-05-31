import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assert, assertEquals } from "https://deno.land/x/testing/asserts.ts";
import { MAX_VALUE, Timestamp } from "./timestamp.ts";
import { MAX_UNSIGNED_VALUE, Long } from "./long/mod.ts";
import { encode, decode} from "./transcoding.ts"
import { serialize, deserialize } from "./bson.ts"

const testVectors: { [key:string]: any} = JSON.parse(
  decode(Deno.readFileSync("./../corpus/timestamp_test_vectors.json"),"utf8")
)

testVectors.valid
.forEach(({ description, canonical_bson, canonical_extjson}:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      const expected_bson: Uint8Array = encode(canonical_bson, "hex")
      const doc: { [key:string]: any} = deserialize(expected_bson, { promoteValues: false })
      const bson: Uint8Array = serialize(doc);
      assertEquals(bson, expected_bson);
      // assertEquals(EJSON.parse(EJSON.stringify(doc)), doc);
      // assertEquals(doc, EJSON.parse(canonical_extjson));
    }
  })
})

test({
  name: "should have a MAX_VALUE equal to MAX_UNSIGNED_VALUE of Long",
  fn(): void {
    assertEquals(MAX_VALUE, MAX_UNSIGNED_VALUE);
  }
});

test({
  name: "should always be an unsigned value",
  fn(): void {
    [
      new Timestamp(),
      new Timestamp(0xff, 0xffffffff),
      new Timestamp(0xffffffff, 0xffffffff),
      new Timestamp(-1, -1),
      new Timestamp(new Timestamp(0xffffffff, 0xffffffff)),
      new Timestamp(new Long(0xffffffff, 0xfffffffff, false)),
      new Timestamp(new Long(0xffffffff, 0xfffffffff, true))
    ].forEach(timestamp => assert(timestamp.unsigned));
  }
});

test({
  name: "should print out an unsigned number",
  fn(): void {
    const timestamp: Timestamp = new Timestamp(0xffffffff, 0xffffffff);
    assertEquals(timestamp.toString(), "18446744073709551615");
    assertEquals(timestamp.toJSON(), timestamp.toExtendedJSON());
    assertEquals(timestamp.toExtendedJSON(), {
      $timestamp: { t: 4294967295, i: 4294967295 }
    });
  }
});

runIfMain(import.meta, { parallel: true });
