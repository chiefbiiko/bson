import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assert, assertEquals } from "https://deno.land/x/testing/asserts.ts";
import { MAX_VALUE, Timestamp } from "./timestamp.ts";
import { MAX_UNSIGNED_VALUE, Long } from "./long/mod.ts";

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
    assertEquals(timestamp.toJSON(), { $timestamp: "18446744073709551615" });
    assertEquals(timestamp.toExtendedJSON(), {
      $timestamp: { t: 4294967295, i: 4294967295 }
    });
  }
});

runIfMain(import.meta, { parallel: true });
