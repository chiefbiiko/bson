import { Binary } from "./../binary.ts";
import { normalizedFunctionString, utf8ByteLength } from "./utils.ts";
import {
  BSON_INT32_MIN,
  BSON_INT32_MAX,
  JS_INT_MIN,
  JS_INT_MAX
} from "./../constants.ts";

export function calculateObjectSize(
  object: any,
  serializeFunctions: boolean,
  ignoreUndefined: boolean
): number {
  let totalLength: number = 4 + 1;
  if (Array.isArray(object)) {
    for (let i: number = 0; i < object.length; i++) {
      totalLength += calculateElement(
        i.toString(),
        object[i],
        serializeFunctions,
        true,
        ignoreUndefined
      );
    }
  } else {
    // If we have toBSON defined, override the current object
    if (object.toBSON) {
      object = object.toBSON();
    }
    // Calculate size
    for (let key in object) {
      totalLength += calculateElement(
        key,
        object[key],
        serializeFunctions,
        false,
        ignoreUndefined
      );
    }
  }
  return totalLength;
}

function calculateElement(
  name: string,
  value: any,
  serializeFunctions: boolean,
  isArray: boolean,
  ignoreUndefined: boolean
): number {
  // If we have toBSON defined, override the current object
  if (value && value.toBSON) {
    value = value.toBSON();
  }

  switch (typeof value) {
    case "string":
      return 1 + utf8ByteLength(name) + 1 + 4 + utf8ByteLength(value) + 1;
    case "number":
      if (
        Math.floor(value) === value &&
        value >= JS_INT_MIN &&
        value <= JS_INT_MAX
      ) {
        if (value >= BSON_INT32_MIN && value <= BSON_INT32_MAX) {
          // 32 bit
          return (name !== null ? utf8ByteLength(name) + 1 : 0) + (4 + 1);
        } else {
          return (name !== null ? utf8ByteLength(name) + 1 : 0) + (8 + 1);
        }
      } else {
        // 64 bit
        return (name !== null ? utf8ByteLength(name) + 1 : 0) + (8 + 1);
      }
    case "undefined":
      if (isArray || !ignoreUndefined) {
        return (name !== null ? utf8ByteLength(name) + 1 : 0) + 1;
      } else {
        return 0;
      }
    case "boolean":
      return (name !== null ? utf8ByteLength(name) + 1 : 0) + (1 + 1);
    case "object":
      if (
        value == null ||
        value["_bsontype"] === "MinKey" ||
        value["_bsontype"] === "MaxKey"
      ) {
        return (name !== null ? utf8ByteLength(name) + 1 : 0) + 1;
      } else if (
        value["_bsontype"] === "ObjectId" ||
        value["_bsontype"] === "ObjectID"
      ) {
        return (name !== null ? utf8ByteLength(name) + 1 : 0) + (12 + 1);
      } else if (value instanceof Date) {
        return (name !== null ? utf8ByteLength(name) + 1 : 0) + (8 + 1);
      } else if (value instanceof Uint8Array) {
        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          (1 + 4 + 1) +
          value.length
        );
      } else if (
        value["_bsontype"] === "Long" ||
        value["_bsontype"] === "Double" ||
        value["_bsontype"] === "Timestamp"
      ) {
        return (name !== null ? utf8ByteLength(name) + 1 : 0) + (8 + 1);
      } else if (value["_bsontype"] === "Decimal128") {
        return (name !== null ? utf8ByteLength(name) + 1 : 0) + (16 + 1);
      } else if (value["_bsontype"] === "Code") {
        // Calculate size depending on the availability of a scope
        if (value.scope != null && Object.keys(value.scope).length > 0) {
          return (
            (name !== null ? utf8ByteLength(name) + 1 : 0) +
            1 +
            4 +
            4 +
            utf8ByteLength(value.code.toString()) +
            1 +
            calculateObjectSize(
              value.scope,
              serializeFunctions,
              ignoreUndefined
            )
          );
        } else {
          return (
            (name !== null ? utf8ByteLength(name) + 1 : 0) +
            1 +
            4 +
            utf8ByteLength(value.code.toString()) +
            1
          );
        }
      } else if (value["_bsontype"] === "Binary") {
        // Check what kind of subtype we have
        if (value.sub_type === Binary.SUBTYPE_BYTE_ARRAY) {
          return (
            (name !== null ? utf8ByteLength(name) + 1 : 0) +
            (value.position + 1 + 4 + 1 + 4)
          );
        } else {
          return (
            (name !== null ? utf8ByteLength(name) + 1 : 0) +
            (value.position + 1 + 4 + 1)
          );
        }
      } else if (value["_bsontype"] === "Symbol") {
        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          utf8ByteLength(value.value) +
          4 +
          1 +
          1
        );
      } else if (value["_bsontype"] === "DBRef") {
        // Set up correct object for serialization
        const ordered_values = Object.assign(
          {
            $ref: value.collection,
            $id: value.oid
          },
          value.fields
        );

        // Add db reference if it exists
        if (value.db != null) {
          ordered_values["$db"] = value.db;
        }

        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          1 +
          calculateObjectSize(
            ordered_values,
            serializeFunctions,
            ignoreUndefined
          )
        );
      } else if (value instanceof RegExp) {
        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          1 +
          utf8ByteLength(value.source) +
          1 +
          (value.global ? 1 : 0) +
          (value.ignoreCase ? 1 : 0) +
          (value.multiline ? 1 : 0) +
          1
        );
      } else if (value["_bsontype"] === "BSONRegExp") {
        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          1 +
          utf8ByteLength(value.pattern) +
          1 +
          utf8ByteLength(value.options) +
          1
        );
      } else {
        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          calculateObjectSize(value, serializeFunctions, ignoreUndefined) +
          1
        );
      }
    case "function":
      if (
        serializeFunctions &&
        value.scope != null &&
        Object.keys(value.scope).length > 0
      ) {
        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          1 +
          4 +
          4 +
          utf8ByteLength(normalizedFunctionString(value)) +
          1 +
          calculateObjectSize(value.scope, serializeFunctions, ignoreUndefined)
        );
      } else if (serializeFunctions) {
        return (
          (name !== null ? utf8ByteLength(name) + 1 : 0) +
          1 +
          4 +
          utf8ByteLength(normalizedFunctionString(value)) +
          1
        );
      }
  }

  return 0;
}
