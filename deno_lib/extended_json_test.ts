// 'use strict';
//
// const assert = require('assert');
// const expect = require('chai').expect;
// const BSON = require('../../lib/bson');
// const EJSON = BSON.EJSON;

// BSON types
// const Binary = BSON.Binary;
// const Code = BSON.Code;
// const DBRef = BSON.DBRef;
// const Decimal128 = BSON.Decimal128;
// const Double = BSON.Double;
// const Int32 = BSON.Int32;
// const Long = BSON.Long;
// const MaxKey = BSON.MaxKey;
// const MinKey = BSON.MinKey;
// const ObjectID = BSON.ObjectID;
// const ObjectId = BSON.ObjectId;
// const BSONRegExp = BSON.BSONRegExp;
// const BSONSymbol = BSON.BSONSymbol;
// const Timestamp = BSON.Timestamp;
import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assert, assertEquals } from "https://deno.land/x/testing/asserts.ts";
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
import { EJSON } from "./extended_json.ts"

// import { encode } from "./transcoding.ts";

// // Several tests in this file can test interop between current library versions and library version 1.1.0, because
// // between 1.1.0 and 4.0.0 there was a significant rewrite. To minimize maintenance issues of a hard dependency on
// // the old version, these interop tests are inactive by default. To activate, edit the test-node script in package.json:
// //   "test-node": "npm i --no-save --force bson@1.1.0 && mocha ./test/node && npm uninstall --no-save --force bson@1.1.0"
// //
// function getOldBSON() {
//   try {
//     // do a dynamic resolve to avoid exception when running browser tests
//     const file = require.resolve('bson');
//     const oldModule = require(file).BSON;
//     const funcs = new oldModule.BSON();
//     oldModule.serialize = funcs.serialize;
//     oldModule.deserialize = funcs.deserialize;
//     return oldModule;
//   } catch (e) {
//     return BSON; // if old bson lib is unavailable, e.g. browser tests, just re-use new BSON
//   }
// }

// const OldBSON = getOldBSON();
// const OldObjectID = OldBSON === BSON ? BSON.ObjectId : OldBSON.ObjectID;
// const usingOldBSON = OldBSON !== BSON;

// let doc = {};

// before(function() {
  const buf: Uint8Array = new Uint8Array(64);
  for (let i: number = 0; i < buf.length; i++) {
    buf[i] = i;
  }
  const date: Date = new Date();
  date.setTime(1488372056737);
  const doc0: { [key:string]: any} = {
    _id: new Int32(100),
    gh: new Int32(1),
    binary: new Binary(buf),
    date: date,
    code: new Code('function() {}', { a: new Int32(1) }),
    dbRef: new DBRef('tests', new Int32(1), 'test'),
    decimal: Decimal128.fromString('100'),
    double: new Double(10.1),
    int32: new Int32(10),
    long: Long.fromNumber(200),
    maxKey: new MaxKey(),
    minKey: new MinKey(),
    objectId: ObjectId.fromHexString('111111111111111111111111'),
    // objectID: ObjectID.createFromHexString('111111111111111111111111'),
    // oldObjectID: OldObjectID.createFromHexString('111111111111111111111111'),
    regexp: new BSONRegExp('hello world', 'i'),
    symbol: new BSONSymbol('symbol'),
    timestamp: Timestamp.fromNumber(1000),
    int32Number: 300,
    doubleNumber: 200.2,
    longNumberIntFit: 0x19000000000000,
    doubleNumberIntFit: 19007199250000000.12
  };
// });

test({
  name: 'should correctly stringify to extended JSON',
  fn(): void {
    const expected: string =
      '{"_id":{"$numberInt":"100"},"gh":{"$numberInt":"1"},"binary":{"$binary":{"base64":"AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==","subType":"00"}},"date":{"$date":{"$numberLong":"1488372056737"}},"code":{"$code":"function() {}","$scope":{"a":{"$numberInt":"1"}}},"dbRef":{"$ref":"tests","$id":{"$numberInt":"1"},"$db":"test"},"decimal":{"$numberDecimal":"100"},"double":{"$numberDouble":"10.1"},"int32":{"$numberInt":"10"},"long":{"$numberLong":"200"},"maxKey":{"$maxKey":"9223372036854775807"},"minKey":{"$minKey":"-9223372036854775808"},"objectId":{"$oid":"111111111111111111111111"},"regexp":{"$regularExpression":{"pattern":"hello world","options":"i"}},"symbol":{"$symbol":"symbol"},"timestamp":{"$timestamp":{"t":0,"i":1000}},"int32Number":{"$numberInt":"300"},"doubleNumber":{"$numberDouble":"200.2"},"longNumberIntFit":{"$numberLong":"7036874417766400"},"doubleNumberIntFit":{"$numberLong":"19007199250000000"}}';
    const ejson: string = EJSON.stringify(doc0, null, 0, { relaxed: false })
    assertEquals(ejson, expected);
  }
})

