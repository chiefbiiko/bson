import { fnv1a24 } from "./fnv1a.ts";
import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals } from "https://deno.land/x/testing/asserts.ts";

import { decode } from "./transcoding.ts";

interface TestVector {
  hash: string;
  vector?: string;
  vectorHex?: string;
}

const testVectors: TestVector[] = JSON.parse(
  decode(Deno.readFileSync("./fnv1a_test_vectors.json"))
).vectors;

test({
  name: "24 bit FNV-1a",
  fn(): void {
    for (const { hash, vector, vectorHex } of testVectors) {
      let encoding: string;
      if (vector) {
        encoding = "utf8";
      } else if (vectorHex) {
        encoding = "hex";
      }

      const hashed: number = fnv1a24(vector || vectorHex, encoding);
      let hashedHex: string = hashed.toString(16);
      hashedHex = hashedHex.length % 2 ? "0" + hashedHex : hashedHex;

      assertEquals(hashedHex, hash);
    }
  }
});

runIfMain(import.meta);
