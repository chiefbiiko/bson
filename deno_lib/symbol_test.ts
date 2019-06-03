import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals, assertThrows } from "https://deno.land/x/testing/asserts.ts";
import { encode, decode} from "./transcoding.ts"
import { serialize, deserialize } from "./bson.ts"

const testVectors: { [key:string]: any} = JSON.parse(
  decode(Deno.readFileSync("./../corpus/symbol_test_vectors.json"),"utf8")
)

testVectors.valid
.forEach(({ description, converted_bson, converted_extjson}:  { [key:string]: string}): void => {
  // Using the converted instead of the canonical items since this module
  // promotes deprecated symbols to strings by default (no opt-out)
  test({
    name: description,
    fn():void {
      const expected_bson: Uint8Array = encode(converted_bson, "hex")
      const doc: { [key:string]: any} = deserialize(expected_bson, { promoteValues: false })
      const bson: Uint8Array = serialize(doc);
      assertEquals(bson, expected_bson);
      // assertEquals(EJSON.parse(EJSON.stringify(doc)), doc);
      // assertEquals(doc, EJSON.parse(canonical_extjson));
    }
  })
})

testVectors.decodeErrors.forEach(({ description, bson }:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      assertThrows(() => deserialize(encode(bson, "hex"), { promoteValues: false }))
    }
  })
})

runIfMain(import.meta, {parallel:true})
