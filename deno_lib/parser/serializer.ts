// 'use strict';

// const Buffer = require('buf').Buffer;
// const writeIEEE754 = require('../float_parser').writeIEEE754;
// const Long = require('../long');
// const Map = require('../map');
// const Binary = require('../binary');
// const CONSTANTS = require('../CONSTANTS');
// const normalizeFunctionString = require('./utils').normalizeFunctionString;
import { Long } from "./../long/mod.ts"
import { Double } from "./../double.ts"
// import { Timestamp } from "./timestamp.ts"
import {ObjectId } from "./../object_id.ts"
import {BSONRegExp} from "./../regexp.ts"
import {BSONSymbol} from "./../symbol.ts"
// import {Int32} from "./int32.ts"
import {Code} from "./../code.ts"
import {Decimal128} from "./../decimal128.ts"
import {MinKey} from "./../min_key.ts"
import {MaxKey} from "./../max_key.ts"
import { DBRef} from "./../db_ref.ts"
import {Binary} from "./../binary.ts"
// TODO: Get rid of below import with DataView
// import { writeIEEE754 } from "./../float_parser.ts";
// import { Long } from "./../long/mod.ts";
// import { Binary} from "./../binary.ts";
import { normalizeFunctionString } from "./utils.ts"
import * as CONSTANTS from "./../constants.ts"

// const encoder: TextEncoder = new TextEncoder();
import { encode } from "./../transcoding.ts"

const null_regex: RegExp = /\x00/;
const ignoreKeys: Set<string> = new Set(['$db', '$ref', '$id', '$clusterTime']);

function serializeString(buf: Uint8Array, key: string, value: string, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_STRING;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  const encodedKey: Uint8Array = encode(key, "utf8");
  buf.set(encodedKey, index);
  // Encode the name
  index = index + encodedKey.byteLength + 1;
  buf[index - 1] = 0;
  // // Write the string
  const encodedValue: Uint8Array = encode(value, "utf8");
/////////////////
// console.error("encodedValue", encodedValue)
//////////////////
  // buf.set(encodedValue, index);
  // index += encodedValue.byteLength
//////////////////
// console.error("encodedValue.byteLength", encodedValue.byteLength)
// console.error("buf.subarray(index, encodedValue.byteLength)", buf.subarray(index, index +encodedValue.byteLength))
//////////////////
  // Write the size of the string to buf
  buf[index + 3] = ((encodedValue.byteLength + 1) >> 24) & 0xff;
  buf[index + 2] = ((encodedValue.byteLength + 1) >> 16) & 0xff;
  buf[index + 1] = ((encodedValue.byteLength + 1) >> 8) & 0xff;
  buf[index] = (encodedValue.byteLength + 1) & 0xff;
  index += 4
  // Write the string
  buf.set(encodedValue, index);
  // index += encodedValue.byteLength
  // Update index
  index = index /*+ 4*/ + encodedValue.byteLength;
  buf[index++] = 0;
  return index;
}

