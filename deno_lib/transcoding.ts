import {
  toUint8Array as base64ToUint8Array,
  fromUint8Array as base64FromUint8Array
} from "https://deno.land/x/base64/mod.ts";

const decoder: TextDecoder = new TextDecoder();
const encoder: TextEncoder = new TextEncoder();

/** Serializes a Uint8Array to a hexadecimal string. */
function toHexString(buf: Uint8Array): string {
  return buf.reduce(
    (hex: string, byte: number): string =>
      hex + (byte < 16 ? "0" + byte.toString(16) : byte.toString(16)),
    ""
  );
}

/** Deserializes a Uint8Array from a hexadecimal string. */
function fromHexString(hex: string): Uint8Array {
  const len: number = hex.length;
  if (len % 2 || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new TypeError("Invalid hex string");
  }
  const buf: Uint8Array = new Uint8Array(Math.floor(len / 2));
  const end: number = len / 2;
  for (let i: number = 0; i < end; ++i) {
    buf[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return buf;
}

/** Decodes a Uint8Array to utf8-, base64-, or hex-encoded string. */
export function decode(buf: Uint8Array, encoding: string = "utf8"): string {
  if (/^utf-?8$/i.test(encoding)) {
    return decoder.decode(buf);
  } else if (/^base64$/i.test(encoding)) {
    return base64FromUint8Array(buf);
  } else if (/^hex(?:adecimal)?$/i.test(encoding)) {
    return toHexString(buf);
  } else {
    throw new TypeError("Unsupported string encoding");
  }
}

export function encode(str: string, encoding: string = "utf8"): Uint8Array {
  if (/^utf-?8$/i.test(encoding)) {
    return encoder.encode(str);
  } else if (/^base64$/i.test(encoding)) {
    return base64ToUint8Array(str);
  } else if (/^hex(?:adecimal)?$/i.test(encoding)) {
    return fromHexString(str);
  } else {
    throw new TypeError("Unsupported string encoding");
  }
}
