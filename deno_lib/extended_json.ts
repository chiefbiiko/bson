// 'use strict';
//
// // const Buffer = require('buffer').Buffer;
// // const Map = require('./map');
// const Long = require('./long');
// const Double = require('./double');
// const Timestamp = require('./timestamp');
// const ObjectId = require('./objectid');
// const BSONRegExp = require('./regexp');
// const BSONSymbol = require('./symbol');
// const Int32 = require('./int_32');
// const Code = require('./code');
// const Decimal128 = require('./decimal128');
// const MinKey = require('./min_key');
// const MaxKey = require('./max_key');
// const DBRef = require('./db_ref');
// const Binary = require('./binary');

import { Long } from "./long/mod.ts"
import { Double } from "./double.ts"
import { Timestamp } from "./timestamp.ts"
import {ObjectId } from "./object_id.ts"
import {BSONRegExp} from "./regexp.ts"
import {BSONSymbol} from "./symbol.ts"
import {Int32} from "./int32.ts"
import {Code} from "./code.ts"
import {Decimal128} from "./decimal128.ts"
import {MinKey} from "./min_key.ts"
import {MaxKey} from "./max_key.ts"
import { DBRef} from "./db_ref.ts"
import {Binary} from "./binary.ts"
import { BSON_INT32_MIN, BSON_INT32_MAX, BSON_INT64_MIN, BSON_INT64_MAX} from "./constants.ts"
// /**
//  * @namespace EJSON
//  */

// all the types where we don't need to do any special processing and can just pass the EJSON
//straight to type.fromExtendedJSON
const keysToCodecs: { [key:string]: any} = {
  $oid: ObjectId,
  $binary: Binary,
  $symbol: BSONSymbol,
  $numberInt: Int32,
  $numberDecimal: Decimal128,
  $numberDouble: Double,
  $numberLong: Long,
  $minKey: MinKey,
  $maxKey: MaxKey,
  $regularExpression: BSONRegExp,
  $timestamp: Timestamp
};

/** Deserializes a value from its extended JSON representation. */
function deserializeValue(/*self:any, key: string, */value: any, options?: {relaxed?: boolean}): any {
  if (typeof value === 'number') {
    if (options.relaxed) {
      return value;
    }
    // if it's an integer, should interpret as smallest BSON integer
    // that can represent it exactly. (if out of range, interpret as double.)
    if (Math.floor(value) === value) {
      if (value >= BSON_INT32_MIN && value <= BSON_INT32_MAX){ return new Int32(value);}
      if (value >= BSON_INT64_MIN && value <= BSON_INT64_MAX) {return Long.fromNumber(value);}
    }
    // If the number is a non-integer or out of integer range, should interpret as BSON Double.
    return new Double(value);
  }
  // from here on out we're looking for bson types, so bail if its not an object
  if (value === null || typeof value !== 'object'){ return value;}
  // upgrade deprecated undefined to null
  if (value.hasOwnProperty("$undefined")) {return null;}
  // Find this values codec
  const codecKey:  string = Object.keys(value)
    .find((k : string): boolean => k.startsWith('$') && value[k] && keysToCodecs[k])
    // .find()
  // const codec: Function =
  if (codecKey) {
    const codec: any = keysToCodecs[codecKey]
    return codec.fromExtendedJSON(value, options)
  }
  // for (const key of keys) {
  //   let c: any = keysToCodecs[key];
  //   if (c){ return c.fromExtendedJSON(value, options);}
  // }
  if (value.hasOwnProperty("$date")) {
    const d: number| string | Long = value.$date!;
    const date: Date = new Date();
    if (typeof d === 'string') {date.setTime(Date.parse(d));}
    else if (Long.isLong(d)){ date.setTime((d as Long).toNumber());}
    else if (typeof d === 'number' && options.relaxed){ date.setTime(d);}
    return date;
  }
  if (value.hasOwnProperty("$code")) {
    let copy: any = Object.assign({}, value);
    if (value.hasOwnProperty("$scope")) {
      copy.$scope = deserializeValue(/*self, null, */value.$scope!);
    }
    return Code.fromExtendedJSON(copy);
  }
  if (value.hasOwnProperty("$ref") || value.hasOwnProperty("$dbPointer")) {
    let v: unknown = value.hasOwnProperty("$ref") ? value : value.$dbPointer!;
    // we run into this in a "degenerate EJSON" case (with $id and $ref order flipped)
    // because of the order JSON.parse goes through the document
    if (v instanceof DBRef) {return v;}
    // const dollarKeys: string[] = Object.keys(v).filter(k => k.startsWith('$'))
    if (v instanceof Object) {
      const valid: boolean = Object.keys(v)
        .reduce((acc, k): number => k === "$ref" || k === "$id" || k === "$db" ? ++acc : --acc, 0) === 3;
    // let valid: boolean = true;
    // dollarKeys.forEach((k: string): void => {
    //   if (['$ref', '$id', '$db'].indexOf(k) === -1){ valid = false;}
    // });
    // only make DBRef if $ keys are all valid
    if (valid) {return DBRef.fromExtendedJSON(v);}
    }
  }
  return value;
}

