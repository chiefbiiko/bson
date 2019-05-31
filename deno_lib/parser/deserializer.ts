// 'use strict';
//
// const Buffer = require('buf').Buffer;
// const Long = require('../long');
// const Double = require('../double');
// const Timestamp = require('../timestamp');
// const ObjectId = require('../objectid');
// const Code = require('../code');
// const MinKey = require('../min_key');
// const MaxKey = require('../max_key');
// const Decimal128 = require('../decimal128');
// const Int32 = require('../int_32');
// const DBRef = require('../db_ref');
// const BSONRegExp = require('../regexp');
// const Binary = require('../binary');
// const CONSTANTS = require('../CONSTANTS');
// const validateUtf8 = require('../validate_utf8').validateUtf8;

import { Long } from "./../long/mod.ts"
import { Double } from "./../double.ts"
import { Timestamp } from "./../timestamp.ts"
import {ObjectId } from "./../object_id.ts"
import {BSONRegExp} from "./../regexp.ts"
import {BSONSymbol} from "./../symbol.ts"
import {Int32} from "./../int32.ts"
import {Code} from "./../code.ts"
import {Decimal128} from "./../decimal128.ts"
import {MinKey} from "./../min_key.ts"
import {MaxKey} from "./../max_key.ts"
import { DBRef} from "./../db_ref.ts"
import { DateTime } from "./../datetime.ts"
import {Binary} from "./../binary.ts"
import * as CONSTANTS from "./../constants.ts"
import { validateUtf8} from "./../validate_utf8.ts"
import { crc32 } from "./../crc32.ts";
import  {decode} from "./../transcoding.ts"

// Internal long versions
const JS_INT_MAX_LONG: Long = Long.fromNumber(CONSTANTS.JS_INT_MAX);
const JS_INT_MIN_LONG: Long = Long.fromNumber(CONSTANTS.JS_INT_MIN);

const functionCache: { [key:string]: Function} = {};

