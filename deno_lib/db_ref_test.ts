import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals } from "https://deno.land/x/testing/asserts.ts";
import { encode, decode} from "./transcoding.ts"
import { deserialize } from "./bson.ts"
import { DBRef} from "./db_ref.ts"

const validTestVectors: { [key:string]: string}[] = JSON.parse(
  decode(Deno.readFileSync("./../corpus/db_ref_test_vectors.json"),"utf8")
).valid

validTestVectors.forEach(({ description, canonical_bson, canonical_extjson}:  { [key:string]: string}): void => {
  test({
    name: description,
    fn():void {
      const dbref: DBRef = deserialize(encode(canonical_bson, "hex"))
      const dbref_extjson: string = JSON.stringify(dbref.toExtendedJSON ? dbref.toExtendedJSON() : dbref)
      // Reparsing from extended JSON bc of hardly controllable key order
      assertEquals(JSON.parse(dbref_extjson), JSON.parse(canonical_extjson))
    }
  })
})

runIfMain(import.meta, { parallel: true});