/**
 * Parse an Extended JSON string, constructing the JavaScript value or object described by that
 * string.
 */
 function parse(text: string, options?: { relaxed?: boolean, strict?: boolean}): any {
  options = Object.assign({}, { relaxed: true }, options || {});
  // relaxed implies not strict
  if (typeof options.relaxed === 'boolean') {options.strict = !options.relaxed;}
  if (typeof options.strict === 'boolean') {options.relaxed = !options.strict;}
  return JSON.parse(text, (_: string, value: any): any => deserializeValue(/*this, key, */value, options));
}

//
// Serializer
//

// MAX INT32 boundaries
// const BSON_INT32_MAX = 0x7fffffff,
//   BSON_INT32_MIN = -0x80000000,
//   BSON_INT64_MAX = 0x7fffffffffffffff,
//   BSON_INT64_MIN = -0x8000000000000000;

/**
 * Converts a BSON document to an Extended JSON string, optionally replacing values if a replacer
 * function is specified or optionally including only the specified properties if a replacer array
 * is specified.
 */
function stringify(value: any, replacer?: (number | string)[], space?: number | string, options?:{ relaxed?: boolean}): string {
  // if (space != null && typeof space === 'object') {
  //   options = space;
  //   space = 0;
  // }
  // if (replacer != null && typeof replacer === 'object' && !Array.isArray(replacer)) {
  //   options = replacer;
  //   replacer = null;
  //   space = 0;
  // }
  options = Object.assign({}, { relaxed: true }, options || {});

  const doc: { [key:string]: any} = Array.isArray(value)
    ? serializeArray(value, options)
    : serializeDocument(value, options);

  return JSON.stringify(doc, replacer, space);
}

/**
 * Serializes an object to an Extended JSON string, and reparse it as a
 * JavaScript object.
 */
function serialize(bson: any, options?:{ relaxed?: boolean}): any {
  options = options || {};
  return JSON.parse(stringify(bson, null, null, options));
}

/**
 * Deserializes an Extended JSON object into a plain JavaScript object with
 * native/BSON types.
 */
function deserialize(ejson: { [key:string]: any}, options?: { relaxed?: boolean, strict?: boolean}): any {
  return parse(JSON.stringify(ejson), options);
}

////

/** Serializes every item in the input array. */
function serializeArray(arr: any[], options?: { relaxed?: boolean}): any {
  return arr.map((v: any) => serializeValue(v, options));
}

/** Creates an ISO string containing ms only if that part is non zero. */
function getISOString(date: Date): string {
  const iso: string = date.toISOString();
  // we should only show milliseconds in timestamp if they're non-zero
  return date.getUTCMilliseconds() !== 0 ? iso : iso.slice(0, -5) + 'Z';
}

function serializeValue(value: any, options?: { relaxed?: boolean}): any {
  if (Array.isArray(value)) {return serializeArray(value, options);}
  if (value === undefined || value === null) {return null;}
  if (value instanceof Date) {
    const time: number = value.getTime()
      // is it in year range 1970-9999?
      const inRange: boolean = time > -1 && time < 253402318800000;
    return options.relaxed && inRange
      ? { $date: getISOString(value) }
      : { $date: { $numberLong: time.toString() } };
  }
  if (typeof value === 'number' && !options.relaxed) {
    // it's an integer
    if (Math.floor(value) === value) {
      // let int32Range = value >= BSON_INT32_MIN && value <= BSON_INT32_MAX,
        // int64Range = value >= BSON_INT64_MIN && value <= BSON_INT64_MAX;
      // interpret as being of the smallest BSON integer type that can represent the number exactly
      if (value >= BSON_INT32_MIN && value <= BSON_INT32_MAX) {return { $numberInt: value.toString() };}
      if (value >= BSON_INT64_MIN && value <= BSON_INT64_MAX){ return { $numberLong: value.toString() };}
    }
    return { $numberDouble: value.toString() };
  }
  if (value instanceof RegExp) {
    // let flags = value.flags;
    // if (flags === undefined) {
    let flags: string
    if (value.hasOwnProperty("flags")) {
      flags = (value as any).flags
    } else {
      flags = value.toString().match(/[gimuy]*$/)[0];
    }
    const rx = new BSONRegExp(value.source, flags);
    return rx.toExtendedJSON();
  }
  if (typeof value === 'object') {return serializeDocument(value, options);}
  return value;
}