function deserializeObject(buf: Uint8Array, index: number, options: DeserializationOptions = {}, isArray: boolean= false):any {
  // const evalFunctions = options['evalFunctions'] == null ? false : options['evalFunctions'];
  // const cacheFunctions = options['cacheFunctions'] == null ? false : options['cacheFunctions'];
  // const cacheFunctionsCrc32 =
  //   options['cacheFunctionsCrc32'] == null ? false : options['cacheFunctionsCrc32'];

  // let crc32: any
  // if (!options.cacheFunctionsCrc32) {crc32 = null;}

  // const fieldsAsRaw = options['fieldsAsRaw'] == null ? null : options['fieldsAsRaw'];
  //
  // // Return raw bson buf instead of parsing it
  // const raw = options['raw'] == null ? false : options['raw'];
  //
  // // Return BSONRegExp objects instead of native regular expressions
  // const bsonRegExp = typeof options['bsonRegExp'] === 'boolean' ? options['bsonRegExp'] : false;
  //
  // // Controls the promotion of values vs wrapper classes
  // const promoteBuffers = options['promoteBuffers'] == null ? false : options['promoteBuffers'];
  // const promoteLongs = options['promoteLongs'] == null ? true : options['promoteLongs'];
  // const promoteValues = options['promoteValues'] == null ? true : options['promoteValues'];

  // Set the start index
  let startIndex: number = index;

  // Validate that we have at least 4 bytes of buf
  if (buf.byteLength < 5) {throw new TypeError('Corrupt bson buffer: byteLength < 5.');}

  // Read the document size
  const size: number =
    buf[index++] | (buf[index++] << 8) | (buf[index++] << 16) | (buf[index++] << 24);

  // Ensure buf is valid size
  if (size < 5 || size > buf.length) {throw new TypeError('Corrupt bson buffer.');}

  // Create holding object
  const object: any = isArray ? [] : {};
  // Used for arrays to skip having to perform utf8 decoding
  let arrayIndex: number = 0;
  let done: boolean = false;

  // While we have more left data left keep parsing
  while (!done) {
    // Read the type
    const elementType: number = buf[index++];

    // If we get a zero it's the last byte, exit
    if (elementType === 0) {break;}

    // Get the start search index
    let i: number = index;
    // Locate the end of the c string
    while (buf[i] !== 0 && i < buf.length) {
      ++i;
    }

    // If are at the end of the buf there is a problem with the document
    if (i >= buf.byteLength){ throw new TypeError('Corrupt bson buffer: illegal cstring.');}
    const name: number | string = isArray
      ? arrayIndex++
      : decode(buf.subarray(index, i), "utf8")//buf.toString('utf8', index, i);

    index = i + 1;

    if (elementType === CONSTANTS.BSON_DATA_STRING) {
      const stringSize: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      if (
        stringSize <= 0 ||
        stringSize > buf.length - index ||
        buf[index + stringSize - 1] !== 0
      )
        {throw new TypeError('Corrupt string length in bson.');}

      if (!validateUtf8(buf.subarray(index, index +stringSize -1))) {
        throw new TypeError('Invalid UTF-8 string in BSON document.');
      }

      // const s = buf.toString('utf8', index, index + stringSize - 1);
      const s: string = decode(buf.subarray(index, index +stringSize -1), "utf8")

      object[name] = s;
      index += stringSize;
    } else if (elementType === CONSTANTS.BSON_DATA_OID) {
      const oid: Uint8Array = new Uint8Array(12);
      // buf.copy(oid, 0, index, index + 12);
      oid.set(buf.subarray(index,index+12), 0)
      object[name] = new ObjectId(oid);
      index += 12;
    } else if (elementType === CONSTANTS.BSON_DATA_INT && !options.promoteValues) {
      object[name] = new Int32(
        buf[index++] | (buf[index++] << 8) | (buf[index++] << 16) | (buf[index++] << 24)
      );
    } else if (elementType === CONSTANTS.BSON_DATA_INT) {
      object[name] =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
    } else if (elementType === CONSTANTS.BSON_DATA_NUMBER && !options.promoteValues) {
      // object[name] = new Double(buf.readDoubleLE(index));
      object[name] = new Double(new DataView(buf.buffer).getFloat64(index, true));
      index += 8;
    } else if (elementType === CONSTANTS.BSON_DATA_NUMBER) {
      // object[name] = buf.readDoubleLE(index);
      object[name] = new DataView(buf.buffer).getFloat64(index, true);
      index += 8;
    } else if (elementType === CONSTANTS.BSON_DATA_DATE) {
      const lowBits: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      const highBits: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      // object[name] = new Date(new Long(lowBits, highBits).toNumber());
      object[name] = new DateTime(new Long(lowBits, highBits));
    } else if (elementType === CONSTANTS.BSON_DATA_BOOLEAN) {
      if (buf[index] !== 0 && buf[index] !== 1) {throw new TypeError('Illegal boolean type value.');}
      object[name] = buf[index++] === 1;
    } else if (elementType === CONSTANTS.BSON_DATA_OBJECT) {
      const _index: number = index;
      const objectSize: number =
        buf[index] |
        (buf[index + 1] << 8) |
        (buf[index + 2] << 16) |
        (buf[index + 3] << 24);
      if (objectSize <= 0 || objectSize > buf.length - index)
        {throw new Error('Bad embedded document length in bson.');}

      // We have a raw value
      if (options.raw) {
        object[name] = buf.slice(index, index + objectSize);
      } else {
        object[name] = deserializeObject(buf, _index, options, false);
      }

      index += objectSize;
    } else if (elementType === CONSTANTS.BSON_DATA_ARRAY) {
      const _index: number = index;
      const objectSize: number =
        buf[index] |
        (buf[index + 1] << 8) |
        (buf[index + 2] << 16) |
        (buf[index + 3] << 24);
      let arrayOptions: { [key:string]: any} = options;

      // Stop index
      const stopIndex: number = index + objectSize;

      // All elements of array to be returned as raw bson
      if (options.fieldsAsRaw && options.fieldsAsRaw[name]) {
        arrayOptions = {};
        for (let n in options) {arrayOptions[n] = options[n];}
        arrayOptions.raw = true;
      }

      object[name] = deserializeObject(buf, _index, arrayOptions, true);
      index += objectSize;

      if (buf[index - 1] !== 0) {throw new TypeError('Invalid array terminator byte.');}
      if (index !== stopIndex) {throw new TypeError('Corrupted array bson.');}
    } else if (elementType === CONSTANTS.BSON_DATA_UNDEFINED) {
      // undefined is deprecated - promoting to a null
      object[name] = null;
    } else if (elementType === CONSTANTS.BSON_DATA_NULL) {
      object[name] = null;
    } else if (elementType === CONSTANTS.BSON_DATA_LONG) {
      // Unpack the low and high bits
      const lowBits: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      const highBits: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      const long: Long = new Long(lowBits, highBits);
      // Promote the long if possible
      if (options.promoteValues) {
        object[name] =
          long.lessThanOrEqual(JS_INT_MAX_LONG) && long.greaterThanOrEqual(JS_INT_MIN_LONG)
            ? long.toNumber()
            : long;
      } else {
        object[name] = long;
      }
    } else if (elementType === CONSTANTS.BSON_DATA_DECIMAL128) {
      // Buffer to contain the decimal bytes
      const bytes: Uint8Array = new Uint8Array(16);
      // Copy the next 16 bytes into the bytes buf
      // buf.copy(bytes, 0, index, index + 16);
      bytes.set( buf.subarray(index, index+16),0)
      // Update index
      index += 16;
      // Assign the new Decimal128 value
      const decimal128: Decimal128 = new Decimal128(bytes);
      // If we have an alternative mapper use that
      object[name] = decimal128["toObject"] ? decimal128["toObject"]() : decimal128;
    } else if (elementType === CONSTANTS.BSON_DATA_BINARY) {
      let binarySize: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      const totalBinarySize: number = binarySize;
      const subType: number = buf[index++];

      // Did we have a negative binary size, throw
      if (binarySize < 0) {throw new TypeError('Negative binary type element size found.');}

      // Is the length longer than the document
      if (binarySize > buf.byteLength)
        {throw new TypeError('Binary type size larger than document size');}

      // Decode as raw Buffer object if options specifies it
      // if (buf['slice'] != null) {
      // If we have subtype 2 skip the 4 bytes for the size
      if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
        binarySize =
          buf[index++] |
          (buf[index++] << 8) |
          (buf[index++] << 16) |
          (buf[index++] << 24);
        if (binarySize < 0)
          {throw new TypeError('Negative binary type element size found for Binary.SUBTYPE_BYTE_ARRAY.');}
        if (binarySize > totalBinarySize - 4)
          {throw new TypeError('Binary type with subtype 0x02 contains to long binary size');}
        if (binarySize < totalBinarySize - 4)
          {throw new TypeError('Binary type with subtype 0x02 contains to short binary size');}
      }

      if (options.promoteValues) {
        object[name] = buf.slice(index, index + binarySize);
      } else {
        object[name] = new Binary(buf.slice(index, index + binarySize), subType);
      }
      // }
      // else {
      //   const _buf =
      //     typeof Uint8Array !== 'undefined'
      //       ? new Uint8Array(new ArrayBuffer(binarySize))
      //       : new Array(binarySize);
      //   // If we have subtype 2 skip the 4 bytes for the size
      //   if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
      //     binarySize =
      //       buf[index++] |
      //       (buf[index++] << 8) |
      //       (buf[index++] << 16) |
      //       (buf[index++] << 24);
      //     if (binarySize < 0)
      //       throw new Error('Negative binary type element size found for subtype 0x02');
      //     if (binarySize > totalBinarySize - 4)
      //       throw new Error('Binary type with subtype 0x02 contains to long binary size');
      //     if (binarySize < totalBinarySize - 4)
      //       throw new Error('Binary type with subtype 0x02 contains to short binary size');
      //   }
      //
      //   // Copy the data
      //   for (i = 0; i < binarySize; i++) {
      //     _buf[i] = buf[index + i];
      //   }
      //
      //   if (promoteBuffers && promoteValues) {
      //     object[name] = _buf;
      //   } else {
      //     object[name] = new Binary(_buf, subType);
      //   }
      // }

      // Update the index
      index += binarySize;
    } else if (elementType === CONSTANTS.BSON_DATA_REGEXP && options.promoteValues) {
      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buf[i] !== 0 && i < buf.length) {
        ++i;
      }
      // If are at the end of the buf there is a problem with the document
      if (i >= buf.length) {throw new TypeError('Corrupt bson buffer: illegal cstring.');}
      // Return the C string
      // const source = buf.toString('utf8', index, i);
      const source: string = decode(buf.subarray(index,i), "utf8")
      // Create the regexp
      index = i + 1;

      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buf[i] !== 0 && i < buf.length) {
        ++i;
      }
      // If are at the end of the buf there is a problem with the document
      if (i >= buf.length) {throw new TypeError('Corrupt bson buffer: illegal cstring.');}
      // Return the C string
      const regExpOptions: string = decode(buf.subarray(index,i), "utf8")//buf.toString('utf8', index, i);
      index = i + 1;

      // For each option add the corresponding one for javascript
      const optionsArray: string[] = new Array(regExpOptions.length);

      // Parse options
      for (i = 0; i < regExpOptions.length; i++) {
        switch (regExpOptions[i]) {
          case 'm':
            optionsArray[i] = 'm';
            break;
          case 's':
            optionsArray[i] = 'g';
            break;
          case 'i':
            optionsArray[i] = 'i';
            break;
        }
      }

      object[name] = new RegExp(source, optionsArray.join(''));
    } else if (elementType === CONSTANTS.BSON_DATA_REGEXP && !options.promoteValues) {
      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buf[i] !== 0 && i < buf.length) {
        ++i;
      }
      // If are at the end of the buf there is a problem with the document
      if (i >= buf.length) {throw new TypeError('Corrupt bson buffer: illegal cstring.');}
      // Return the C string
      // const source = buf.toString('utf8', index, i);
      const source: string = decode(buf.subarray(index,i), "utf8")
      index = i + 1;

      // Get the start search index
      i = index;
      // Locate the end of the c string
      while (buf[i] !== 0 && i < buf.length) {
        ++i;
      }
      // If are at the end of the buf there is a problem with the document
      if (i >= buf.length) {throw new TypeError('Corrupt bson buffer: illegal cstring.');}
      // Return the C string
      const regExpOptions: string = decode(buf.subarray(index,i), "utf8")// = buf.toString('utf8', index, i);
      index = i + 1;

      // Set the object
      object[name] = new BSONRegExp(source, regExpOptions);
    } else if (elementType === CONSTANTS.BSON_DATA_SYMBOL) {
      const stringSize: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      if (
        stringSize <= 0 ||
        stringSize > buf.length - index ||
        buf[index + stringSize - 1] !== 0
      )
        {throw new TypeError('Bad string length in bson.');}
      // symbol is deprecated - promoting to a string by default
      if (!options.promoteValues) {
              object[name] = new BSONSymbol(decode(buf.subarray(index,index+stringSize-1), "utf8"))
      } else {
         object[name] = decode(buf.subarray(index,index+stringSize-1), "utf8")
      }
      index += stringSize;
    } else if (elementType === CONSTANTS.BSON_DATA_TIMESTAMP) {
      const lowBits: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      const highBits: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);

      object[name] = new Timestamp(lowBits, highBits);
    } else if (elementType === CONSTANTS.BSON_DATA_MIN_KEY) {
      object[name] = new MinKey();
    } else if (elementType === CONSTANTS.BSON_DATA_MAX_KEY) {
      object[name] = new MaxKey();
    } else if (elementType === CONSTANTS.BSON_DATA_CODE) {
      const stringSize: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      if (
        stringSize <= 0 ||
        stringSize > buf.length - index ||
        buf[index + stringSize - 1] !== 0
      )
        {throw new TypeError('Bad string length in bson');}
      const functionString: string = decode(buf.subarray(index, index + stringSize - 1), "utf8")//buf.toString('utf8', index, index + stringSize - 1);

      // If we are evaluating the functions
      if (options.evalFunctions) {
        // If we have cache enabled let's look for the md5 of the function in the cache
        if (options.cacheFunctions) {
          const hash: number | string = options.cacheFunctionsCrc32 ? crc32(functionString) : functionString;
          // Got to do this to avoid V8 deoptimizing the call due to finding eval
          object[name] = isolateEvalWithHash(functionCache, hash, functionString, object);
        } else {
          object[name] = isolateEval(functionString);
        }
      } else {
        object[name] = new Code(functionString);
      }

      // Update parse index position
      index += stringSize;
    } else if (elementType === CONSTANTS.BSON_DATA_CODE_W_SCOPE) {
      const totalSize: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);

      // Element cannot be shorter than totalSize + stringSize + documentSize + terminator
      if (totalSize < 4 + 4 + 4 + 1) {
        throw new TypeError(`Code with scope too short: ${totalSize}.`);
      }

      // Get the code string size
      const strSize: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      // Check if we have a valid string
      if (
        strSize <= 0 ||
        strSize > buf.length - index ||
        buf[index + strSize - 1] !== 0
      )
        {throw new TypeError('Bad string length in bson.');}

      // Javascript function
      const functionString:string = decode(buf.subarray(index, index + strSize - 1), "utf8")//buf.toString('utf8', index, index + stringSize - 1);
      // Update parse index position
      index += strSize;
      // Parse the element
      const _index: number = index;

      // Decode the size of the object document
      const objectSize: number =
        buf[index] |
        (buf[index + 1] << 8) |
        (buf[index + 2] << 16) |
        (buf[index + 3] << 24);
      // Decode the scope object
      const scopeObject: any = deserializeObject(buf, _index, options, false);
      // Adjust the index
      index += objectSize;

      // Check if field length is to short
      if (totalSize < 4 + 4 + objectSize + strSize) {
        throw new TypeError('Code with scope total size is too short, truncating scope.');
      }

      // Check if totalSize field is to long
      if (totalSize > 4 + 4 + objectSize + strSize) {
        throw new TypeError('Code with scope total size is too long, clips outer document.');
      }

      // If we are evaluating the functions
      if (options.evalFunctions) {
        // If we have cache enabled let's look for the md5 of the function in the cache
        if (options.cacheFunctions) {
          const hash: number | string = options.cacheFunctionsCrc32 ? crc32(functionString) : functionString;
          // Got to do this to avoid V8 deoptimizing the call due to finding eval
          object[name] = isolateEvalWithHash(functionCache, hash, functionString, object);
        } else {
          object[name] = isolateEval(functionString);
        }

        object[name].scope = scopeObject;
      } else {
        object[name] = new Code(functionString, scopeObject);
      }
    } else if (elementType === CONSTANTS.BSON_DATA_DBPOINTER) {
      // Get the code string size
      const strSize: number =
        buf[index++] |
        (buf[index++] << 8) |
        (buf[index++] << 16) |
        (buf[index++] << 24);
      // Check if we have a valid string
      if (
        strSize <= 0 ||
        strSize > buf.length - index ||
        buf[index + strSize - 1] !== 0
      )
      {  throw new TypeError('Bad string length in bson.');}
      // Namespace
      if (!validateUtf8(buf.subarray(index, index + strSize - 1))) {
        throw new TypeError('Invalid UTF-8 string in BSON document.');
      }
      // const namespace = buf.toString('utf8', index, index + strSize - 1);
      const namespace: string = decode(buf.subarray(index, index + strSize - 1), "utf8")
      // Update parse index position
      index += strSize;

      // Read the oid
      // const oidBuffer = Buffer.alloc(12);
      // buf.copy(oidBuffer, 0, index, index + 12);
      const oid: ObjectId = new ObjectId(buf.slice(index, index + 12)/*oidBuffer*/);

      // Update the index
      index += 12;

      // Upgrade to DBRef type
      object[name] = new DBRef(namespace, oid);
    } else {
      throw new TypeError(`Detected unknown BSON type ${elementType.toString(16)} for fieldname "${name}", are you using the latest BSON parser?`
      );
    }
  }

  // Check if the deserialization was against a valid array/object
  if (size !== index - startIndex) {
    // if (isArray) {throw new TypeError('Corrupt array bson.');}
    throw new TypeError(`Corrupt ${isArray ? "array" : "object"} bson.`);
  }

  // check if object's $ keys are those of a DBRef
  const valid: boolean = Object.keys(object)
    .filter(k => k.startsWith('$'))
    .reduce((acc, k): number => k === "$ref" || k === "$id" || k === "$db" ? ++acc : --acc, 0) === 3;
  // const dollarKeys: string[] = Object.keys(object).filter(k => k.startsWith('$'));
  // let valid: boolean = true;
  // dollarKeys.forEach(k => {
  //   if (['$ref', '$id', '$db'].indexOf(k) === -1) valid = false;
  // });

  // if a $key not in "$ref", "$id", "$db", don't make a DBRef
  if (!valid) {return object;}

  if (object.$id && object.$ref) {
    const copy: { [key:string]:any } = Object.assign({}, object);
    delete copy.$ref;
    delete copy.$id;
    delete copy.$db;
    return new DBRef(object.$ref, object.$id, object.$db || null, copy);
  }

  return object;
}