function serializeNumber(buf: Uint8Array, key: string, value: number, index: number/*, isArray: boolean*/): number {
  if (
    Math.floor(value) === value &&
    value >= CONSTANTS.JS_INT_MIN &&
    value <= CONSTANTS.JS_INT_MAX
  ) {
    // We have an integer value
    // If the value fits in 32 bits encode as int, if it fits in a double
    // encode it as a double, otherwise long
    if (value >= CONSTANTS.BSON_INT32_MIN && value <= CONSTANTS.BSON_INT32_MAX) {
      buf[index++] = CONSTANTS.BSON_DATA_INT;
      // Number of written bytes
      // const numberOfWrittenBytes = !isArray
      //   ? buf.write(key, index, 'utf8')
      //   : buf.write(key, index, 'ascii');
        // index = index + numberOfWrittenBytes;
            // Encode the name
      const encodedKey: Uint8Array = encode(key, "utf8");
      buf.set(encodedKey, index);
      index +=  encodedKey.byteLength;
      buf[index++] = 0;
      // Write the int value
      buf[index++] = value & 0xff;
      buf[index++] = (value >> 8) & 0xff;
      buf[index++] = (value >> 16) & 0xff;
      buf[index++] = (value >> 24) & 0xff;
    } else if (value >= CONSTANTS.JS_INT_MIN && value <= CONSTANTS.JS_INT_MAX) {
      buf[index++] = CONSTANTS.BSON_DATA_NUMBER;
      // Number of written bytes
      // const numberOfWrittenBytes = !isArray
      //   ? buf.write(key, index, 'utf8')
      //   : buf.write(key, index, 'ascii');
        // index = index + numberOfWrittenBytes;
            // Encode the name
      const encodedKey: Uint8Array = encode(key, "utf8");
      buf.set(encodedKey, index);
      index +=  encodedKey.byteLength;
      buf[index++] = 0;
      // Write float
      // writeIEEE754(buf, value, index, 'little', 52, 8);
      new DataView(buf.buffer).setFloat64(index, value, true);
      // Ajust index
      index = index + 8;
    } else {
      buf[index++] = CONSTANTS.BSON_DATA_LONG;
      // Number of written bytes
      // const numberOfWrittenBytes = !isArray
      //   ? buf.write(key, index, 'utf8')
      //   : buf.write(key, index, 'ascii');
        // index = index + numberOfWrittenBytes;
            // Encode the name
      const encodedKey: Uint8Array = encode(key, "utf8");
      buf.set(encodedKey, index);
      index+=  encodedKey.byteLength;
      buf[index++] = 0;
      const longVal: Long = Long.fromNumber(value);
const lowBits: number = longVal.getLowBits();
const highBits: number = longVal.getHighBits();
// Encode low bits
buf[index++] = lowBits & 0xff;
buf[index++] = (lowBits >> 8) & 0xff;
buf[index++] = (lowBits >> 16) & 0xff;
buf[index++] = (lowBits >> 24) & 0xff;
// Encode high bits
buf[index++] = highBits & 0xff;
buf[index++] = (highBits >> 8) & 0xff;
buf[index++] = (highBits >> 16) & 0xff;
buf[index++] = (highBits >> 24) & 0xff;
    }
  } else {
    buf[index++] = CONSTANTS.BSON_DATA_NUMBER;
    // Number of written bytes
    // const numberOfWrittenBytes = !isArray
    //   ? buf.write(key, index, 'utf8')
    //   : buf.write(key, index, 'ascii');
    // index = index + numberOfWrittenBytes;
        // Encode the name
    const encodedKey: Uint8Array = encode(key, "utf8");
    buf.set(encodedKey, index);
    index +=  encodedKey.byteLength;
    buf[index++] = 0;
    // Write float
    // writeIEEE754(buf, value, index, 'little', 52, 8);
    new DataView(buf.buffer).setFloat64(index, value, true);
    // Ajust index
    index = index + 8;
  }

  return index;
}

function serializeNull(buf: Uint8Array, key: string, value: null, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_NULL;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
  buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  return index;
}

function serializeBoolean(buf: Uint8Array, key: string, value: boolean, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_BOOLEAN;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
  buf.set(encodedKey, index);
  index +=  encodedKey.byteLength;
  buf[index++] = 0;
  // Encode the boolean value
  buf[index++] = value ? 1 : 0;
  return index;
}

function serializeDate(buf: Uint8Array, key: string, value: Date, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_DATE;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
    const encodedKey: Uint8Array = encode(key, "utf8");
  buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write the date
  const dateInMilis: Long = Long.fromNumber(value.getTime());
  const lowBits: number = dateInMilis.getLowBits();
  const highBits: number = dateInMilis.getHighBits();
  // Encode low bits
  buf[index++] = lowBits & 0xff;
  buf[index++] = (lowBits >> 8) & 0xff;
  buf[index++] = (lowBits >> 16) & 0xff;
  buf[index++] = (lowBits >> 24) & 0xff;
  // Encode high bits
  buf[index++] = highBits & 0xff;
  buf[index++] = (highBits >> 8) & 0xff;
  buf[index++] = (highBits >> 16) & 0xff;
  buf[index++] = (highBits >> 24) & 0xff;
  return index;
}

function serializeRegExp(buf: Uint8Array, key: string, value: RegExp, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_REGEXP;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
    // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  if (null_regex.test(value.source)) {
    throw Error('value ' + value.source + ' must not contain null bytes');
  }
  // Encode the value
  const encodedValue: Uint8Array = encode(value.source, "utf8");
buf.set(encodedValue, index);
  index += encodedValue.byteLength;
  buf[index++] = 0x00;
  // Write the parameters
  if (value.ignoreCase) {
    buf[index++] = 0x69; // i
  }
  if (value.global) {
    buf[index++] = 0x73; // s
  }
  if (value.multiline) {
    buf[index++] = 0x6d; // m
  }
  // Add ending zero
  buf[index++] = 0x00;
  return index;
}

