import { Long } from "./long/mod.ts";
import { encode } from "./transcoding.ts";

const MASK_8: number = 0xff;
const MASK_24: number = 0xffffff;
const MASK_32: number = 0xffffffff;

// See http://www.isthe.com/chongo/tech/comp/fnv/#FNV-param
const FNV_PRIME: Long = new Long(16777619, 0);
const OFFSET_BASIS: Long = new Long(2166136261, 0);
const FNV_MASK: Long = new Long(MASK_32, 0);

/**
 * Implementation of the FNV-1a hash for a 32-bit hash value.
 * More: http://www.isthe.com/chongo/tech/comp/fnv/#FNV-1a
 */
export function fnv1a32(input: string, encoding: string = "utf8"): number {
  const octets: Uint8Array = encode(input, encoding);
  let hash: Long = OFFSET_BASIS;
  for (let i: number = 0; i < octets.length; i += 1) {
    hash = hash.xor(new Long(octets[i], 0));
    hash = hash.multiply(FNV_PRIME);
    hash = hash.and(FNV_MASK);
  }
  return hash.getLowBitsUnsigned();
}

/**
 * Implements FNV-1a to generate 32-bit hash, then uses xor-folding
 * to convert to a 24-bit hash. See here for more info:
 * http://www.isthe.com/chongo/tech/comp/fnv/#xor-fold
 */
export function fnv1a24(input: string, encoding: string = "utf8"): number {
  const _32bit: number = fnv1a32(input, encoding);
  const base: number = _32bit & MASK_24;
  const top: number = (_32bit >>> 24) & MASK_8;
  const final: number = (base ^ top) & MASK_24;
  return final;
}