/** Ensures eval is isolated. */
function isolateEvalWithHash(functionCache: { [key:string]: Function}, hash: number | string, functionString: string, object: any): Function {
  // Contains the value we are going to set
  const value: Function = null;

  // Check for cache hit, eval if missing and return cached function
  if (functionCache[hash]) {
    eval('value = ' + functionString);
    functionCache[hash] = value;
  }

  // Set the object
  return functionCache[hash].bind(object);
}

/** Ensures eval is isolated. */
function isolateEval(functionString: string): Function {
  // Contains the value we are going to set
   const value: Function = null;
  // Eval the function
  eval('value = ' + functionString);
  return value;
}

/** Deserealization options. */
export interface DeserializationOptions {
  // Evaluate functions in the BSON document scoped to the object deserialized?
  evalFunctions?: boolean,
  // Cache evaluated functions for reuse?
  cacheFunctions?: boolean,
  // Use a crc32 code for caching, otherwise use the string of the function.
  cacheFunctionsCrc32?: boolean,
  // // Downgrade Long to Number if it's smaller than 53 bits
  // promoteLongs?: boolean,
  // // Deserializing a Binary will return it as a node.js Buffer instance.
  // promoteBuffers?: boolean,
  // Deserializing will promote BSON values to their closest nodejs types.
  promoteValues?: boolean,
  // Allow to specify what fields we wish to return as unserialized raw buf.
  fieldsAsRaw?: any,
  // // Return BSON regular expressions as BSONRegExp instances.
  // bsonRegExp?: boolean,
  // // Return deprecated BSON symbols as BSONSymbol instances or instead (recommended) as a string?
  // bsonSymbol?: boolean,
  // Allows the buf to be larger than the parsed BSON object.
  allowObjectSmallerThanBufferSize?: boolean
  // Offset from which to start deserialization.
  offset?: number,
  // Return raw bson buffer instead of parsing it?
  raw?: boolean
}

