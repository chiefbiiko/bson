// 'use strict';

// const Buffer = require('buf').Buffer;
// const Map = require('./map');
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
// const constants = require('./constants');
// const EJSON = require('./extended_json');
import { DeserializationOptions, deserialize } from "./parser/deserializer.ts"
import { SerializationOptions, serializeAny } from "./parser/serializer.ts"
import { calculateSize } from "./parser/calculate_size.ts"

export {
  BSON_INT32_MAX,
  BSON_INT32_MIN,
  BSON_INT64_MAX,
  BSON_INT64_MIN,
  JS_INT_MAX,
  JS_INT_MIN,
  BSON_DATA_NUMBER,
  BSON_DATA_STRING,
  BSON_DATA_OBJECT,
  BSON_DATA_ARRAY,
  BSON_DATA_BINARY,
  BSON_DATA_UNDEFINED,
  BSON_DATA_OID,
  BSON_DATA_BOOLEAN,
  BSON_DATA_DATE,
  BSON_DATA_NULL,
  BSON_DATA_REGEXP,
  BSON_DATA_DBPOINTER,
  BSON_DATA_CODE,
  BSON_DATA_SYMBOL,
  BSON_DATA_CODE_W_SCOPE,
  BSON_DATA_INT,
  BSON_DATA_TIMESTAMP,
  BSON_DATA_LONG,
  BSON_DATA_DECIMAL128,
  BSON_DATA_MIN_KEY,
  BSON_DATA_MAX_KEY,
  BSON_BINARY_SUBTYPE_DEFAULT,
  BSON_BINARY_SUBTYPE_FUNCTION,
  BSON_BINARY_SUBTYPE_BYTE_ARRAY,
  BSON_BINARY_SUBTYPE_UUID,
  BSON_BINARY_SUBTYPE_MD5,
  BSON_BINARY_SUBTYPE_USER_DEFINED,
} from "./constants.ts"

export { Long } from "./long/mod.ts"
export { Double } from "./double.ts"
export { Timestamp } from "./timestamp.ts"
export{ObjectId } from "./object_id.ts"
// export {BSONRegExp} from "./regexp.ts"
// export {BSONSymbol} from "./symbol.ts"
export {Int32} from "./int32.ts"
export {Code} from "./code.ts"
export {Decimal128} from "./decimal128.ts"
export {MinKey} from "./min_key.ts"
export {MaxKey} from "./max_key.ts"
export { DBRef} from "./db_ref.ts"
export {Binary} from "./binary.ts"
export { EJSON} from "./extended_json.ts"
// import * as CONSTANTS from "./../CONSTANTS.ts"

// Parts of the parser
// const internalDeserialize = require('./parser/deserializer');
// const internalSerialize = require('./parser/serializer');
// const internalCalculateObjectSize = require('./parser/calculate_size');
// const ensureBuffer = require('./ensure_buf');

export {deserialize} from "./parser/deserializer.ts"
export { SerializationOptions } from "./parser/serializer.ts"




// /**
//  * @ignore
//  */
// Default Max Size
const MAXSIZE: number = 1024 * 1024 * 17;

// Current Internal Temporary Serialization Buffer
let buf: Uint8Array = new Uint8Array(MAXSIZE);

/** Sets the size of the internal serialization buf. */
export function setInternalBufferSize(size: number): void {
  if (buf.byteLength < size) {
    buf = new Uint8Array(size);
  }
}

/** Serializes a Javascript object. */
export function serialize(object: any, options:SerializationOptions = { depth: 0, serializeFunctions: false, checkKeys: false,/* ignoreUndefined: true, undefinedAsNull: true,*/ path: [], minInternalBufferSize: MAXSIZE}): Uint8Array {
  // options = options || {};
  // // Unpack the options
  // const checkKeys = typeof options.checkKeys === 'boolean' ? options.checkKeys : false;
  // const serializeFunctions =
  //   typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
  // const ignoreUndefined =
  //   typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;
  // const minInternalBufferSize =
  //   typeof options.minInternalBufferSize === 'number' ? options.minInternalBufferSize : MAXSIZE;

  // Resize the internal serialization buf if needed
  setInternalBufferSize(options.minInternalBufferSize)
  // if (buf.length < minInternalBufferSize) {
  //   buf = Buffer.alloc(minInternalBufferSize);
  // }

  // Attempt to serialize
  const serializationIndex: number = serializeAny(
    buf,
    object,
    0,
    options
    /*
    options.checkKeys,
    0,
    0,
    options.serializeFunctions,
    options.ignoreUndefined,
    []
    */
  );

  // // Create the final buf
  // const finalBuf: Uint8Array = new Uint8Array(serializationIndex);
  //
  // // Copy into the finished buf
  // // buf.copy(finishedBuffer, 0, 0, finishedBuffer.length);
  // buf.set(finalBuf, 0)
  //
  // // Return the buf
  // return finalBuf;
  return Uint8Array.from(buf.subarray(0, serializationIndex))
}

