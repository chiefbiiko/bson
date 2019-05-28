import { encode, decode } from "./transcoding.ts";

import {
  BSON_BINARY_SUBTYPE_DEFAULT,
  BSON_BINARY_SUBTYPE_FUNCTION,
  BSON_BINARY_SUBTYPE_BYTE_ARRAY,
  BSON_BINARY_SUBTYPE_UUID_OLD,
  BSON_BINARY_SUBTYPE_UUID,
  BSON_BINARY_SUBTYPE_MD5,
  BSON_BINARY_SUBTYPE_USER_DEFINED
} from "./constants.ts";

/** A class representation of the BSON Binary type. */
export class Binary {
  static readonly BUFFER_SIZE: number = 256;
  static readonly SUBTYPE_DEFAULT: number = BSON_BINARY_SUBTYPE_DEFAULT;
  static readonly SUBTYPE_FUNCTION: number = BSON_BINARY_SUBTYPE_FUNCTION;
  static readonly SUBTYPE_BYTE_ARRAY: number = BSON_BINARY_SUBTYPE_BYTE_ARRAY;
  static readonly SUBTYPE_UUID_OLD: number = BSON_BINARY_SUBTYPE_UUID_OLD;
  static readonly SUBTYPE_UUID: number = BSON_BINARY_SUBTYPE_UUID;
  static readonly SUBTYPE_MD5: number = BSON_BINARY_SUBTYPE_MD5;
  static readonly SUBTYPE_USER_DEFINED: number = BSON_BINARY_SUBTYPE_USER_DEFINED;

  readonly _bsontype: string = "Binary";

  private readonly sub_type: number;
  private position: number;
  private buffer: Uint8Array;

  /**
   * Create a Binary type
   *
   * Sub types
   *  - **BSON.BSON_BINARY_SUBTYPE_DEFAULT**, default BSON type.
   *  - **BSON.BSON_BINARY_SUBTYPE_FUNCTION**, BSON function type.
   *  - **BSON.BSON_BINARY_SUBTYPE_BYTE_ARRAY**, BSON byte array type.
   *  - **BSON.BSON_BINARY_SUBTYPE_UUID**, BSON uuid type.
   *  - **BSON.BSON_BINARY_SUBTYPE_MD5**, BSON md5 type.
   *  - **BSON.BSON_BINARY_SUBTYPE_USER_DEFINED**, BSON user defined type.
   */
  constructor(buf?: Uint8Array | number[] | string, subType?: number) {
    this.sub_type = subType == null ? Binary.SUBTYPE_DEFAULT : subType;
    this.position = 0;

    if (buf !== null) {
      if (typeof buf === "string") {
        this.buffer = encode(buf, "utf8");
      } else {
        this.buffer = Uint8Array.from(buf);
      }
      this.position = this.buffer.length;
    } else {
      this.buffer = new Uint8Array(Binary.BUFFER_SIZE);
    }
  }

  /** Creates a binary from its extended JSON representation. */
  static fromExtendedJSON(doc: {
    $binary: { base64: string; subType: string };
  }): Binary {
    const type: number = doc.$binary.subType
      ? parseInt(doc.$binary.subType, 16)
      : 0;
    return new Binary(encode(doc.$binary.base64, "base64"), type);
  }

  /** Updates a binary with a single byte_value. */
  put(byte_value: number | string | Uint8Array | number[]): void {
    if (byte_value === null) {
      throw new TypeError("byte_value must not be null");
    }
    if (typeof byte_value !== "number" && byte_value.length !== 1) {
      throw new TypeError(
        "only accepts single character String, Uint8Array or Array"
      );
    }
    if (
      typeof byte_value === "number" &&
      (byte_value < 0 || byte_value > 255 || byte_value % 1 !== 0)
    ) {
      throw new TypeError(
        "only accepts number in a valid unsigned byte range 0..255"
      );
    }

    // Decode the byte value once
    let decoded_byte: number = null;
    if (typeof byte_value === "number") {
      decoded_byte = byte_value;
    } else if (typeof byte_value === "string") {
      decoded_byte = byte_value.charCodeAt(0);
    } else {
      decoded_byte = byte_value[0];
    }

    if (this.buffer.length > this.position) {
      this.buffer[this.position++] = decoded_byte;
    } else {
      // this.buffer is too small let's extend the buffer
      let buffer = new Uint8Array(Binary.BUFFER_SIZE + this.buffer.length);
      buffer.set(this.buffer, 0);
      this.buffer = buffer;
      this.buffer[this.position++] = decoded_byte;
    }
  }

  /** Writes a buffer or string to a binary. */
  write(buf: Uint8Array | string, offset: number = this.position): void {
    if (this.buffer.length < offset + buf.length) {
      // this.buffer is to small let's extend it
      let buffer = new Uint8Array(Binary.BUFFER_SIZE + this.buffer.length);
      buffer.set(this.buffer, 0);
      this.buffer = buffer;
    }

    if (typeof buf === "string") {
      buf = encode(buf, "utf8") as Uint8Array;
    }

    this.buffer.set(buf, offset);
    this.position =
      offset + buf.length > this.position ? offset + buf.length : this.position;
  }

  /** Reads **length** bytes starting at **position**. */
  read(position: number, length?: number): Uint8Array {
    length = length > 0 && length % 1 === 0 ? length : this.position;
    return Uint8Array.from(this.buffer.subarray(position, position + length));
  }

  /** Returns the value of a binary as an Uint8Array or string. */
  value(asRaw: boolean = false): Uint8Array | string {
    if (asRaw) {
      return Uint8Array.from(this.buffer.subarray(0, this.position));
    } else {
      return decode(this.buffer.subarray(0, this.position));
    }
  }

  /** Length of a binary. */
  get length(): number {
    return this.position;
  }

  /** String representation of a binary. */
  toString(format: string = "utf8"): string {
    const buf: Uint8Array = this.buffer.subarray(0, this.position);
    return decode(buf, format);
  }

  /** JSON fragment representation of a binary. */
  toJSON(): string {
    return decode(this.buffer.subarray(0, this.position), "base64");
  }

  /** Extended JSON representation of a binary. */
  toExtendedJSON(): { $binary: { base64: string; subType: string } } {
    const subType: string = this.sub_type.toString(16);
    return {
      $binary: {
        base64: decode(this.buffer, "base64"),
        subType: subType.length === 1 ? "0" + subType : subType
      }
    };
  }
}