function serializeBSONRegExp(buf: Uint8Array, key: string, value: BSONRegExp, index: number/*, isArray: boolean*/): number  {
  buf[index++] = CONSTANTS.BSON_DATA_REGEXP;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  if (null_regex.test(value.pattern)) {
    throw Error('value ' + value.pattern + ' must not contain null bytes');
  }
  // Encode the value
  const encodedValue: Uint8Array = encode(value.pattern, "utf8");
buf.set(encodedValue, index);
  index += encodedValue.byteLength;
  buf[index++] = 0x00;
  // Write the options
  const encodedOptions: Uint8Array = encode(value.options
    .split('')
    .sort()
    .join(''), "utf8")
  buf.set(encodedOptions, index)
  index += encodedOptions.byteLength
  // Add ending zero
  buf[index++] = 0x00;
  return index;
}

function serializeMinMax(buf: Uint8Array, key: string, value: MinKey | MaxKey, index: number/*, isArray: boolean*/): number  {
  if (value === null) {
    buf[index++] = CONSTANTS.BSON_DATA_NULL;
  } else if (value._bsontype === 'MinKey') {
    buf[index++] = CONSTANTS.BSON_DATA_MIN_KEY;
  } else {
    buf[index++] = CONSTANTS.BSON_DATA_MAX_KEY;
  }
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  return index;
}

function serializeObjectId(buf: Uint8Array, key: string, value: ObjectId, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_OID;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
    // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write the objectId into the shared buf
  if (typeof value.id === 'string') {
    // buf.write(value.id, index, 'binary');
    const encodedId: Uint8Array = encode(value.id);
    if (encodedId.byteLength !== 12) {
throw new TypeError('object [' + JSON.stringify(value) + '] is not a valid ObjectId');
    }
  buf.set(encodedId, index);
} else if (value.id instanceof Uint8Array && value.id.byteLength === 12) {
    buf.set(value.id, index);
  } else {
    throw new TypeError('object [' + JSON.stringify(value) + '] is not a valid ObjectId');
  }
  // Ajust index
  return index + 12;
}

function serializeBuffer(buf: Uint8Array, key: string, value: Uint8Array, index: number/*, isArray: boolean*/): number  {
  buf[index++] = CONSTANTS.BSON_DATA_BINARY;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write the size of the string to buf
  buf[index++] = value.byteLength & 0xff;
  buf[index++] = (value.byteLength >> 8) & 0xff;
  buf[index++] = (value.byteLength >> 16) & 0xff;
  buf[index++] = (value.byteLength >> 24) & 0xff;
  // Write the default subtype
  buf[index++] = CONSTANTS.BSON_BINARY_SUBTYPE_DEFAULT;
  // Copy the content from the binary field to the buf
  buf.set(value, index)
  // Adjust the index
  index += value.byteLength;
  return index;
}

function serializeObject(
  buf: Uint8Array,
  key: string,
  value: any,
  index: number,
  checkKeys: boolean,
  depth: number,
  serializeFunctions: boolean,
  ignoreUndefined: boolean,
  isArray: boolean,
  path: any
) {
  for (let i: number = 0; i < path.length; i++) {
    if (path[i] === value) {
      throw new Error('cyclic dependency detected');
    }
  }

  // Push value to stack
  path.push(value);
  // Write the type
  buf[index++] = Array.isArray(value) ? CONSTANTS.BSON_DATA_ARRAY : CONSTANTS.BSON_DATA_OBJECT;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  const endIndex = serializeInto(
    buf,
    value,
    checkKeys,
    index,
    depth + 1,
    serializeFunctions,
    ignoreUndefined,
    path
  );
  // Pop stack
  path.pop();
  return endIndex;
}

function serializeDecimal128(buf: Uint8Array, key: string, value: Decimal128, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_DECIMAL128;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
    // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write the data from the value
  buf.set(value.bytes.subarray(0,16), index)
  return index + 16;
}

