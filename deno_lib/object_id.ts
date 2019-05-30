import {Int32} from "./int32.ts"
import { encode, decode } from "./transcoding.ts";

/**  A class representation of the BSON ObjectId type. */
export class ObjectId {
  /** Session counter. */
  protected static index: number = ~~(Math.random() * 0xffffff);
  /** Regular expression that checks for hex value. */
  protected static readonly HEX_24: RegExp = /^[0-9a-fA-F]{24}$/;
  /** Regex for a literal "hex*". */
  protected static readonly HEX: RegExp = /^hex(adecimal)?$/i
  /** 5 cs bytes. */
  protected static readonly PROCESS_UNIQUE: Uint8Array = crypto.getRandomValues(
    new Uint8Array(5)
  );

  readonly _bsontype: string = "ObjectId";
  readonly id: Uint8Array;
  private _cachedHex?: string;

  /** Creates an ObjectId instance. */
  constructor(id?: number | Int32 | string | Uint8Array) {
    if (typeof id === "number" || id instanceof Int32 || id === null || id === undefined) {
      // The most common usecase (blank id, new objectId instance)
      // For this case param id should be considered an int timestamp in s
      this.id = ObjectId.generate(id instanceof Int32 ? id.value : id as number);
    } else if (typeof id === "string" && ObjectId.HEX_24.test(id)) {
      this._cachedHex = id.toLowerCase();
      this.id = encode(id, "hex");
    } else if (id instanceof Uint8Array && id.byteLength === 12) {
      this.id = id;
    } else {
      throw new TypeError(`Invalid input: ${id}.`);
    }
  }

  /** Creates an object id from a its extended JSON representation. */
  static fromExtendedJSON(doc: { $oid: string }): ObjectId {
    return new ObjectId(doc.$oid);
  }

  /** Update the index used to generate new ObjectIds on the driver. */
  static getInc(): number {
    return (ObjectId.index = (ObjectId.index + 1) % 0xffffff);
  }

  /** Generate a 12 byte id buffer used in ObjectIds. */
  static generate(time?: number): Uint8Array {
    if (time === null || time === undefined) {
      time = ~~(Date.now() / 1000);
    }
    if (Number.isNaN(time) || !Number.isFinite(time) || time < 0 || time % 1) {
      throw new TypeError("Input must be an integer timestamp.");
    }
    const inc: number = ObjectId.getInc();
    const buf: Uint8Array = new Uint8Array(12);
    // 4-byte timestamp
    buf[3] = time & 0xff;
    buf[2] = (time >> 8) & 0xff;
    buf[1] = (time >> 16) & 0xff;
    buf[0] = (time >> 24) & 0xff;
    // 5-byte process unique
    buf[4] = ObjectId.PROCESS_UNIQUE[0];
    buf[5] = ObjectId.PROCESS_UNIQUE[1];
    buf[6] = ObjectId.PROCESS_UNIQUE[2];
    buf[7] = ObjectId.PROCESS_UNIQUE[3];
    buf[8] = ObjectId.PROCESS_UNIQUE[4];
    // 3-byte counter
    buf[11] = inc & 0xff;
    buf[10] = (inc >> 8) & 0xff;
    buf[9] = (inc >> 16) & 0xff;
    return buf;
  }

  /**
   * Creates an ObjectId from a second based number, with the rest of the
   * ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
   */
  static fromTime(time: number): ObjectId {
    const buf: Uint8Array = Uint8Array.from([
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0
    ]);
    // Encode time into first 4 bytes
    buf[3] = time & 0xff;
    buf[2] = (time >> 8) & 0xff;
    buf[1] = (time >> 16) & 0xff;
    buf[0] = (time >> 24) & 0xff;
    // Return the new objectId
    return new ObjectId(buf);
  }

  /** Checks if a value is a valid bson ObjectId. */
  static isValid(id: ObjectId | number | string | Uint8Array): boolean {
    if (id === null) {
      return false;
    }
    if (id instanceof ObjectId || typeof id === "number") {
      return true;
    }
    if (typeof id === "string" && ObjectId.HEX_24.test(id)) {
      return true;
    }
    if (id.length === 12) {
      return true;
    }
    return false;
  }

  /** Creates an ObjectId from a hex string representation of an ObjectId. */
  static fromHexString(str: string): ObjectId {
    if (str === null || !ObjectId.HEX_24.test(str)) {
      throw new TypeError(
        "Input must be a string of 24 hexadecimal characters."
      );
    }
    return new ObjectId(encode(str, "hex"));
  }

  get generationTime(): number {
    return (
      this.id[3] | (this.id[2] << 8) | (this.id[1] << 16) | (this.id[0] << 24)
    );
  }

  set generationTime(time: number) {
    if (
      time === null ||
      Number.isNaN(time) ||
      !Number.isFinite(time) ||
      time < 0 ||
      time % 1
    ) {
      throw new TypeError("Input must be an integer timestamp in seconds.");
    }
    // Encode time into first 4 bytes
    this.id[3] = time & 0xff;
    this.id[2] = (time >> 8) & 0xff;
    this.id[1] = (time >> 16) & 0xff;
    this.id[0] = (time >> 24) & 0xff;
  }

  inspect(format: string = "hex"): string {
    return this.toString(format);
  }

  /** Compares the equality of this ObjectId with the other. */
  equals(other: ObjectId | string | Uint8Array): boolean {
    if (other instanceof ObjectId) {
      return this.toString("hex") === other.toString("hex");
    }
    if (!ObjectId.isValid(other)) {
      return false;
    }
    let otherHex: string;
    if (other instanceof Uint8Array) {
      otherHex = decode(other, "hex");
    } else {
      otherHex = other;
    }
    return otherHex.toLowerCase() === this.toString("hex");
  }

  /** Returns the generation date (accurate up to the second) for an oid. */
  getTimestamp(): Date {
    const date: Date = new Date();
    const time: number = new DataView(this.id.buffer).getUint32(0, false);
    date.setTime(Math.floor(time) * 1000);
    return date;
  }

  /** Extended JSON representation of an object id. */
  toExtendedJSON(): { $oid: string } {
    return { $oid: this.toString("hex") };
  }

  /** Converts to its JSON representation. */
  toJSON(): { $oid: string } {
    return { $oid: this.toString("hex") };
  }

  /** Converts the id into a 24-byte string, hex by default. */
  toString(format: string = "hex"): string {
    if (ObjectId.HEX.test(format)) {
      if (this._cachedHex) {
        return this._cachedHex;
      } else {
        const hex: string = decode(this.id, "hex");
        this._cachedHex = hex;
        return hex;
      }
    }
    return decode(this.id, format);
  }
}
