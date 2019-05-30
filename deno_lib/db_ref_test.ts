// const BSON = require('../../lib/bson');
import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals } from "https://deno.land/x/testing/asserts.ts";
import { encode, decode} from "./transcoding.ts"
import { deserialize } from "./bson.ts"
import { DBRef} from "./db_ref.ts"

const validTestVectors: { [key:string]: string}[] = JSON.parse(
  decode(Deno.readFileSync("./db_ref_valid_test_vectors.json"),"utf8")
)

validTestVectors.forEach(({ canonical_bson, canonical_extjson}:  { [key:string]: string}): void => {
  const dbref: DBRef = deserialize(encode(canonical_bson, "hex"))
  console.log("dbref",dbref)
  assertEquals(JSON.stringify(dbref), canonical_extjson)
})

// // 0x0C foo\0 \0\0\07 String.fromCharCode(0x41, 0x42, 0xfffd, 0x43, 0x44) 12
// const bsonSnippet: Uint8Array = Uint8Array.from([
//   // Size
//   34,
//   0,
//   0,
//   0,
//   // BSON type for DBPointer
//   0x0c,
//   // CString Label Foo
//   0x66,
//   0x6f,
//   0x6f,
//   0,
//   // Length of UTF8 string "AB�CD"
//   8,
//   0,
//   0,
//   0,
//   0x41,
//   0x42,
//   0xef,
//   0xbf,
//   0xbd,
//   0x43,
//   0x44,
//   0,
//   // 12-bit pointer
//   1,
//   2,
//   3,
//   4,
//   5,
//   6,
//   7,
//   8,
//   9,
//   10,
//   11,
//   12,
//   // null terminator
//   0
// ]);
// 
// test({
//   name: "can serialize and deserialize 0xFFFD in dbpointer name",
//   fn(): void {
//     const doc: { [key: string]: any } = BSON.deserialize(bsonSnippet);
//   //////////////////
//   console.error(">>>>>>>>>>>>>>>>>>>>>>>>>>>> doc", JSON.stringify(doc))
//   //////////////////////////
//     const buf: Uint8Array = BSON.serialize(doc);
//     assertEquals(buf, bsonSnippet);
//   }
// });

runIfMain(import.meta);
