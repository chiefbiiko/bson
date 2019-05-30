import { Long } from "./long/mod.ts"

/** A class for the BSON DateTime type. */
export class DateTime {
  readonly _bsontype: string = "DateTime";
  
  readonly time: Long;
  
  /** Creates a BSON DateTime instance. */
  constructor(time: Long = Long.fromInt(new Date().getTime())) {
    this.time = time;
  }
  
  /** Creates a datetime from its extended JSON representation. */
  static fromExtendedJSON(doc: { $date:  {$numberLong: string}}): DateTime {
    return new DateTime(Long.fromString(doc.$date.$numberLong))
  }
  
  /** Extended JSON representation of a datetime. */
  toExtendedJSON(): { $date:  {$numberLong: string}} {
    return { $date: { $numberLong: this.time.toString() } }
  }
  
  /** JSON representation of a datetime. */
  toJSON(): { $date:  {$numberLong: string}}  {
    return this.toExtendedJSON();
  }
}