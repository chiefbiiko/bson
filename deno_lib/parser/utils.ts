import {
  prettier,
  prettierPlugins
} from "https://deno.land/std/prettier/prettier.ts";

/** Normalizes given function's string representation via prettier. */
export function normalizedFunctionString(fn: Function | string): string {
  return prettier.format(String(fn), {
    parser: "babel",
    plugins: prettierPlugins
  });
}

/** Calculates the byte length of an utf8 string. */
export function utf8ByteLength(str: string): number {
  let l: number = str.length;
  for (let i: number = str.length - 1; i >= 0; --i) {
    const code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) {
      ++l;
    } else if (code > 0x7ff && code <= 0xffff) {
      l += 2;
    }
    if (code >= 0xdc00 && code <= 0xdfff) {
      //trail surrogate
      i--;
    }
  }
  return l;
}