/**
 * Serialize a Javascript object using a predefined Buffer and index into the
 * buf, useful when pre-allocating the space for serialization.
 */
export function serializeInto(out: Uint8Array, object: any, offset: number = 0, options: SerializationOptions = { depth: 0, serializeFunctions: false, checkKeys:false, path: [], minInternalBufferSize: MAXSIZE}): number {
  if (out === null) {
    throw new TypeError("The output buffer must not be null.")
  }
  // options = options || {};
  // // Unpack the options
  // const checkKeys = typeof options.checkKeys === 'boolean' ? options.checkKeys : false;
  // const serializeFunctions =
  //   typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
  // const ignoreUndefined =
  //   typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;
  // const startIndex = typeof options.index === 'number' ? options.index : 0;

  // Rename internally for my own sanity, maybe rename API too
  // const offset: number = options.index;

  // Attempt to serialize
  const serializationIndex: number = serializeAny(
    buf,
    object,
    0,
    options
  /*  options.checkKeys,
    0,
    0,
    options.serializeFunctions,
    options.ignoreUndefined,
    null*/
  );
  // buf.copy(finalBuffer, startIndex, 0, serializationIndex);
out.subarray(offset).set(buf.subarray(0, serializationIndex))

  // Return the index
  return offset + serializationIndex - 1;
}

// /** Deserializes data as BSON. */
// export function deserialize(bson: Uint8Array, options: {
//   // Evaluate functions in the BSON document scoped to the object deserialized?
//   evalFunctions?: boolean,
//   // Cache evaluated functions for reuse?
//   cacheFunctions?: boolean,
//   // Use a crc32 code for caching, otherwise use the string of the function.
//   cacheFunctionsCrc32?: boolean,
//   // Downgrade Long to Number if it's smaller than 53 bits
//   promoteLongs?: boolean,
//   // Deserializing a Binary will return it as a node.js Buffer instance.
//   promoteBuffers?: boolean,
//   // Deserializing will promote BSON values to their closest nodejs types.
//   promoteValues?: boolean,
//   // Allow to specify what fields we wish to return as unserialized raw buf.
//   fieldsAsRaw?: any,
//   // Return BSON regular expressions as BSONRegExp instances.
//   bsonRegExp?: boolean,
//   // Allows the buf to be larger than the parsed BSON object.
//   allowObjectSmallerThanBufferSize?: boolean
// } = {
//   evalFunctions:false,
//   cacheFunctions: false,
//   cacheFunctionsCrc32: false,
//   promoteLongs: true,
//   promoteBuffers: false,
//   promoteValues: false,
//  fieldsAsRaw: null,
//   bsonRegExp: false,
//   allowObjectSmallerThanBufferSize: false
// }): any {
//   // buf = ensureBuffer(buf);
//   if (bson === null) {
//     throw new TypeError("The input buffer must not be null.")
//   }
//   return deserialize(bson, options);
// }

/**
 * Calculate the bson size for a passed in Javascript object.
 *
 * @param {Object} object the Javascript object to calculate the BSON byte size for.
 * @param {Boolean} [options.serializeFunctions=false] serialize the javascript functions **(default:false)**.
 * @param {Boolean} [options.ignoreUndefined=true] ignore undefined fields **(default:true)**.
 * @return {Number} returns the number of bytes the BSON object will take up.
 */
export function calculateObjectSize(object:any, options: { serializeFunctions?: boolean, ignoreUndefined?: boolean}= {serializeFunctions:false, ignoreUndefined:true}): number {
  // options = options || {};
  //
  // const serializeFunctions =
  //   typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false;
  // const ignoreUndefined =
  //   typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : true;

  return calculateSize(object, options.serializeFunctions, options.ignoreUndefined);
}

/**
 * Deserialize stream data as BSON documents.
 *
 * @param {Buffer} data the buf containing the serialized set of BSON documents.
 * @param {Number} startIndex the start index in the data Buffer where the deserialization is to start.
 * @param {Number} numberOfDocuments number of documents to deserialize.
 * @param {Array} documents an array where to store the deserialized documents.
 * @param {Number} docStartIndex the index in the documents array from where to start inserting documents.
 * @param {Object} [options] additional options used for the deserialization.
 * @param {Object} [options.evalFunctions=false] evaluate functions in the BSON document scoped to the object deserialized.
 * @param {Object} [options.cacheFunctions=false] cache evaluated functions for reuse.
 * @param {Object} [options.cacheFunctionsCrc32=false] use a crc32 code for caching, otherwise use the string of the function.
 * @param {Object} [options.promoteLongs=true] when deserializing a Long will fit it into a Number if it's smaller than 53 bits
 * @param {Object} [options.promoteBuffers=false] when deserializing a Binary will return it as a node.js Buffer instance.
 * @param {Object} [options.promoteValues=false] when deserializing will promote BSON values to their Node.js closest equivalent types.
 * @param {Object} [options.fieldsAsRaw=null] allow to specify if there what fields we wish to return as unserialized raw buf.
 * @param {Object} [options.bsonRegExp=false] return BSON regular expressions as BSONRegExp instances.
 * @return {Number} returns the next index in the buf after deserialization **x** numbers of documents.
 */
