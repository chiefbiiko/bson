import { toUint8Array, fromUint8Array } from "https://deno.land/x/base64/mod.ts";

const encoder: TextEncoder = new TextEncoder();
const decoder: TextDecoder = new TextDecoder();

/**
 * A class representation of the BSON Binary type.
 */
class Binary {
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
    this.sub_type = subType == null ? BSON_BINARY_SUBTYPE_DEFAULT : subType;
    this.position = 0;

    if (buf !== null) {
      if (typeof buf === 'string') {
        this.buffer = encoder.encode(buf);
      } else {
        this.buffer = Uint8Array.from(buf);
      }
      this.position = this.buffer.length;
    } else {
      this.buffer = new Uint8Array(Binary.BUFFER_SIZE);
    }
  }

  /** Updates a binary with a single byte_value. */
  put(byte_value: number | string | Uint8Array | number[]): void {
    if (byte_value === null) {
      throw new TypeError("byte_value must not be null")
    }
    if (typeof byte_value !== 'number' && byte_value.length !== 1) {
      throw new TypeError('only accepts single character String, Uint8Array or Array');
    }
    if (typeof byte_value === 'number' && (byte_value < 0 || byte_value > 255 || byte_value % 1 !== 0)) {
            throw new TypeError('only accepts number in a valid unsigned byte range 0..255');
    }

    // Decode the byte value once
    let decoded_byte: number = null;
    if (typeof byte_value === "number") {
      decoded_byte = byte_value;
    } else if (typeof byte_value === 'string') {
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
  write(buf: Uint8Array | string, offset: number = this.position): void {
    if (this.buffer.length < offset + buf.length) {
      // this.buffer is to small let's extend the buffer
      let buffer = new Uint8Array(Binary.BUFFER_SIZE + this.buffer.length);
      buffer.set(this.buffer, 0);
      this.buffer = buffer;
    }

    if (typeof buf === "string") {
      buf = encoder.encode(buf);
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
  value(asRaw: boolean = false): Uint8Array | string {
    if (asRaw) {
      return Uint8Array.from(this.buffer.subarray(0, this.position));
    } else {
      return decoder.decode(this.buffer.subarray(0, this.position))
    }
  }

  /** Length of a binary. */
  length(): number {
    return this.position;
  }

  /** String representation of a binary */
  toString(format: string): string {
    const buf: Uint8Array = this.buffer.subarray(0, this.position)
    if (/^utf-?8$/i.test(format)) {
      return decoder.decode(buf)
    } else if (/^base64$/i.test(format))  {
      return fromUint8Array(buf);
    } else if (/^hex(?:adecimal)?$/i.test(format)) {
      return toHexString(buf);
    } else {
      throw new TypeError("Unsupported string format")
    }
  }

  // /** JSON representation of a binary (actually just base64???) */
  // toJSON(): string {
  //   return fromUint8Array(this.buffer.subarray(0, this.position));
  // }

  /** ?? */
  toExtendedJSON(): { $binary: { base64: string, subType: string } } {
    const base64: string = fromUint8Array(this.buffer);
    const subType: string = this.sub_type.toString(16);
    return {
      $binary: {
        base64,
        subType: subType.length === 1 ? '0' + subType : subType
      }
    };
  }

  /** ?? */
  static fromExtendedJSON(doc: { $binary: { base64: string, subType: string } }): Binary {
    const type: number = doc.$binary.subType ? parseInt(doc.$binary.subType, 16) : 0;
    return new Binary(toUint8Array(doc.$binary.base64), type);
  }
}

function toHexString(buf: Uint8Array): string {
  return buf.reduce((hex: string, byte: number): string => {
    hex += byte < 16 ? "0" + byte.toString(16) : byte.toString(16);
    return hex;
  }, "");
}

/**
 * Binary default subtype
 * @ignore
 */
const BSON_BINARY_SUBTYPE_DEFAULT = 0;

Binary.BUFFER_SIZE = 256;

/**
 * Default BSON type
 *
 * @classconstant SUBTYPE_DEFAULT
 **/
Binary.SUBTYPE_DEFAULT = 0;
/**
 * Function BSON type
 *
 * @classconstant SUBTYPE_DEFAULT
 **/
Binary.SUBTYPE_FUNCTION = 1;
/**
 * Byte Array BSON type
 *
 * @classconstant SUBTYPE_DEFAULT
 **/
Binary.SUBTYPE_BYTE_ARRAY = 2;
/**
 * OLD UUID BSON type
 *
 * @classconstant SUBTYPE_DEFAULT
 **/
Binary.SUBTYPE_UUID_OLD = 3;
/**
 * UUID BSON type
 *
 * @classconstant SUBTYPE_DEFAULT
 **/
Binary.SUBTYPE_UUID = 4;
/**
 * MD5 BSON type
 *
 * @classconstant SUBTYPE_DEFAULT
 **/
Binary.SUBTYPE_MD5 = 5;
/**
 * User BSON type
 *
 * @classconstant SUBTYPE_DEFAULT
 **/
Binary.SUBTYPE_USER_DEFINED = 128;

Object.defineProperty(Binary.prototype, '_bsontype', { value: 'Binary' });
module.exports = Binary;