function serializeLong(buf: Uint8Array, key: string, value: Long, index: number/*, isArray: boolean*/): number {
  // Indicate Long type
  buf[index++] = Long.isLong(value) ? CONSTANTS.BSON_DATA_LONG : CONSTANTS.BSON_DATA_TIMESTAMP;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
 //   index = index + numberOfWrittenBytes;
    // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write the date
  const lowBits = value.getLowBits();
  const highBits = value.getHighBits();
  // Encode low bits
  buf[index++] = lowBits & 0xff;
  buf[index++] = (lowBits >> 8) & 0xff;
  buf[index++] = (lowBits >> 16) & 0xff;
  buf[index++] = (lowBits >> 24) & 0xff;
  // Encode high bits
  buf[index++] = highBits & 0xff;
  buf[index++] = (highBits >> 8) & 0xff;
  buf[index++] = (highBits >> 16) & 0xff;
  buf[index++] = (highBits >> 24) & 0xff;
  return index;
}

function serializeInt32(buf: Uint8Array, key: string, value: number, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_INT;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  //   index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write the int value
  buf[index++] = value & 0xff;
  buf[index++] = (value >> 8) & 0xff;
  buf[index++] = (value >> 16) & 0xff;
  buf[index++] = (value >> 24) & 0xff;
  return index;
}

function serializeDouble(buf: Uint8Array, key: string, value: Double, index: number/*, isArray: boolean*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_NUMBER;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
    // : buf.write(key, index, 'ascii');
    //  index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write float
  // writeIEEE754(buf, value.value, index, 'little', 52, 8);
  new DataView(buf.buffer).setFloat64(index, value.value, true);
  // Adjust index
  index = index + 8;
  return index;
}

function serializeFunction(buf: Uint8Array, key: string, value: Function, index:number/*, checkKeys: boolean, depth: number, isArray*/): number {
  buf[index++] = CONSTANTS.BSON_DATA_CODE;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  //   index = index + numberOfWrittenBytes;
    // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Function string
  const encodedFunction: Uint8Array = encode(normalizeFunctionString(value), "utf8");
  // Write the string
  buf.set(encodedFunction, index + 4)
  // const size = buf.write(functionString, index + 4, 'utf8') + 1;
  const size: number = encodedFunction.byteLength + 1;
  // Write the size of the string to buf
  buf[index] = size & 0xff;
  buf[index + 1] = (size >> 8) & 0xff;
  buf[index + 2] = (size >> 16) & 0xff;
  buf[index + 3] = (size >> 24) & 0xff;
  // Update index
  index = index + 4 + size - 1;
  buf[index++] = 0;
  return index;
}

function serializeCode(
  buf: Uint8Array,
  key: string,
  value: Code,
  index: number,
  checkKeys: boolean,
  depth: number,
  serializeFunctions: boolean,
  ignoreUndefined: boolean,
  isArray: boolean
): number {
  if (value.scope && typeof value.scope === 'object') {
    // Write the type
    buf[index++] = CONSTANTS.BSON_DATA_CODE_W_SCOPE;
    // // Number of written bytes
    // const numberOfWrittenBytes = !isArray
    //   ? buf.write(key, index, 'utf8')
    //   : buf.write(key, index, 'ascii');
    // index = index + numberOfWrittenBytes;


    // Encode the name
    const encodedKey: Uint8Array = encode(key, "utf8");
    buf.set(encodedKey, index);
    index += encodedKey.byteLength;
    buf[index++] = 0;

    // Starting index
    let startIndex: number = index;

    // Serialize the function
    // Get the function string
    // const functionString: string = typeof value.code === 'string' ? value.code : value.code.toString();
    const encodedFunction: Uint8Array = encode(normalizeFunctionString(value.code), "utf8")
    // Index adjustment
    index += 4;
    // Write string into buf
    // const codeSize = buf.write(functionString, index + 4, 'utf8') + 1;
        buf.set(encodedFunction, index + 4)
    const codeSize: number = encodedFunction.byteLength +1
    // Write the size of the string to buf
    buf[index] = codeSize & 0xff;
    buf[index + 1] = (codeSize >> 8) & 0xff;
    buf[index + 2] = (codeSize >> 16) & 0xff;
    buf[index + 3] = (codeSize >> 24) & 0xff;
    // Write end 0
    buf[index + 4 + codeSize - 1] = 0;
    // Write the
    index += codeSize + 4;

    // Serialize the scope value
    const endIndex: number = serializeInto(
      buf,
      value.scope,
      checkKeys,
      index,
      depth + 1,
      serializeFunctions,
      ignoreUndefined,
      null
    );
    index = endIndex - 1;

    // Writ the total
    const totalSize: number = endIndex - startIndex;

    // Write the total size of the object
    buf[startIndex++] = totalSize & 0xff;
    buf[startIndex++] = (totalSize >> 8) & 0xff;
    buf[startIndex++] = (totalSize >> 16) & 0xff;
    buf[startIndex++] = (totalSize >> 24) & 0xff;
    // Write trailing zero
    buf[index++] = 0;
  } else {
    buf[index++] = CONSTANTS.BSON_DATA_CODE;
    // Number of written bytes
    // const numberOfWrittenBytes = !isArray
    //   ? buf.write(key, index, 'utf8')
    //   : buf.write(key, index, 'ascii');
    // index = index + numberOfWrittenBytes;
    // Encode the name
    const encodedKey: Uint8Array = encode(key, "utf8");
    buf.set(encodedKey, index);
    index += encodedKey.byteLength;
    buf[index++] = 0;
    // // Function string
    // const functionString = value.code.toString();
    // // Write the string
    // const size = buf.write(functionString, index + 4, 'utf8') + 1;
    const encodedFunction: Uint8Array = encode(normalizeFunctionString(value.code), "utf8")
    // Index adjustment
    index += 4;
    // Write string into buf
    // const codeSize = buf.write(functionString, index + 4, 'utf8') + 1;
        buf.set(encodedFunction, index + 4)
    const size: number = encodedFunction.byteLength +1
    // Write the size of the string to buf
    buf[index] = size & 0xff;
    buf[index + 1] = (size >> 8) & 0xff;
    buf[index + 2] = (size >> 16) & 0xff;
    buf[index + 3] = (size >> 24) & 0xff;
    // Update index
    index += 4 + size - 1;
    buf[index++] = 0;
  }

  return index;
}

