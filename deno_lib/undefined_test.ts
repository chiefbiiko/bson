import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals } from "https://deno.land/x/testing/asserts.ts";
import { encode, decode} from "./transcoding.ts"
import { serialize, deserialize } from "./bson.ts"

const testVectors: { [key:string]: any} = JSON.parse(
  decode(Deno.readFileSync("./../corpus/undefined_test_vectors.json"),"utf8")
)

testVectors.valid
.forEach(({ description, converted_bson, converted_extjson}:  { [key:string]: string}): void => {
  // using the converted instead of the canonical items since this module
  // promotes deprecated undefineds to nulls by default (toggleable)
  test({
    name: description,
    fn():void {
      const expected_bson: Uint8Array = encode(converted_bson, "hex")
      const doc: { [key:string]: any} = deserialize(expected_bson)
      const doc_extjson: string = JSON.stringify(doc)
      // Reparsing from extended JSON bc of hardly controllable key order
      assertEquals(JSON.parse(doc_extjson), JSON.parse(converted_extjson))
      assertEquals(serialize(doc), expected_bson)
    }
  })
})

runIfMain(import.meta, { parallel: true});
