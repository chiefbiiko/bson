import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assert } from "https://deno.land/x/testing/asserts.ts";
import { validateUtf8 } from "./validate_utf8.ts";
import { encode } from "./transcoding.ts";

test({
  name: "some greek",
  fn(): void {
    assert(validateUtf8(encode("κόσμε", "utf8")));
  }
});

test({
  name: "emojis",
  fn(): void {
    assert(validateUtf8(encode("😀", "utf8")));
    assert(validateUtf8(encode("😁", "utf8")));
    assert(validateUtf8(encode("🤑", "utf8")));
    assert(validateUtf8(encode("🤪", "utf8")));
    assert(validateUtf8(encode("🦏", "utf8")));
    assert(validateUtf8(encode("🐒", "utf8")));
    assert(validateUtf8(encode("🦁", "utf8")));
    assert(validateUtf8(encode("✌🏾", "utf8")));
  }
});

test({
  name: "invalid",
  fn(): void {
    assert(!validateUtf8(encode("\uDEB2", "utf8")));
    assert(!validateUtf8(encode("\uD83D \uDEB2", "utf8")));
  }
});

runIfMain(import.meta, { parallel: true });