/** Deserializes a JavaScript object from a bson buffer. */
export function deserialize(buf: Uint8Array, options: DeserializationOptions = {}, isArray: boolean = false): any {
  if (buf === null) {
    throw new TypeError("The input buffer must not be null.")
  }
  // options = options == null ? {} : options;
  // const index = options && options.index ? options.index : 0;
  // const offset: number = index
  // Read the document size
  options = Object.assign({}, {
    evalFunctions : false,
    cacheFunctions: false,
    cacheFunctionsCrc32: false,
    // promoteLongs: true,
    // promoteBuffers: false,
    promoteValues: true,
   fieldsAsRaw: null,
    // bsonRegExp: false,
    // bsonSymbol: false,
    allowObjectSmallerThanBufferSize: false,
    offset: 0,
    raw: false
  },options)
  const offset: number = options.offset;
  const size: number = buf[offset] | (buf[offset+ 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24);

  if (size < 5) {
    ////////////////
    console.error(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> buf", String(buf), "offset", offset)
    //////////////////
    throw new TypeError(`bson size must be >= 5, is ${size}.`);
  }

  if (options.allowObjectSmallerThanBufferSize && buf.length < size) {
    throw new TypeError(`buf length ${buf.length} must be >= bson size ${size}.`);
  }

  if (!options.allowObjectSmallerThanBufferSize && buf.length !== size) {
    throw new TypeError(`buf length ${buf.length} must === bson size ${size}.`);
  }

  if (size + offset > buf.length) {
    throw new TypeError(
      `bson size ${size} + index ${offset} must be <= buf length ${buf.byteLength}.`
    );
  }

  // Illegal end value
  if (buf[offset + size - 1] !== 0) {
    throw new TypeError("One object, sized correctly, with a spot for an EOO, but the EOO isn't 0x00.");
  }

  // Start deserializtion
  return deserializeObject(buf, offset, options, isArray);
}

// module.exports = deserialize;