function serializeBinary(buf: Uint8Array, key: string, value: Binary, index: number /*, isArray*/): number {
  // Write the type
  buf[index++] = CONSTANTS.BSON_DATA_BINARY;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
  // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
  buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Extract the buf
  const data: Uint8Array = value.value(true) as Uint8Array;
  // Calculate size
  let size: number = value.length;
  // Add the deprecated 02 type 4 bytes of size to total
  if (value.subType === Binary.SUBTYPE_BYTE_ARRAY) {
    size += 4;
  }
  // Write the size of the string to buf
  buf[index++] = size & 0xff;
  buf[index++] = (size >> 8) & 0xff;
  buf[index++] = (size >> 16) & 0xff;
  buf[index++] = (size >> 24) & 0xff;
  // Write the subtype to the buf
  buf[index++] = value.subType;

  // If we have binary type 2 the 4 first bytes are the size
  if (value.subType === Binary.SUBTYPE_BYTE_ARRAY) {
    size -= 4;
    buf[index++] = size & 0xff;
    buf[index++] = (size >> 8) & 0xff;
    buf[index++] = (size >> 16) & 0xff;
    buf[index++] = (size >> 24) & 0xff;
  }

  // Write the data to the object
  buf.set(data, index);
  // Adjust the index
  index += value.length;
  return index;
}

function serializeSymbol(buf: Uint8Array, key: string, value: BSONSymbol, index: number/*, isArray*/): number {
  // Write the type
  buf[index++] = CONSTANTS.BSON_DATA_SYMBOL;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  // index = index + numberOfWrittenBytes;
    // Encode the name
  const encodedKey: Uint8Array = encode(key, "utf8");
  buf.set(encodedKey, index);
  index += encodedKey.byteLength;
  buf[index++] = 0;
  // Write the string
  // const size = buf.write(value.value, index + 4, 'utf8') + 1;
  const encodedSymbol: Uint8Array = encode(value.value, "utf8");
  buf.set(encodedSymbol, index + 4)
  const size: number = encodedSymbol.byteLength + 1
  // Write the size of the string to buf
  buf[index] = size & 0xff;
  buf[index + 1] = (size >> 8) & 0xff;
  buf[index + 2] = (size >> 16) & 0xff;
  buf[index + 3] = (size >> 24) & 0xff;
  // Update index
  index += 4 + size - 1;
  buf[index++] = 0;
  return index;
}