test({
  name: 'should correctly deserialize using the default relaxed mode', 
  fn():void {
    // Deserialize the document using non strict mode
    let doc: { [key:string]: any} = EJSON.parse(EJSON.stringify(doc0, null, 0));
    // Validate the values
    assertEquals(300, doc.int32Number);
    assertEquals(200.2, doc.doubleNumber);
    assertEquals(0x19000000000000, doc.longNumberIntFit);
    assertEquals(19007199250000000.12, doc.doubleNumberIntFit);
    // Deserialize the document using strict mode
    doc = EJSON.parse(EJSON.stringify(doc0, null, 0), { relaxed: false });
    // Validate the values
    // expect(doc1.int32Number._bsontype).to.equal('Int32');
    assertEquals(doc.int32Number._bsontype, "Int32")
    // expect(doc1.doubleNumber._bsontype).to.equal('Double');
        assertEquals(doc.doubleNumber._bsontype, "Double")
    // expect(doc1.longNumberIntFit._bsontype).to.equal('Long');
        assertEquals(doc.longNumberIntFit._bsontype, "Long")
    // expect(doc1.doubleNumberIntFit._bsontype).to.equal('Long');
        assertEquals(doc.doubleNumberIntFit._bsontype, "Long")
  }
  
});

test({
  name: 'should correctly serialize, and deserialize using built-in BSON',
  fn():void {
    // Create a doc
  let doc: {[key:string]:any} = { int32: new Int32(10)   };
    // Serialize the document
    const text:string = EJSON.stringify(doc, null, 0, { relaxed: false });
    assertEquals(text,'{"int32":{"$numberInt":"10"}}');
    // Deserialize the json in strict and non strict mode
   doc = EJSON.parse(text, { relaxed: false });
    // expect(doc2.int32._bsontype).to.equal('Int32');
    assertEquals(doc.int32._bsontype, "Int32")
    doc = EJSON.parse(text);
    // expect(doc2.int32).to.equal(10);
    assertEquals(doc.int32, 10)
  }
});

test({
  name: 'should correctly serialize bson types when they are values', 
  fn():void {
    let serialized: string = EJSON.stringify(new ObjectId('591801a468f9e7024b6235ea'), { relaxed: false });
    // expect(serialized).to.equal('{"$oid":"591801a468f9e7024b6235ea"}');
    assertEquals(serialized, '{"$oid":"591801a468f9e7024b6235ea"}')
    // serialized = EJSON.stringify(new ObjectID('591801a468f9e7024b6235ea'), { relaxed: false });
    // expect(serialized).to.equal('{"$oid":"591801a468f9e7024b6235ea"}');
    // serialized = EJSON.stringify(new OldObjectID('591801a468f9e7024b6235ea'), { relaxed: false });
    // expect(serialized).to.equal('{"$oid":"591801a468f9e7024b6235ea"}');

    serialized = EJSON.stringify(new Int32(42), { relaxed: false });
    // expect(serialized).to.equal('{"$numberInt":"42"}');
    assertEquals(serialized, '{"$numberInt":"42"}')
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new ObjectId('591801a468f9e7024b6235ea')] }
      },
      { relaxed: false }
    );
    // expect(serialized).to.equal('{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}');
    assertEquals(serialized, '{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}')
    // serialized = EJSON.stringify(
    //   {
    //     _id: { $nin: [new ObjectID('591801a468f9e7024b6235ea')] }
    //   },
    //   { relaxed: false }
    // );
    // expect(serialized).to.equal('{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}');
    // serialized = EJSON.stringify(
    //   {
    //     _id: { $nin: [new OldObjectID('591801a468f9e7024b6235ea')] }
    //   },
    //   { relaxed: false }
    // );
    // expect(serialized).to.equal('{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}');

    serialized = EJSON.stringify(new Binary(new Uint8Array([1, 2, 3, 4, 5])), { relaxed: false });
    // expect(serialized).to.equal('{"$binary":{"base64":"AQIDBAU=","subType":"00"}}');
    assertEquals(serialized, '{"$binary":{"base64":"AQIDBAU=","subType":"00"}}')
  }
});

