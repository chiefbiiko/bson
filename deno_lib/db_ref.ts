import { Int32} from "./int32.ts"
import { ObjectId} from "./object_id.ts"

const HEX_24: RegExp = /^[0-9a-fA-F]{24}$/;

/** A class representation of the BSON DBRef type. */
export class DBRef {
  readonly _bsontype: string = "DBRef";

  readonly collection: string;
  readonly oid: any; // ObjectId;
  readonly db: string;
  readonly fields: { [key: string]: any };

  /** Creates a DBRef type. */
  constructor(
    collection: string,
    oid: any,// number | Int32 | string | Uint8Array | ObjectId,
    db?: string,
    fields?: { [key: string]: any }
  ) {
    // Check if namespace has been provided
    const parts: string[] = collection.split(".");
    if (parts.length === 2) {
      db = parts.shift();
      collection = parts.shift();
    }
    // if (oid instanceof ObjectId) {
    //   this.oid = oid;
    // } else if ((oid instanceof Uint8Array && oid.byteLength === 12) || oid instanceof Int32 || typeof oid === "number" || HEX_24.test(oid as string)) {
    //   this.oid = new ObjectId(oid)
    // } else {
    //   throw new TypeError("Invalid object id argument.")
    // }
    this.collection = collection;
    this.oid = oid;
    this.db = db;
    this.fields = fields || {};
  }

  /** Creates a db reference from its extended JSON representation. */
  static fromExtendedJSON(doc: { [key: string]: any }): DBRef {
    const copy: { [key: string]: any } = Object.assign({}, doc);
    ["$ref", "$id", "$db"].forEach(k => delete copy[k]);
    return new DBRef(doc.$ref, doc.$id, doc.$db, copy);
  }

  // the 1.x parser used a "namespace" property, while 4.x uses "collection".
  // To ensure backwards  compatibility, let's expose "namespace"
  get namespace(): string {
    return this.collection;
  }

  /** Extended JSON representation of a db reference. */
  toExtendedJSON(): { [key: string]: any } {
    const doc: { [key: string]: any } = Object.assign(
      {
        $ref: this.collection,
        $id: this.oid
      },
      this.fields
    );
    if (this.db) {
      doc.$db = this.db;
    }
    return doc;
  }
  
  /** JSON fragment representation of a db reference. */
  toJSON(): { [key: string]: any } {
    const doc: { [key: string]: any } = Object.assign(
      {
        $ref: this.collection,
        $id: this.oid
      },
      this.fields
    );
    if (this.db) {
      doc.$db = this.db;
    }
    return doc;
  }
}