export function deserializeStream(bson: Uint8Array, bsonOffset: number=0, numberOfDocs: number=Infinity, docs: any[] = [], docsOffset:number = 0, options: DeserializationOptions = {}): {index: number, docs: any[]} {
  if (bson === null) {
    throw new TypeError("The input buffer must not be null.")
  }
  // options = Object.assign({ allowObjectSmallerThanBufferSize: true }, options);
  // data = ensureBuffer(data);

  let index: number = bsonOffset;
  // Loop over all documents
  for (let i:number = 0; i < numberOfDocs; i++) {
    // Find size of the document
    const size: number =
      bson[index] | (bson[index + 1] << 8) | (bson[index + 2] << 16) | (bson[index + 3] << 24);
      if (size === 0) {
        break;
      }
    // Update options with index
    // options.index = offset;
    // Parse the document at this point
    docs[docsOffset + i] = deserialize(bson.subarray(index, bson.byteLength), options/*options*/ /*{...options, offset: index}*/);
    // Adjust index by the document size
    index += size;
  }

  // Return object containing end index of parsing and list of documents
  // return index;
  return { index, docs }
}


// module.exports = {
  // // constants
  // // NOTE: this is done this way because rollup can't resolve an `Object.assign`ed export
  // BSON_INT32_MAX: constants.BSON_INT32_MAX,
  // BSON_INT32_MIN: constants.BSON_INT32_MIN,
  // BSON_INT64_MAX: constants.BSON_INT64_MAX,
  // BSON_INT64_MIN: constants.BSON_INT64_MIN,
  // JS_INT_MAX: constants.JS_INT_MAX,
  // JS_INT_MIN: constants.JS_INT_MIN,
  // BSON_DATA_NUMBER: constants.BSON_DATA_NUMBER,
  // BSON_DATA_STRING: constants.BSON_DATA_STRING,
  // BSON_DATA_OBJECT: constants.BSON_DATA_OBJECT,
  // BSON_DATA_ARRAY: constants.BSON_DATA_ARRAY,
  // BSON_DATA_BINARY: constants.BSON_DATA_BINARY,
  // BSON_DATA_UNDEFINED: constants.BSON_DATA_UNDEFINED,
  // BSON_DATA_OID: constants.BSON_DATA_OID,
  // BSON_DATA_BOOLEAN: constants.BSON_DATA_BOOLEAN,
  // BSON_DATA_DATE: constants.BSON_DATA_DATE,
  // BSON_DATA_NULL: constants.BSON_DATA_NULL,
  // BSON_DATA_REGEXP: constants.BSON_DATA_REGEXP,
  // BSON_DATA_DBPOINTER: constants.BSON_DATA_DBPOINTER,
  // BSON_DATA_CODE: constants.BSON_DATA_CODE,
  // BSON_DATA_SYMBOL: constants.BSON_DATA_SYMBOL,
  // BSON_DATA_CODE_W_SCOPE: constants.BSON_DATA_CODE_W_SCOPE,
  // BSON_DATA_INT: constants.BSON_DATA_INT,
  // BSON_DATA_TIMESTAMP: constants.BSON_DATA_TIMESTAMP,
  // BSON_DATA_LONG: constants.BSON_DATA_LONG,
  // BSON_DATA_DECIMAL128: constants.BSON_DATA_DECIMAL128,
  // BSON_DATA_MIN_KEY: constants.BSON_DATA_MIN_KEY,
  // BSON_DATA_MAX_KEY: constants.BSON_DATA_MAX_KEY,
  // BSON_BINARY_SUBTYPE_DEFAULT: constants.BSON_BINARY_SUBTYPE_DEFAULT,
  // BSON_BINARY_SUBTYPE_FUNCTION: constants.BSON_BINARY_SUBTYPE_FUNCTION,
  // BSON_BINARY_SUBTYPE_BYTE_ARRAY: constants.BSON_BINARY_SUBTYPE_BYTE_ARRAY,
  // BSON_BINARY_SUBTYPE_UUID: constants.BSON_BINARY_SUBTYPE_UUID,
  // BSON_BINARY_SUBTYPE_MD5: constants.BSON_BINARY_SUBTYPE_MD5,
  // BSON_BINARY_SUBTYPE_USER_DEFINED: constants.BSON_BINARY_SUBTYPE_USER_DEFINED,

  // // wrapped types
  // Code,
  // Map,
  // BSONSymbol,
  // DBRef,
  // Binary,
  // ObjectId,
  // Long,
  // Timestamp,
  // Double,
  // Int32,
  // MinKey,
  // MaxKey,
  // BSONRegExp,
  // Decimal128,

  // // methods
  // serialize,
  // serializeWithBufferAndIndex,
  // deserialize,
  // calculateObjectSize,
  // deserializeStream,
  // setInternalBufferSize,

  // // legacy support
  // ObjectID: ObjectId,

  // Extended JSON
  // EJSON
// };