test({
  name: 'should correctly parse null values', fn():void{
    // expect(EJSON.parse('null')).to.be.null;
    assertEquals(EJSON.parse("null"), null)
    // expect(EJSON.parse('[null]')[0]).to.be.null;
assertEquals(EJSON.parse("[null]")[0], null)
    let input: string = '{"result":[{"_id":{"$oid":"591801a468f9e7024b623939"},"emptyField":null}]}';
    let parsed : { [key:string]: any} = EJSON.parse(input);

    assertEquals(parsed,{
      result: [{ _id: new ObjectId('591801a468f9e7024b623939'), emptyField: null }]
    });
  }
});

// it('should correctly throw when passed a non-string to parse', function() {
//   expect(() => {
//     EJSON.parse({});
//   }).to.throw;
// });
//
// it('should allow relaxed parsing by default', function() {
//   const dt = new Date(1452124800000);
//   const inputObject = {
//     int: { $numberInt: '500' },
//     long: { $numberLong: '42' },
//     double: { $numberDouble: '24' },
//     date: { $date: { $numberLong: '1452124800000' } }
//   };
//
//   const parsed = EJSON.parse(JSON.stringify(inputObject));
//   expect(parsed).to.eql({
//     int: 500,
//     long: 42,
//     double: 24,
//     date: dt
//   });
// });
//
// it('should allow regexp', function() {
//   const parsedRegExp = EJSON.stringify({ test: /some-regex/i });
//   const parsedBSONRegExp = EJSON.stringify(
//     { test: new BSONRegExp('some-regex', 'i') },
//     { relaxed: true }
//   );
//   expect(parsedRegExp).to.eql(parsedBSONRegExp);
// });
//
// it('should serialize from BSON object to EJSON object', function() {
//   const doc = {
//     binary: new Binary(''),
//     code: new Code('function() {}'),
//     dbRef: new DBRef('tests', new Int32(1), 'test'),
//     decimal128: new Decimal128(128),
//     double: new Double(10.1),
//     int32: new Int32(10),
//     long: new Long(234),
//     maxKey: new MaxKey(),
//     minKey: new MinKey(),
//     objectId: ObjectId.createFromHexString('111111111111111111111111'),
//     objectID: ObjectID.createFromHexString('111111111111111111111111'),
//     oldObjectID: OldObjectID.createFromHexString('111111111111111111111111'),
//     bsonRegExp: new BSONRegExp('hello world', 'i'),
//     symbol: new BSONSymbol('symbol'),
//     timestamp: new Timestamp()
//   };
//
//   const result = EJSON.serialize(doc, { relaxed: false });
//   expect(result).to.deep.equal({
//     binary: { $binary: { base64: '', subType: '00' } },
//     code: { $code: 'function() {}' },
//     dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
//     decimal128: { $numberDecimal: '0E-6176' },
//     double: { $numberDouble: '10.1' },
//     int32: { $numberInt: '10' },
//     long: { $numberLong: '234' },
//     maxKey: { $maxKey: 1 },
//     minKey: { $minKey: 1 },
//     objectId: { $oid: '111111111111111111111111' },
//     objectID: { $oid: '111111111111111111111111' },
//     oldObjectID: { $oid: '111111111111111111111111' },
//     bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
//     symbol: { $symbol: 'symbol' },
//     timestamp: { $timestamp: { t: 0, i: 0 } }
//   });
// });
//
// it('should deserialize from EJSON object to BSON object', function() {
//   const doc = {
//     binary: { $binary: { base64: '', subType: '00' } },
//     code: { $code: 'function() {}' },
//     dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
//     decimal128: { $numberDecimal: '0E-6176' },
//     double: { $numberDouble: '10.1' },
//     int32: { $numberInt: '10' },
//     long: { $numberLong: '234' },
//     maxKey: { $maxKey: 1 },
//     minKey: { $minKey: 1 },
//     objectId: { $oid: '111111111111111111111111' },
//     objectID: { $oid: '111111111111111111111111' },
//     oldObjectID: { $oid: '111111111111111111111111' },
//     bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
//     symbol: { $symbol: 'symbol' },
//     timestamp: { $timestamp: { t: 0, i: 0 } }
//   };
//
//   const result = EJSON.deserialize(doc, { relaxed: false });
//
//   // binary
//   expect(result.binary).to.be.an.instanceOf(BSON.Binary);
//   // code
//   expect(result.code).to.be.an.instanceOf(BSON.Code);
//   expect(result.code.code).to.equal('function() {}');
//   // dbRef
//   expect(result.dbRef).to.be.an.instanceOf(BSON.DBRef);
//   expect(result.dbRef.collection).to.equal('tests');
//   expect(result.dbRef.db).to.equal('test');
//   // decimal128
//   expect(result.decimal128).to.be.an.instanceOf(BSON.Decimal128);
//   // double
//   expect(result.double).to.be.an.instanceOf(BSON.Double);
//   expect(result.double.value).to.equal(10.1);
//   // int32
//   expect(result.int32).to.be.an.instanceOf(BSON.Int32);
//   expect(result.int32.value).to.equal('10');
//   //long
//   expect(result.long).to.be.an.instanceOf(BSON.Long);
//   // maxKey
//   expect(result.maxKey).to.be.an.instanceOf(BSON.MaxKey);
//   // minKey
//   expect(result.minKey).to.be.an.instanceOf(BSON.MinKey);
//   // objectID
//   expect(result.objectId.toString()).to.equal('111111111111111111111111');
//   expect(result.objectID.toString()).to.equal('111111111111111111111111');
//   expect(result.oldObjectID.toString()).to.equal('111111111111111111111111');
//   //bsonRegExp
//   expect(result.bsonRegExp).to.be.an.instanceOf(BSON.BSONRegExp);
//   expect(result.bsonRegExp.pattern).to.equal('hello world');
//   expect(result.bsonRegExp.options).to.equal('i');
//   // symbol
//   expect(result.symbol.toString()).to.equal('symbol');
//   // timestamp
//   expect(result.timestamp).to.be.an.instanceOf(BSON.Timestamp);
// });
//
// it('should return a native number for a double in relaxed mode', function() {
//   const result = EJSON.deserialize({ test: 34.12 }, { relaxed: true });
//   expect(result.test).to.equal(34.12);
//   expect(result.test).to.be.a('number');
// });
//
// it('should work for function-valued and array-valued replacer parameters', function() {
//   const doc = { a: new Int32(10), b: new Int32(10) };
//
//   var replacerArray = ['a', '$numberInt'];
//   var serialized = EJSON.stringify(doc, replacerArray, 0, { relaxed: false });
//   expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');
//
//   serialized = EJSON.stringify(doc, replacerArray);
//   expect(serialized).to.equal('{"a":10}');
//
//   var replacerFunc = function(key, value) {
//     return key === 'b' ? undefined : value;
//   };
//   serialized = EJSON.stringify(doc, replacerFunc, 0, { relaxed: false });
//   expect(serialized).to.equal('{"a":{"$numberInt":"10"}}');
//
//   serialized = EJSON.stringify(doc, replacerFunc);
//   expect(serialized).to.equal('{"a":10}');
// });
//
// if (!usingOldBSON) {
//   it.skip('skipping 4.x/1.x interop tests', () => {});
// } else {
//   it('should interoperate 4.x with 1.x versions of this library', function() {
//     const buffer = Buffer.alloc(64);
//     for (var i = 0; i < buffer.length; i++) {
//       buffer[i] = i;
//     }
//     const [oldBsonObject, newBsonObject] = [OldBSON, BSON].map(bsonModule => {
//       const bsonTypes = {
//         binary: new bsonModule.Binary(buffer),
//         code: new bsonModule.Code('function() {}'),
//         dbRef: new bsonModule.DBRef('tests', new Int32(1), 'test'),
//         decimal128: new bsonModule.Decimal128.fromString('9991223372036854775807'),
//         double: new bsonModule.Double(10.1),
//         int32: new bsonModule.Int32(10),
//         long: new bsonModule.Long.fromString('1223372036854775807'),
//         maxKey: new bsonModule.MaxKey(),
//         // minKey: new bsonModule.MinKey(), // broken until #310 is fixed in 1.x
//         objectId: bsonModule.ObjectId.createFromHexString('111111111111111111111111'),
//         objectID: bsonModule.ObjectID.createFromHexString('111111111111111111111111'),
//         bsonRegExp: new bsonModule.BSONRegExp('hello world', 'i'),
//         symbol: bsonModule.BSONSymbol
//           ? new bsonModule.BSONSymbol('symbol')
//           : new bsonModule.Symbol('symbol'),
//         timestamp: new bsonModule.Timestamp()
//       };
//       return bsonTypes;
//     });
//
//     const serializationOptions = {};
//     const bsonBuffers = {
//       oldObjectOldSerializer: OldBSON.serialize(oldBsonObject, serializationOptions),
//       oldObjectNewSerializer: BSON.serialize(oldBsonObject, serializationOptions),
//       newObjectOldSerializer: OldBSON.serialize(newBsonObject, serializationOptions),
//       newObjectNewSerializer: BSON.serialize(newBsonObject, serializationOptions)
//     };
//
//     const expectedBufferBase64 =
//       'VgEAAAViaW5hcnkAQAAAAAAAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/DWNvZGUADgAAAGZ1bmN0aW9uKCkge30AA2RiUmVmACwAAAACJHJlZgAGAAAAdGVzdHMAECRpZAABAAAAAiRkYgAFAAAAdGVzdAAAE2RlY2ltYWwxMjgA//837RjxE6AdAgAAAABAMAFkb3VibGUAMzMzMzMzJEAQaW50MzIACgAAABJsb25nAP//38RiSvoQf21heEtleQAHb2JqZWN0SWQAERERERERERERERERB29iamVjdElEABEREREREREREREREQtic29uUmVnRXhwAGhlbGxvIHdvcmxkAGkADnN5bWJvbAAHAAAAc3ltYm9sABF0aW1lc3RhbXAAAAAAAAAAAAAA';
//     const expectedBuffer = Buffer.from(expectedBufferBase64, 'base64');
//
//     // Regardless of which library version created the objects, and which library version
//     // is being used to serialize the objects, validate that the correct BSON is returned.
//     expect(expectedBuffer).to.deep.equal(bsonBuffers.newObjectNewSerializer);
//     expect(expectedBuffer).to.deep.equal(bsonBuffers.newObjectOldSerializer);
//     expect(expectedBuffer).to.deep.equal(bsonBuffers.oldObjectNewSerializer);
//     expect(expectedBuffer).to.deep.equal(bsonBuffers.oldObjectOldSerializer);
//
//     // Finally, validate that the BSON buffer above is correctly deserialized back to EJSON by the new library,
//     // regardless of which library version's deserializer is used.  This is useful because the 1.x deserializer
//     // generates 1.x objects, while the 4.x serializer generates 4.x objects. The 4.x EJSON serializer should
//     // be able to handle both.
//     const deserializationOptions = { promoteValues: false };
//     const deserialized = {
//       usingOldDeserializer: OldBSON.deserialize(expectedBuffer, deserializationOptions),
//       usingNewDeserializer: BSON.deserialize(expectedBuffer, deserializationOptions)
//     };
//     // Apparently the Symbol BSON type was deprecated in V4. Symbols in BSON are deserialized as strings in V4
//     // Therefore, for this type we know there will be a difference between the V1 library and the V4 library,
//     // so remove Symbol from the list of BSON types that are being compared.
//     // Browser tests currently don't handle BSON Symbol correctly, so only test this under Node where OldBSON !=== BSON module.
//     if (BSON !== OldBSON) {
//       expect(deserialized.usingOldDeserializer['symbol'].value).to.equal(
//         deserialized.usingNewDeserializer['symbol']
//       );
//     }
//     delete deserialized.usingOldDeserializer['symbol'];
//     delete deserialized.usingNewDeserializer['symbol'];
//
//     const ejsonExpected = {
//       binary: {
//         $binary: {
//           base64:
//             'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==',
//           subType: '00'
//         }
//       },
//       code: { $code: 'function() {}' },
//       dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
//       decimal128: { $numberDecimal: '9991223372036854775807' },
//       double: { $numberDouble: '10.1' },
//       int32: { $numberInt: '10' },
//       long: { $numberLong: '1223372036854775807' },
//       maxKey: { $maxKey: 1 },
//       // minKey: { $minKey: 1 },  // broken until #310 is fixed in 1.x branch
//       objectId: { $oid: '111111111111111111111111' },
//       objectID: { $oid: '111111111111111111111111' },
//       bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
//       // symbol: { $symbol: 'symbol' },  // removed because this type is deprecated. See comment above.
//       timestamp: { $timestamp: { t: 0, i: 0 } }
//     };
//     const ejsonSerializationOptions = { relaxed: false };
//     const resultOld = EJSON.serialize(
//       deserialized.usingOldDeserializer,
//       ejsonSerializationOptions
//     );
//     expect(resultOld).to.deep.equal(ejsonExpected);
//     const resultNew = EJSON.serialize(
//       deserialized.usingNewDeserializer,
//       ejsonSerializationOptions
//     );
//     expect(resultNew).to.deep.equal(ejsonExpected);
//   });
//
//   // Must special-case the test for MinKey, because of #310.  When #310 is fixed and is picked up
//   // by mongodb-core, then remove this test case and uncomment the MinKey checks in the test case above
//   it('should interop with MinKey 1.x and 4.x, except the case that #310 breaks', function() {
//     if (!usingOldBSON) {
//       it.skip('interop tests', () => {});
//       return;
//     }
//
//     const serializationOptions = {};
//     const deserializationOptions = { promoteValues: false };
//
//     // when #310 is fixed and the fix makes it into mongodb-core.
//     const [oldMinKey, newMinKey] = [OldBSON, BSON].map(bsonModule => {
//       const bsonTypes = {
//         minKey: new bsonModule.MinKey()
//       };
//       return bsonTypes;
//     });
//
//     const expectedBufferBase64MinKey = 'DQAAAP9taW5LZXkAAA==';
//     const expectedBufferMinKey = Buffer.from(expectedBufferBase64MinKey, 'base64');
//
//     const bsonBuffersMinKey = {
//       oldObjectOldSerializer: OldBSON.serialize(oldMinKey, serializationOptions),
//       oldObjectNewSerializer: BSON.serialize(oldMinKey, serializationOptions),
//       newObjectOldSerializer: OldBSON.serialize(newMinKey, serializationOptions),
//       newObjectNewSerializer: BSON.serialize(newMinKey, serializationOptions)
//     };
//
//     expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.newObjectNewSerializer);
//     // expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.newObjectOldSerializer);  // this is the case that's broken by #310
//     expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.oldObjectNewSerializer);
//     expect(expectedBufferMinKey).to.deep.equal(bsonBuffersMinKey.oldObjectOldSerializer);
//
//     const ejsonExpected = {
//       minKey: { $minKey: 1 }
//     };
//
//     const deserialized = {
//       usingOldDeserializer: OldBSON.deserialize(expectedBufferMinKey, deserializationOptions),
//       usingNewDeserializer: BSON.deserialize(expectedBufferMinKey, deserializationOptions)
//     };
//     const ejsonSerializationOptions = { relaxed: false };
//     const resultOld = EJSON.serialize(
//       deserialized.usingOldDeserializer,
//       ejsonSerializationOptions
//     );
//     expect(resultOld).to.deep.equal(ejsonExpected);
//     const resultNew = EJSON.serialize(
//       deserialized.usingNewDeserializer,
//       ejsonSerializationOptions
//     );
//     expect(resultNew).to.deep.equal(ejsonExpected);
//   });
// }
//
// it('should throw if invalid BSON types are input to EJSON serializer', function() {
//   const oid = new ObjectId('111111111111111111111111');
//   const badBsonType = Object.assign({}, oid, { _bsontype: 'bogus' });
//   const badDoc = { bad: badBsonType };
//   const badArray = [oid, badDoc];
//   // const badMap = new Map([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
//   expect(() => EJSON.serialize(badDoc)).to.throw();
//   expect(() => EJSON.serialize(badArray)).to.throw();
//   // expect(() => EJSON.serialize(badMap)).to.throw(); // uncomment when EJSON supports ES6 Map
// });

runIfMain(import.meta, { parallel: true})
