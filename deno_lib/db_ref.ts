/** A class representation of the BSON DBRef type. */
export class DBRef {
  readonly _bsontype: string = "DBRef";

  readonly collection: string;
  readonly oid: any;
  readonly db: string;
  readonly fields: { [key: string]: any };

  /** Creates a DBRef type. */
  constructor(
    collection: string,
    oid: any,
    db?: string,
    fields?: { [key: string]: any }
  ) {
    // Check if namespace has been provided
    const parts: string[] = collection.split(".");
    if (parts.length === 2) {
      db = parts.shift();
      collection = parts.shift();
    }
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
}
