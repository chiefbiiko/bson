import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals, assertThrows } from "https://deno.land/x/testing/asserts.ts";
import { encode, decode} from "./transcoding.ts"
import { serialize, deserialize } from "./bson.ts"

const testVectors: { [key:string]: any} = JSON.parse(
  decode(Deno.readFileSync("./../corpus/code_test_vectors.json"),"utf8")
)

testVectors.valid
.forEach(({ description, canonical_bson, canonical_extjson}:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      const expected_bson: Uint8Array = encode(canonical_bson, "hex")
      const code: { [key:string]: any} = deserialize(expected_bson)
      const code_extjson: string = JSON.stringify(code.toExtendedJSON ? code.toExtendedJSON() : code)
      // Reparsing from extended JSON bc of hardly controllable key order
      assertEquals(JSON.parse(code_extjson), JSON.parse(canonical_extjson))
      assertEquals(serialize(code), expected_bson)
    }
  })
})

testVectors.decodeErrors.forEach(({ description, bson }:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      assertThrows(() => deserialize(encode(bson, "hex")))
    }
  })
})

runIfMain(import.meta, { parallel: true});