function serializeDBRef(buf: Uint8Array, key: string, value: DBRef, index: number, depth: number, serializeFunctions: boolean/*, isArray: boolean*/): number {
  // Write the type
  buf[index++] = CONSTANTS.BSON_DATA_OBJECT;
  // Number of written bytes
  // const numberOfWrittenBytes = !isArray
  //   ? buf.write(key, index, 'utf8')
  //   : buf.write(key, index, 'ascii');
  //  index = index + numberOfWrittenBytes;
  // Encode the name
const encodedKey: Uint8Array = encode(key, "utf8");
buf.set(encodedKey, index);
index += encodedKey.byteLength;
  buf[index++] = 0;

  let startIndex: number = index;
  let output: { [key: string]: any} = {
    $ref: value.collection || value.namespace, // "namespace" was what library 1.x called "collection"
    $id: value.oid
  };

  if (value.db) {
    output.$db = value.db;
  }

  /*output = */Object.assign(output, value.fields);
  const endIndex: number = serializeInto(buf, output, false, index, depth + 1, serializeFunctions, false, null);

  // Calculate object size
  const size = endIndex - startIndex;
  // Write the size
  buf[startIndex++] = size & 0xff;
  buf[startIndex++] = (size >> 8) & 0xff;
  buf[startIndex++] = (size >> 16) & 0xff;
  buf[startIndex++] = (size >> 24) & 0xff;
  // Set index
  return endIndex;
}

