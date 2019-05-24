import { toUint8Array } from "https://deno.land/x/base64/mod.ts";

export interface Wasm {
  buffer: Uint8Array;
  exports: { [key: string]: any };
}

export function loadWasm(): Wasm {
  const wasm: Wasm = {} as Wasm;
  wasm.buffer = toUint8Array(
    "AGFzbQEAAAABDQJgAAF/YAR/f39/AX8DBwYAAQEBAQEGBgF/AUEACwcyBgNtdWwAAQVkaXZfcwACBWRpdl91AAMFcmVtX3MABAVyZW1fdQAFCGdldF9oaWdoAAAKyQEGBAAjAAsmAQF+IACtIAGtQiCGhCACrSADrUIghoR+IQQgBEIgh6ckACAEpwsmAQF+IACtIAGtQiCGhCACrSADrUIghoR/IQQgBEIgh6ckACAEpwsmAQF+IACtIAGtQiCGhCACrSADrUIghoSAIQQgBEIgh6ckACAEpwsmAQF+IACtIAGtQiCGhCACrSADrUIghoSBIQQgBEIgh6ckACAEpwsmAQF+IACtIAGtQiCGhCACrSADrUIghoSCIQQgBEIgh6ckACAEpws="
  );
  wasm.exports = new WebAssembly.Instance(
    new WebAssembly.Module(wasm.buffer)
  ).exports;
  return wasm;
}