const BSON_TYPE_MAPPINGS: { [key:string]: any} = {
  Binary: (o: any): Binary => new Binary(o.value(), o.subtype),
  Code: (o: any): Code => new Code(o.code, o.scope),
  DBRef: (o: any): DBRef => new DBRef(o.collection || o.namespace, o.oid, o.db, o.fields), // "namespace" for 1.x library backwards compat
  Decimal128: (o: any): Decimal128 => new Decimal128(o.bytes),
  Double: (o: any): Double => new Double(o.value),
  Int32: (o: any): Int32 => new Int32(o.value),
  Long: (o: any): Long =>
    Long.fromBits(
      // underscore variants for 1.x backwards compatibility
      o.low != null ? o.low : o.low_,
      o.low != null ? o.high : o.high_,
      o.low != null ? o.unsigned : o.unsigned_
    ),
  MaxKey: (): MaxKey => new MaxKey(),
  MinKey: (): MinKey => new MinKey(),
  ObjectID: (o: any): ObjectId => new ObjectId(o),
  ObjectId: (o: any): ObjectId => new ObjectId(o), // support 4.0.0/4.0.1 before _bsontype was reverted back to ObjectID
  BSONRegExp: (o: any): BSONRegExp => new BSONRegExp(o.pattern, o.options),
  BSONSymbol: (o: any): BSONSymbol => new BSONSymbol(o.value),
  Timestamp: (o: any): Timestamp => Timestamp.fromBits(o.low, o.high)
};

function serializeDocument(doc: any/*{ [key:string]: any}*/, options?: { relaxed?: boolean}): { [key:string]: any} {
  if (doc == null || typeof doc !== 'object') {throw new Error('not an object instance');}
  const bsontype: string = doc._bsontype;
  if (!bsontype) {
    // It's a regular object. Recursively serialize its property values.
    const _doc: { [key:string]: any} = {};
    for (const name in doc) {
      _doc[name] = serializeValue(doc[name], options);
    }
    return _doc;
  } else if (typeof bsontype === 'string') {
    // The "document" is really just a BSON type object
    let _doc:{ [key:string]: any} = doc;
    if (typeof _doc.toExtendedJSON !== 'function') {
      // There's no EJSON serialization function on the object. It's probably an
      // object created by a previous version of this library (or another library)
      // that's duck-typing objects to look like they were generated by this library).
      // Copy the object into this library's version of that type.
      const mapper: (o: any) => any = BSON_TYPE_MAPPINGS[bsontype];
      if (!mapper) {
        throw new TypeError('Unrecognized or invalid _bsontype: ' + bsontype);
      }
      _doc = mapper(_doc);
    }
    // Two BSON types may have nested objects that may need to be serialized too
    if (bsontype === 'Code' && _doc.scope) {
      _doc = new Code(_doc.code, serializeValue(_doc.scope, options));
    } else if (bsontype === 'DBRef' && _doc.oid) {
      _doc = new DBRef(_doc.collection, serializeValue(_doc.oid, options), _doc.db, _doc.fields);
    }
    if (bsontype === "Int32" || bsontype === "Double") {
      // These two BSON types allow option relaxed
      return _doc.toExtendedJSON(options);
    } else {
      return _doc.toExtendedJSON();
    }
  } else {
    throw new Error('_bsontype must be a string, but was: ' + typeof bsontype);
  }
}

export const EJSON: { [key:string]: Function} = {
  parse,
  deserialize,
  serialize,
  stringify
}
// module.exports = {
//   parse,
//   deserialize,
//   serialize,
//   stringify
// };