export function serializeInto(
  buf: Uint8Array,
  object: { [key:string]: any},
  checkKeys: boolean,
  startingIndex: number,
  depth: number,
  serializeFunctions: boolean,
  ignoreUndefined: boolean,
  path: { [key:string]: any}[]
): number {
  startingIndex = startingIndex || 0;
  path = path || [];

  // Push the object to the path
  path.push(object);

  // Start place to serialize into
  let index: number = startingIndex + 4;

  // Special case isArray
  if (Array.isArray(object)) {
    // Get object keys
    for (let i: number = 0; i < object.length; i++) {
      let key: string = '' + i;
      let value: any = object[i];

      // Is there an override value
      if (value && value.toBSON) {
        if (typeof value.toBSON !== 'function') {throw new TypeError('toBSON is not a function');}
        value = value.toBSON();
      }

      const type:string = typeof value;
      const bsontype:string = value._bsontype;
      if (type === 'string') {
        index = serializeString(buf, key, value, index/*, true*/);
      } else if (type === 'number') {
        index = serializeNumber(buf, key, value, index/*, true*/);
      } else if (type === 'boolean') {
        index = serializeBoolean(buf, key, value, index/*, true*/);
      } else if (value instanceof Date/* || isDate(value)*/) {
        index = serializeDate(buf, key, value, index/*, true*/);
      } else if (value === undefined) {
        index = serializeNull(buf, key, value, index/*, true*/);
      } else if (value === null) {
        index = serializeNull(buf, key, value, index/*, true*/);
      } else if (bsontype === 'ObjectId' || bsontype === 'ObjectID') {
        index = serializeObjectId(buf, key, value, index/*, true*/);
      } else if (/*Buffer.isBuffer(value)*/ value instanceof Uint8Array) {
        index = serializeBuffer(buf, key, value, index/*, true*/);
      } else if (value instanceof RegExp/* || isRegExp(value)*/) {
        index = serializeRegExp(buf, key, value, index/*, true*/);
      } else if (type === 'object' && !bsontype) {
        index = serializeObject(
          buf,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          true,
          path
        );
      } else if (type === 'object' && bsontype === 'Decimal128') {
        index = serializeDecimal128(buf, key, value, index/*, true*/);
      } else if (bsontype === 'Long' || bsontype === 'Timestamp') {
        index = serializeLong(buf, key, value, index/*, true*/);
      } else if (bsontype === 'Double') {
        index = serializeDouble(buf, key, value, index/*, true*/);
      } else if (typeof value === 'function' && serializeFunctions) {
        index = serializeFunction(
          buf,
          key,
          value,
          index
          /*,checkKeys,
          depth,
          serializeFunctions,
          true*/
        );
      } else if (bsontype === 'Code') {
        index = serializeCode(
          buf,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          true
        );
      } else if (bsontype === 'Binary') {
        index = serializeBinary(buf, key, value, index/*, true*/);
      } else if (bsontype === 'Symbol') {
        index = serializeSymbol(buf, key, value, index/*, true*/);
      } else if (bsontype === 'DBRef') {
        index = serializeDBRef(buf, key, value, index, depth, serializeFunctions/*, true*/);
      } else if (bsontype === 'BSONRegExp') {
        index = serializeBSONRegExp(buf, key, value, index/*, true*/);
      } else if (bsontype === 'Int32') {
        index = serializeInt32(buf, key, value, index/*, true*/);
      } else if (bsontype === 'MinKey' || bsontype === 'MaxKey') {
        index = serializeMinMax(buf, key, value, index/*, true*/);
      } else if (bsontype !== undefined) {
        throw new TypeError(`Unrecognized or invalid _bsontype: ${bsontype}.`);
      }
    }
  } else if (object instanceof Map) {
    const iterator: any = object.entries();
    let done: boolean = false;

    while (!done) {
      // Unpack the next entry
      const entry: any = iterator.next();
      done = entry.done;
      // Are we done, then skip and terminate
      if (done) {continue;}

      // Get the entry values
      const key: any = entry.value[0];
      const value: any = entry.value[1];

      // Check the type of the value
      const type: string = typeof value;
      const bsontype:string = value._bsontype;
      // Check the key and throw error if it's illegal
      if (typeof key === 'string' && !ignoreKeys.has(key)) {
        // if (key.match(null_regex) != null) {
        if (null_regex.test(key)) {
          // The BSON spec doesn't allow keys with null bytes because keys are
          // null-terminated.
          throw Error(`Key ${key} must not contain null bytes.`);
        }

        if (checkKeys) {
          if ('$' === key[0]) {
            throw Error(`Key ${key} must not start with '$'.`);
          } else if (~key.indexOf('.')) {
            throw Error(`Key ${key}  must not contain '.'.`);
          }
        }
      }

      if (type === 'string') {
        index = serializeString(buf, key, value, index);
      } else if (type === 'number') {
        index = serializeNumber(buf, key, value, index);
      } else if (type === 'boolean') {
        index = serializeBoolean(buf, key, value, index);
      } else if (value instanceof Date/* || isDate(value)*/) {
        index = serializeDate(buf, key, value, index);
      } else if (value === null || (value === undefined && ignoreUndefined === false)) {
        index = serializeNull(buf, key, value, index);
      } else if (bsontype === 'ObjectId' || bsontype === 'ObjectID') {
        index = serializeObjectId(buf, key, value, index);
      } else if (/*Buffer.isBuffer(value)*/ value instanceof Uint8Array) {
        index = serializeBuffer(buf, key, value, index);
      } else if (value instanceof RegExp/* || isRegExp(value)*/) {
        index = serializeRegExp(buf, key, value, index);
      } else if (type === 'object' && !bsontype) {
        index = serializeObject(
          buf,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false,
          path
        );
      } else if (type === 'object' && bsontype === 'Decimal128') {
        index = serializeDecimal128(buf, key, value, index);
      } else if (bsontype === 'Long' || bsontype === 'Timestamp') {
        index = serializeLong(buf, key, value, index);
      } else if (bsontype === 'Double') {
        index = serializeDouble(buf, key, value, index);
      } else if (bsontype === 'Code') {
        index = serializeCode(
          buf,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false
        );
      } else if (typeof value === 'function' && serializeFunctions) {
        index = serializeFunction(buf, key, value, index/*, checkKeys, depth, serializeFunctions*/);
      } else if (bsontype === 'Binary') {
        index = serializeBinary(buf, key, value, index);
      } else if (bsontype === 'Symbol') {
        index = serializeSymbol(buf, key, value, index);
      } else if (bsontype === 'DBRef') {
        index = serializeDBRef(buf, key, value, index, depth, serializeFunctions);
      } else if (bsontype === 'BSONRegExp') {
        index = serializeBSONRegExp(buf, key, value, index);
      } else if (bsontype === 'Int32') {
        index = serializeInt32(buf, key, value, index);
      } else if (bsontype === 'MinKey' || bsontype === 'MaxKey') {
        index = serializeMinMax(buf, key, value, index);
      } else if (bsontype !== undefined) {
        throw new TypeError(`Unrecognized or invalid _bsontype: ${bsontype}.`);
      }
    }
  } else {
    // Did we provide a custom serialization method
    if (object.toBSON) {
      if (typeof object.toBSON !== 'function') {throw new TypeError('toBSON is not a function.');}
      object = object.toBSON();
      if (object && typeof object !== 'object')
        throw new TypeError('The toBSON method did not return an object.');
    }

    // Iterate over all the keys
    for (let key in object) {
      let value: any = object[key];
      // Is there an override value
      if (value && value.toBSON) {
        if (typeof value.toBSON !== 'function') {throw new TypeError('toBSON is not a function.');}
        value = value.toBSON();
      }

      // Check the type of the value
      const type = typeof value;
  const bsontype:string = value._bsontype;

  ////////////////////
  console.error("key", key, "value", value, "type", type, "bsontype", bsontype)
  ////////////////////

      // Check the key and throw error if it's illegal
      if (typeof key === 'string' && !ignoreKeys.has(key)) {
        // if (key.match(null_regex) != null) {
        if (null_regex.test(key))  {
          // The BSON spec doesn't allow keys with null bytes because keys are
          // null-terminated.
          throw new TypeError(`Key ${key}  must not contain null bytes.`);
        }

        if (checkKeys) {
          if ('$' === key[0]) {
            throw new TypeError(`Key ${key} must not start with '$'.`);
          } else if (~key.indexOf('.')) {
            throw new TypeError(`Key ${key} must not contain '.'.`);
          }
        }
      }

      if (type === 'string') {
        index = serializeString(buf, key, value, index);
      } else if (type === 'number') {
        index = serializeNumber(buf, key, value, index);
      } else if (type === 'boolean') {
        index = serializeBoolean(buf, key, value, index);
      } else if (value instanceof Date/* || isDate(value)*/) {
        index = serializeDate(buf, key, value, index);
      } else if (value === undefined) {
        if (ignoreUndefined === false) {index = serializeNull(buf, key, value, index);}
      } else if (value === null) {
        index = serializeNull(buf, key, value, index);
      } else if (bsontype === 'ObjectId' || bsontype === 'ObjectID') {
        index = serializeObjectId(buf, key, value, index);
      } else if (value instanceof Uint8Array) {
        index = serializeBuffer(buf, key, value, index);
      } else if (value instanceof RegExp/* || isRegExp(value)*/) {
        index = serializeRegExp(buf, key, value, index);
      } else if (type === 'object' && !bsontype) {
        index = serializeObject(
          buf,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false,
          path
        );
      } else if (type === 'object' && bsontype === 'Decimal128') {
        index = serializeDecimal128(buf, key, value, index);
      } else if (bsontype === 'Long' || bsontype === 'Timestamp') {
        index = serializeLong(buf, key, value, index);
      } else if (bsontype === 'Double') {
        index = serializeDouble(buf, key, value, index);
      } else if (bsontype === 'Code') {
        index = serializeCode(
          buf,
          key,
          value,
          index,
          checkKeys,
          depth,
          serializeFunctions,
          ignoreUndefined,
          false
        );
      } else if (typeof value === 'function' && serializeFunctions) {
        index = serializeFunction(buf, key, value, index/*, checkKeys, depth, serializeFunctions*/);
      } else if (bsontype === 'Binary') {
        index = serializeBinary(buf, key, value, index);
      } else if (bsontype === 'Symbol') {
        index = serializeSymbol(buf, key, value, index);
      } else if (bsontype === 'DBRef') {
        index = serializeDBRef(buf, key, value, index, depth, serializeFunctions);
      } else if (bsontype === 'BSONRegExp') {
        index = serializeBSONRegExp(buf, key, value, index);
      } else if (bsontype === 'Int32') {
        index = serializeInt32(buf, key, value, index);
      } else if (bsontype === 'MinKey' || bsontype === 'MaxKey') {
        index = serializeMinMax(buf, key, value, index);
      } else if (bsontype !== undefined) {
        throw new TypeError(`Unrecognized or invalid _bsontype: ${bsontype}.`);
      }
    }
  }

  // Remove the path
  path.pop();

  // Final padding byte for object
  buf[index++] = 0;

  // Final size
  const size: number = index - startingIndex;
  // Write the size of the object
  buf[startingIndex++] = size & 0xff;
  buf[startingIndex++] = (size >> 8) & 0xff;
  buf[startingIndex++] = (size >> 16) & 0xff;
  buf[startingIndex++] = (size >> 24) & 0xff;
  return index;
}

// function bigintToLittleEndianBytes( b: bigint, out: Uint8Array ): void {
//   for (let i: number = 0; i < out.length; ++i) {
//     out[i] = Number(b & 255n);
//     b >>= 8n;
//   }
// }

// module.exports = serializeInto;
