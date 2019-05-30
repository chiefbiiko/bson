import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals, assertThrows } from "https://deno.land/x/testing/asserts.ts";
import { encode, decode} from "./transcoding.ts"
import { deserialize } from "./bson.ts"
import { Binary } from "./binary.ts"

const testVectors: { [key:string]: any} = JSON.parse(
  decode(Deno.readFileSync("./../corpus/binary_test_vectors.json"),"utf8")
)

testVectors.valid.forEach(({ description, canonical_bson, canonical_extjson}:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      const bin: Binary = deserialize(encode(canonical_bson, "hex"))
      const bin_extjson: string = JSON.stringify(bin.toExtendedJSON ? bin.toExtendedJSON() : bin)
      // Reparsing from extended JSON bc of hardly controllable key order
      assertEquals(JSON.parse(bin_extjson), JSON.parse(canonical_extjson))
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
