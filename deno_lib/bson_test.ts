import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assert, assertEquals, assertThrows } from "https://deno.land/x/testing/asserts.ts";
import { Long } from "./long/mod.ts"
import { Double } from "./double.ts"
import { Timestamp } from "./timestamp.ts"
import {ObjectId } from "./object_id.ts"
import { DateTime } from "./datetime.ts"
// import {BSONRegExp} from "./regexp.ts"
// import {BSONSymbol} from "./symbol.ts"
// import {Int32} from "./int32.ts"
import {Code} from "./code.ts"
// import {Decimal128} from "./decimal128.ts"
import {MinKey} from "./min_key.ts"
import {MaxKey} from "./max_key.ts"
import { DBRef} from "./db_ref.ts"
import {Binary} from "./binary.ts"
import { serialize, deserialize, serializeInto, calculateObjectSize, BSON_INT32_MAX } from "./bson.ts"
import { encode, decode} from "./transcoding.ts"


test({
  name: 'convert object id to itself', 
  fn():void {
    const a: ObjectId = new ObjectId();
    const b: ObjectId = new ObjectId(a);
    assert(b.equals(a))
    assertEquals(b, a)
  }
});

test({
  name: 'deserialize object', 
  fn():void {
    const bson: Uint8Array = Uint8Array.from([
      95,
      0,
      0,
      0,
      2,
      110,
      115,
      0,
      42,
      0,
      0,
      0,
      105,
      110,
      116,
      101,
      103,
      114,
      97,
      116,
      105,
      111,
      110,
      95,
      116,
      101,
      115,
      116,
      115,
      95,
      46,
      116,
      101,
      115,
      116,
      95,
      105,
      110,
      100,
      101,
      120,
      95,
      105,
      110,
      102,
      111,
      114,
      109,
      97,
      116,
      105,
      111,
      110,
      0,
      8,
      117,
      110,
      105,
      113,
      117,
      101,
      0,
      0,
      3,
      107,
      101,
      121,
      0,
      12,
      0,
      0,
      0,
      16,
      97,
      0,
      1,
      0,
      0,
      0,
      0,
      2,
      110,
      97,
      109,
      101,
      0,
      4,
      0,
      0,
      0,
      97,
      95,
      49,
      0,
      0
    ]);
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc.name, "a_1")
    assertEquals(doc.unique, false)
    assertEquals(doc.key.a, 1)
  }
});

test({
  name: 'deserialize object with all types',
  fn():void {
    const bson: Uint8Array= Uint8Array.from([
      26,
      1,
      0,
      0,
      7,
      95,
      105,
      100,
      0,
      161,
      190,
      98,
      75,
      118,
      169,
      3,
      0,
      0,
      3,
      0,
      0,
      4,
      97,
      114,
      114,
      97,
      121,
      0,
      26,
      0,
      0,
      0,
      16,
      48,
      0,
      1,
      0,
      0,
      0,
      16,
      49,
      0,
      2,
      0,
      0,
      0,
      16,
      50,
      0,
      3,
      0,
      0,
      0,
      0,
      2,
      115,
      116,
      114,
      105,
      110,
      103,
      0,
      6,
      0,
      0,
      0,
      104,
      101,
      108,
      108,
      111,
      0,
      3,
      104,
      97,
      115,
      104,
      0,
      19,
      0,
      0,
      0,
      16,
      97,
      0,
      1,
      0,
      0,
      0,
      16,
      98,
      0,
      2,
      0,
      0,
      0,
      0,
      9,
      100,
      97,
      116,
      101,
      0,
      161,
      190,
      98,
      75,
      0,
      0,
      0,
      0,
      7,
      111,
      105,
      100,
      0,
      161,
      190,
      98,
      75,
      90,
      217,
      18,
      0,
      0,
      1,
      0,
      0,
      5,
      98,
      105,
      110,
      97,
      114,
      121,
      0,
      7,
      0,
      0,
      0,
      2,
      3,
      0,
      0,
      0,
      49,
      50,
      51,
      16,
      105,
      110,
      116,
      0,
      42,
      0,
      0,
      0,
      1,
      102,
      108,
      111,
      97,
      116,
      0,
      223,
      224,
      11,
      147,
      169,
      170,
      64,
      64,
      11,
      114,
      101,
      103,
      101,
      120,
      112,
      0,
      102,
      111,
      111,
      98,
      97,
      114,
      0,
      105,
      0,
      8,
      98,
      111,
      111,
      108,
      101,
      97,
      110,
      0,
      1,
      15,
      119,
      104,
      101,
      114,
      101,
      0,
      25,
      0,
      0,
      0,
      12,
      0,
      0,
      0,
      116,
      104,
      105,
      115,
      46,
      120,
      32,
      61,
      61,
      32,
      51,
      0,
      5,
      0,
      0,
      0,
      0,
      3,
      100,
      98,
      114,
      101,
      102,
      0,
      37,
      0,
      0,
      0,
      2,
      36,
      114,
      101,
      102,
      0,
      5,
      0,
      0,
      0,
      116,
      101,
      115,
      116,
      0,
      7,
      36,
      105,
      100,
      0,
      161,
      190,
      98,
      75,
      2,
      180,
      1,
      0,
      0,
      2,
      0,
      0,
      0,
      10,
      110,
      117,
      108,
      108,
      0,
      0
    ]);
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc.string, "hello")
    assertEquals(doc.array, [1,2,3])
    assertEquals(doc.hash.a, 1)
    assertEquals(doc.hash.b, 2)
    assert(doc.date)
    assert(doc.oid)
    assert(doc.binary)
    assertEquals(doc.int, 42)
    assertEquals(doc.float, 33.3333)
    assert(doc.regexp)
    assert(doc.boolean)
    assert(doc.where)
    assert(doc.dbref)
    assert(!doc[null as any])
  }
});

test({
  name: 'serialize and deserialize string', fn():void {
    const expected_doc: {[key:string]: any} = { hello: 'world' };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize empty string', fn(): void {
    const expected_doc: {[key:string]: any} = { hello: '' };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize integer', fn():void {
    let expected_doc: {[key:string]: any} = { money: 419 };
    let bson: Uint8Array = serialize(expected_doc)
    let doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    let buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
    expected_doc = { money: -5600 }
    bson = serialize(expected_doc)
    doc = deserialize(bson)
    assertEquals(doc, expected_doc)
    buf = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
    expected_doc = { money: 2147483647 }
    bson = serialize(expected_doc)
    doc = deserialize(bson)
    assertEquals(doc, expected_doc)
    buf = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
    expected_doc = { money: -2147483648 }
    bson = serialize(expected_doc)
    doc = deserialize(bson)
    assertEquals(doc, expected_doc)
    buf = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize float', fn():void {
    const expected_doc: {[key:string]: any} = { money: 419.999 };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialized double deserializes as number by default', fn():void {
    const input_doc: {[key:string]: any} = { money: new Double(419.999) };
    const expected_doc: {[key:string]: any} = { money: 419.999 };
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize object', fn():void {
    const expected_doc: {[key:string]: any} = { age: 42, name: 'Spongebob', shoe_size: 9.5 };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
    assertEquals(doc.age, expected_doc.age)
    assertEquals(doc.name, expected_doc.name)
    assertEquals(doc.shoe_size, expected_doc.shoe_size)
  }
});

test({
  name: 'serialize and deserialize null', fn():void {
    const expected_doc: {[key:string]: any} = { money: null };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize undefined as null by default', fn():void {
    const input_doc: {[key:string]: any} = { money: undefined };
    const expected_doc: {[key:string]: any} = { money: null };
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(bson.byteLength)
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize array', fn():void {
    const expected_doc: {[key:string]: any} = { arr: [1, 2, 'a', 'b'] };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize array with undefined as null values', fn():void {
    const input_doc: {[key:string]: any} = { arr: [1, undefined, undefined, 'b'] };
    const expected_doc: {[key:string]: any} = { arr: [1, null, null, 'b'] };
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize Uint8Array', fn():void {
    const expected_doc: {[key:string]: any} = { buf: Uint8Array.from([36, 44, 99, 255]) };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    assert(doc.buf instanceof Uint8Array)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialized binary deserializes as Uint8Array by default', fn():void {
    const input_doc: {[key:string]: any} = { buf: new Binary(Uint8Array.from([36, 44, 99, 255])) };
    const expected_doc: {[key:string]: any} = { buf: Uint8Array.from([36, 44, 99, 255]) };
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    assert(doc.buf instanceof Uint8Array)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'optionally deserialize binary as binary not Uint8Array', fn():void {
    const expected_doc: {[key:string]: any} = { buf: new Binary(Uint8Array.from([36, 44, 99, 255])) };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson, { promoteValues: false})
    assertEquals(doc, expected_doc)
    assert(doc.buf instanceof Binary)
    const buf: Uint8Array = new Uint8Array(bson.byteLength)
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize number 4', fn():void {
    const expected_doc: {[key:string]: any} = { num: BSON_INT32_MAX + 10 };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize Array with added on functions', function(done) {
//   Array.prototype.toXml = function() {};
//   var doc = { doc: [1, 2, 'a', 'b'] };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized = BSON.deserialize(serialized_data);
//   expect(doc.doc[0]).to.equal(deserialized.doc[0]);
//   expect(doc.doc[1]).to.equal(deserialized.doc[1]);
//   expect(doc.doc[2]).to.equal(deserialized.doc[2]);
//   expect(doc.doc[3]).to.equal(deserialized.doc[3]);
//   done();
// });

test({
  name: 'serialize and deserialize a nested object', fn():void {
    const expected_doc: {[key:string]: any} = { sub: { terrain: 0 } };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize a boolean', fn(): void {
    const expected_doc: {[key:string]: any} = { truth: false };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialized js date deserializes as datetime - always', fn(): void {
    const date: Date = new Date();
    date.setUTCDate(12);
    date.setUTCFullYear(2009);
    date.setUTCMonth(11 - 1);
    date.setUTCHours(12);
    date.setUTCMinutes(0);
    date.setUTCSeconds(30);
    date.setUTCMilliseconds(166)
    const ms: string = "1258027230166"
    const input_doc: {[key:string]: any} = { date };
    const expected_doc: {[key:string]: any} = { date: new DateTime(ms) };
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc.date.toString(), expected_doc.date.toString())
    const buf: Uint8Array = new Uint8Array(bson.byteLength)
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});


test({
  name: 'serialize and deserialize another nested doc', fn():void {
    const expected_doc: { [key:string]: any} = {
      string: 'Strings are great',
      decimal: 3.14159265,
      bool: true,
      integer: 5,
      subObject: {
        moreText: 'Bacon ipsum dolor.',
        longKeylongKeylongKeylongKeylongKeylongKey: 'Pork belly.'
      },
      subArray: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      anotherString: 'another string'
    };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize object id', fn():void {
    const expected_doc: {[key:string]: any} = { whoami: new ObjectId() };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize empty doc', fn():void {
    const expected_doc: {[key:string]: any} = { };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize ordered hash', fn():void {
    const expected_doc: {[key:string]: any} = { b: 1, a: 2, d: 3, c:4 };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    assertEquals(Object.keys(doc).join(), Object.keys(expected_doc).join())
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize regular expression', fn():void {
    const expected_doc: {[key:string]: any} = {rex: /fraud/im };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize a Binary object', function(done) {
//   var bin = new Binary();
//   var string = 'binstring';
//   for (var index = 0; index < string.length; index++) {
//     bin.put(string.charAt(index));
//   }
// 
//   var doc = { doc: bin };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
// 
//   expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize a Type 2 Binary object', function(done) {
//   var bin = new Binary(Buffer.from('binstring'), Binary.SUBTYPE_BYTE_ARRAY);
//   var string = 'binstring';
//   for (var index = 0; index < string.length; index++) {
//     bin.put(string.charAt(index));
//   }
// 
//   var doc = { doc: bin };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
// 
//   expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize DBRef', function(done) {
//   var oid = new ObjectId();
//   var doc = { dbref: new DBRef('namespace', oid, null, {}) };
//   var b = BSON;
// 
//   var serialized_data = b.serialize(doc);
//   var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
//   b.serializeWithBufferAndIndex(doc, serialized_data2);
//   expect(serialized_data).to.deep.equal(serialized_data2);
// 
//   var doc2 = b.deserialize(serialized_data);
//   expect(doc).to.deep.equal(doc2);
//   expect(doc2.dbref.oid.toHexString()).to.deep.equal(oid.toHexString());
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize partial DBRef', function(done) {
//   var id = new ObjectId();
//   var doc = { name: 'something', user: { $ref: 'username', $id: id } };
//   var b = BSON;
//   var serialized_data = b.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
//   b.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var doc2 = b.deserialize(serialized_data);
//   expect('something').to.equal(doc2.name);
//   expect('username').to.equal(doc2.user.collection);
//   expect(id.toString()).to.equal(doc2.user.oid.toString());
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize simple Int', function(done) {
//   var doc = { doc: 2147483648 };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var doc2 = BSON.deserialize(serialized_data);
//   expect(doc.doc).to.deep.equal(doc2.doc);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize Long Integer', function(done) {
//   var doc = { doc: Long.fromNumber(9223372036854775807) };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc.doc).to.deep.equal(deserialized_data.doc);
// 
//   doc = { doc: Long.fromNumber(-9223372036854775) };
//   serialized_data = BSON.serialize(doc);
//   deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc.doc).to.deep.equal(deserialized_data.doc);
// 
//   doc = { doc: Long.fromNumber(-9223372036854775809) };
//   serialized_data = BSON.serialize(doc);
//   deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc.doc).to.deep.equal(deserialized_data.doc);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Deserialize Large Integers as Number not Long', function(done) {
//   function roundTrip(val) {
//     var doc = { doc: val };
//     var serialized_data = BSON.serialize(doc);
// 
//     var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//     BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//     assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//     var deserialized_data = BSON.deserialize(serialized_data);
//     expect(doc.doc).to.deep.equal(deserialized_data.doc);
//   }
// 
//   roundTrip(Math.pow(2, 52));
//   roundTrip(Math.pow(2, 53) - 1);
//   roundTrip(Math.pow(2, 53));
//   roundTrip(-Math.pow(2, 52));
//   roundTrip(-Math.pow(2, 53) + 1);
//   roundTrip(-Math.pow(2, 53));
//   roundTrip(Math.pow(2, 65)); // Too big for Long.
//   roundTrip(-Math.pow(2, 65));
//   roundTrip(9223372036854775807);
//   roundTrip(1234567890123456800); // Bigger than 2^53, stays a double.
//   roundTrip(-1234567890123456800);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize Timestamp as subclass of Long', function(done) {
//   var long = Long.fromNumber(9223372036854775807);
//   var timestamp = Timestamp.fromNumber(9223372036854775807);
//   expect(long instanceof Long).to.be.ok;
//   expect(!(long instanceof Timestamp)).to.be.ok;
//   expect(timestamp instanceof Timestamp).to.be.ok;
//   expect(timestamp instanceof Long).to.be.ok;
// 
//   var test_int = { doc: long, doc2: timestamp };
//   var serialized_data = BSON.serialize(test_int);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(test_int));
//   BSON.serializeWithBufferAndIndex(test_int, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(test_int.doc).to.deep.equal(deserialized_data.doc);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Always put the id as the first item in a hash', function(done) {
//   var hash = { doc: { not_id: 1, _id: 2 } };
//   var serialized_data = BSON.serialize(hash);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(hash));
//   BSON.serializeWithBufferAndIndex(hash, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   var keys = [];
// 
//   for (var name in deserialized_data.doc) {
//     keys.push(name);
//   }
// 
//   expect(['not_id', '_id']).to.deep.equal(keys);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize a User defined Binary object', function(done) {
//   var bin = new Binary();
//   bin.sub_type = BSON.BSON_BINARY_SUBTYPE_USER_DEFINED;
//   var string = 'binstring';
//   for (var index = 0; index < string.length; index++) {
//     bin.put(string.charAt(index));
//   }
// 
//   var doc = { doc: bin };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
//   var deserialized_data = BSON.deserialize(serialized_data);
// 
//   expect(deserialized_data.doc.sub_type).to.deep.equal(BSON.BSON_BINARY_SUBTYPE_USER_DEFINED);
//   expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correclty Serialize and Deserialize a Code object', function(done) {
//   var doc = { doc: { doc2: new Code('this.a > i', { i: 1 }) } };
//   var serialized_data = BSON.serialize(doc);
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc.doc.doc2.code).to.deep.equal(deserialized_data.doc.doc2.code);
//   expect(doc.doc.doc2.scope.i).to.deep.equal(deserialized_data.doc.doc2.scope.i);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly serialize and deserialize and embedded array', function(done) {
//   var doc = {
//     a: 0,
//     b: [
//       'tmp1',
//       'tmp2',
//       'tmp3',
//       'tmp4',
//       'tmp5',
//       'tmp6',
//       'tmp7',
//       'tmp8',
//       'tmp9',
//       'tmp10',
//       'tmp11',
//       'tmp12',
//       'tmp13',
//       'tmp14',
//       'tmp15',
//       'tmp16'
//     ]
//   };
// 
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc.a).to.deep.equal(deserialized_data.a);
//   expect(doc.b).to.deep.equal(deserialized_data.b);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize UTF8', function(done) {
//   // Serialize utf8
//   var doc = {
//     name: '本荘由利地域に洪水警報',
//     name1: 'öüóőúéáűíÖÜÓŐÚÉÁŰÍ',
//     name2: 'abcdedede',
//     name3: '本荘由利地域に洪水警報',
//     name4: 'abcdedede',
//     本荘由利地域に洪水警報: '本荘由利地域に洪水警報',
//     本荘由利地本荘由利地: {
//       本荘由利地域に洪水警報: '本荘由利地域に洪水警報',
//       地域に洪水警報本荘由利: '本荘由利地域に洪水警報',
//       洪水警報本荘地域に洪水警報本荘由利: '本荘由利地域に洪水警報'
//     }
//   };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc).to.deep.equal(deserialized_data);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize query object', function(done) {
//   var doc = { count: 'remove_with_no_callback_bug_test', query: {}, fields: null };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc).to.deep.equal(deserialized_data);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize empty query object', function(done) {
//   var doc = {};
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc).to.deep.equal(deserialized_data);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize array based doc', function(done) {
//   var doc = { b: [1, 2, 3], _id: new ObjectId() };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc.b).to.deep.equal(deserialized_data.b);
//   expect(doc).to.deep.equal(deserialized_data);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize and Deserialize Symbol', function(done) {
//   if (BSONSymbol != null) {
//     // symbols are deprecated, so upgrade to strings... so I'm not sure
//     // we really need this test anymore...
//     //var doc = { b: [new BSONSymbol('test')] };
// 
//     var doc = { b: ['test'] };
//     var serialized_data = BSON.serialize(doc);
//     var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//     BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//     assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//     var deserialized_data = BSON.deserialize(serialized_data);
//     expect(doc).to.deep.equal(deserialized_data);
//     expect(typeof deserialized_data.b[0]).to.equal('string');
//   }
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should handle Deeply nested document', function(done) {
//   var doc = { a: { b: { c: { d: 2 } } } };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var deserialized_data = BSON.deserialize(serialized_data);
//   expect(doc).to.deep.equal(deserialized_data);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should handle complicated all typed object', function(done) {
//   // First doc
//   var date = new Date();
//   var oid = new ObjectId();
//   var string = 'binstring';
//   var bin = new Binary();
//   for (var index = 0; index < string.length; index++) {
//     bin.put(string.charAt(index));
//   }
// 
//   var doc = {
//     string: 'hello',
//     array: [1, 2, 3],
//     hash: { a: 1, b: 2 },
//     date: date,
//     oid: oid,
//     binary: bin,
//     int: 42,
//     float: 33.3333,
//     regexp: /regexp/,
//     boolean: true,
//     long: date.getTime(),
//     where: new Code('this.a > i', { i: 1 }),
//     dbref: new DBRef('namespace', oid, 'integration_tests_')
//   };
// 
//   // Second doc
//   oid = ObjectId.createFromHexString(oid.toHexString());
//   string = 'binstring';
//   bin = new Binary();
//   for (index = 0; index < string.length; index++) {
//     bin.put(string.charAt(index));
//   }
// 
//   var doc2 = {
//     string: 'hello',
//     array: [1, 2, 3],
//     hash: { a: 1, b: 2 },
//     date: date,
//     oid: oid,
//     binary: bin,
//     int: 42,
//     float: 33.3333,
//     regexp: /regexp/,
//     boolean: true,
//     long: date.getTime(),
//     where: new Code('this.a > i', { i: 1 }),
//     dbref: new DBRef('namespace', oid, 'integration_tests_')
//   };
// 
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
// 
//   expect(serialized_data).to.deep.equal(serialized_data2);
// 
//   serialized_data2 = BSON.serialize(doc2, false, true);
// 
//   expect(serialized_data).to.deep.equal(serialized_data2);
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize Complex Nested Object', function(done) {
//   var doc = {
//     email: 'email@email.com',
//     encrypted_password: 'password',
//     friends: ['4db96b973d01205364000006', '4dc77b24c5ba38be14000002'],
//     location: [72.4930088, 23.0431957],
//     name: 'Amit Kumar',
//     password_salt: 'salty',
//     profile_fields: [],
//     username: 'amit',
//     _id: new ObjectId()
//   };
// 
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var doc2 = doc;
//   doc2._id = ObjectId.createFromHexString(doc2._id.toHexString());
//   serialized_data2 = BSON.serialize(doc2, false, true);
// 
//   for (var i = 0; i < serialized_data2.length; i++) {
//     require('assert').equal(serialized_data2[i], serialized_data[i]);
//   }
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should correctly massive doc', function(done) {
//   var oid1 = new ObjectId();
//   var oid2 = new ObjectId();
// 
//   var b = BSON;
// 
//   // JS doc
//   var doc = {
//     dbref2: new DBRef('namespace', oid1, 'integration_tests_'),
//     _id: oid2
//   };
// 
//   var doc2 = {
//     dbref2: new DBRef(
//       'namespace',
//       ObjectId.createFromHexString(oid1.toHexString()),
//       'integration_tests_'
//     ),
//     _id: ObjectId.createFromHexString(oid2.toHexString())
//   };
// 
//   var serialized_data = b.serialize(doc);
//   var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
//   b.serializeWithBufferAndIndex(doc, serialized_data2);
//   expect(serialized_data).to.deep.equal(serialized_data2);
// 
//   serialized_data2 = b.serialize(doc2, false, true);
//   expect(serialized_data).to.deep.equal(serialized_data2);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize/Deserialize regexp object', function(done) {
//   var doc = { b: /foobaré/ };
// 
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   serialized_data2 = BSON.serialize(doc);
// 
//   for (var i = 0; i < serialized_data2.length; i++) {
//     require('assert').equal(serialized_data2[i], serialized_data[i]);
//   }
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize/Deserialize complicated object', function(done) {
//   var doc = { a: { b: { c: [new ObjectId(), new ObjectId()] } }, d: { f: 1332.3323 } };
// 
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var doc2 = BSON.deserialize(serialized_data);
// 
//   expect(doc).to.deep.equal(doc2);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize/Deserialize nested object', function(done) {
//   var doc = {
//     _id: { date: new Date(), gid: '6f35f74d2bea814e21000000' },
//     value: {
//       b: { countries: { '--': 386 }, total: 1599 },
//       bc: { countries: { '--': 3 }, total: 10 },
//       gp: { countries: { '--': 2 }, total: 13 },
//       mgc: { countries: { '--': 2 }, total: 14 }
//     }
//   };
// 
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var doc2 = BSON.deserialize(serialized_data);
// 
//   expect(doc).to.deep.equal(doc2);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize/Deserialize nested object with even more nesting', function(done) {
//   var doc = {
//     _id: { date: { a: 1, b: 2, c: new Date() }, gid: '6f35f74d2bea814e21000000' },
//     value: {
//       b: { countries: { '--': 386 }, total: 1599 },
//       bc: { countries: { '--': 3 }, total: 10 },
//       gp: { countries: { '--': 2 }, total: 13 },
//       mgc: { countries: { '--': 2 }, total: 14 }
//     }
//   };
// 
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var doc2 = BSON.deserialize(serialized_data);
//   expect(doc).to.deep.equal(doc2);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly Serialize empty name object', function(done) {
//   var doc = {
//     '': 'test',
//     bbbb: 1
//   };
//   var serialized_data = BSON.serialize(doc);
//   var doc2 = BSON.deserialize(serialized_data);
//   expect(doc2['']).to.equal('test');
//   expect(doc2['bbbb']).to.equal(1);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly handle Forced Doubles to ensure we allocate enough space for cap collections', function(done) {
//   if (Double != null) {
//     var doubleValue = new Double(100);
//     var doc = { value: doubleValue };
// 
//     // Serialize
//     var serialized_data = BSON.serialize(doc);
// 
//     var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//     BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//     assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//     var doc2 = BSON.deserialize(serialized_data);
//     expect({ value: 100 }).to.deep.equal(doc2);
//   }
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should deserialize correctly', function(done) {
//   var doc = {
//     _id: new ObjectId('4e886e687ff7ef5e00000162'),
//     str: 'foreign',
//     type: 2,
//     timestamp: ISODate('2011-10-02T14:00:08.383Z'),
//     links: [
//       'http://www.reddit.com/r/worldnews/comments/kybm0/uk_home_secretary_calls_for_the_scrapping_of_the/'
//     ]
//   };
// 
//   var serialized_data = BSON.serialize(doc);
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
//   var doc2 = BSON.deserialize(serialized_data);
// 
//   expect(JSON.stringify(doc)).to.deep.equal(JSON.stringify(doc2));
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should correctly serialize and deserialize MinKey and MaxKey values', function(done) {
//   var doc = {
//     _id: new ObjectId('4e886e687ff7ef5e00000162'),
//     minKey: new MinKey(),
//     maxKey: new MaxKey()
//   };
// 
//   var serialized_data = BSON.serialize(doc);
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
//   var doc2 = BSON.deserialize(serialized_data);
// 
//   // Peform equality checks
//   expect(JSON.stringify(doc)).to.equal(JSON.stringify(doc2));
//   expect(doc._id.equals(doc2._id)).to.be.ok;
//   // process.exit(0)
//   expect(doc2.minKey instanceof MinKey).to.be.ok;
//   expect(doc2.maxKey instanceof MaxKey).to.be.ok;
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should correctly serialize Double value', function(done) {
//   var doc = {
//     value: new Double(34343.2222)
//   };
// 
//   var serialized_data = BSON.serialize(doc);
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
//   var doc2 = BSON.deserialize(serialized_data);
// 
//   expect(doc.value.valueOf(), doc2.value).to.be.ok;
//   expect(doc.value.value, doc2.value).to.be.ok;
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('ObjectId should correctly create objects', function(done) {
//   try {
//     ObjectId.createFromHexString('000000000000000000000001');
//     ObjectId.createFromHexString('00000000000000000000001');
//     expect(false).to.be.ok;
//   } catch (err) {
//     expect(err != null).to.be.ok;
//   }
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('ObjectId should correctly retrieve timestamp', function(done) {
//   var testDate = new Date();
//   var object1 = new ObjectId();
//   expect(Math.floor(testDate.getTime() / 1000)).to.equal(
//     Math.floor(object1.getTimestamp().getTime() / 1000)
//   );
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should Correctly throw error on bsonparser errors', function(done) {
//   var data = Buffer.alloc(3);
//   var parser = BSON;
// 
//   expect(() => {
//     parser.deserialize(data);
//   }).to.throw();
// 
//   data = Buffer.alloc(5);
//   data[0] = 0xff;
//   data[1] = 0xff;
//   expect(() => {
//     parser.deserialize(data);
//   }).to.throw();
// 
//   // Finish up
//   done();
// });
// 
// /**
//  * A simple example showing the usage of BSON.calculateObjectSize function returning the number of BSON bytes a javascript object needs.
//  *
//  * @_class bson
//  * @_function BSON.calculateObjectSize
//  * @ignore
//  */
// it('Should correctly calculate the size of a given javascript object', function(done) {
//   // Create a simple object
//   var doc = { a: 1, func: function() {} };
//   var bson = BSON;
//   // Calculate the size of the object without serializing the function
//   var size = bson.calculateObjectSize(doc, {
//     serializeFunctions: false
//   });
//   expect(12).to.equal(size);
//   // Calculate the size of the object serializing the function
//   size = bson.calculateObjectSize(doc, {
//     serializeFunctions: true
//   });
//   // Validate the correctness
//   expect(37).to.equal(size);
//   done();
// });
// 
// /**
//  * A simple example showing the usage of BSON.calculateObjectSize function returning the number of BSON bytes a javascript object needs.
//  *
//  * @_class bson
//  * @_function calculateObjectSize
//  * @ignore
//  */
// it('Should correctly calculate the size of a given javascript object using instance method', function(done) {
//   // Create a simple object
//   var doc = { a: 1, func: function() {} };
//   // Create a BSON parser instance
//   var bson = BSON;
//   // Calculate the size of the object without serializing the function
//   var size = bson.calculateObjectSize(doc, {
//     serializeFunctions: false
//   });
//   expect(12).to.equal(size);
//   // Calculate the size of the object serializing the function
//   size = bson.calculateObjectSize(doc, {
//     serializeFunctions: true
//   });
//   // Validate the correctness
//   expect(37).to.equal(size);
//   done();
// });
// 
// /**
//  * A simple example showing the usage of BSON.serializeWithBufferAndIndex function.
//  *
//  * @_class bson
//  * @_function BSON.serializeWithBufferAndIndex
//  * @ignore
//  */
// it('Should correctly serializeWithBufferAndIndex a given javascript object', function(done) {
//   // Create a simple object
//   var doc = { a: 1, func: function() {} };
//   var bson = BSON;
// 
//   // Calculate the size of the document, no function serialization
//   var size = bson.calculateObjectSize(doc, { serializeFunctions: false });
//   var buffer = Buffer.alloc(size);
//   // Serialize the object to the buffer, checking keys and not serializing functions
//   var index = bson.serializeWithBufferAndIndex(doc, buffer, {
//     serializeFunctions: false,
//     index: 0
//   });
// 
//   // Validate the correctness
//   expect(size).to.equal(12);
//   expect(index).to.equal(11);
// 
//   // Serialize with functions
//   // Calculate the size of the document, no function serialization
//   size = bson.calculateObjectSize(doc, {
//     serializeFunctions: true
//   });
//   // Allocate a buffer
//   buffer = Buffer.alloc(size);
//   // Serialize the object to the buffer, checking keys and not serializing functions
//   index = bson.serializeWithBufferAndIndex(doc, buffer, {
//     serializeFunctions: true,
//     index: 0
//   });
// 
//   // Validate the correctness
//   expect(37).to.equal(size);
//   expect(36).to.equal(index);
//   done();
// });
// 
// /**
//  * A simple example showing the usage of BSON.serializeWithBufferAndIndex function.
//  *
//  * @_class bson
//  * @_function serializeWithBufferAndIndex
//  * @ignore
//  */
// it('Should correctly serializeWithBufferAndIndex a given javascript object using a BSON instance', function(done) {
//   // Create a simple object
//   var doc = { a: 1, func: function() {} };
//   // Create a BSON parser instance
//   var bson = BSON;
//   // Calculate the size of the document, no function serialization
//   var size = bson.calculateObjectSize(doc, {
//     serializeFunctions: false
//   });
//   // Allocate a buffer
//   var buffer = Buffer.alloc(size);
//   // Serialize the object to the buffer, checking keys and not serializing functions
//   var index = bson.serializeWithBufferAndIndex(doc, buffer, {
//     serializeFunctions: false
//   });
// 
//   expect(size).to.equal(12);
//   expect(index).to.equal(11);
// 
//   // Serialize with functions
//   // Calculate the size of the document, no function serialization
//   size = bson.calculateObjectSize(doc, {
//     serializeFunctions: true
//   });
//   // Allocate a buffer
//   buffer = Buffer.alloc(size);
//   // Serialize the object to the buffer, checking keys and not serializing functions
//   index = bson.serializeWithBufferAndIndex(doc, buffer, {
//     serializeFunctions: true
//   });
//   // Validate the correctness
//   expect(size).to.equal(37);
//   expect(index).to.equal(36);
// 
//   done();
// });
// 
// /**
//  * A simple example showing the usage of BSON.serialize function returning serialized BSON Buffer object.
//  *
//  * @_class bson
//  * @_function BSON.serialize
//  * @ignore
//  */
// it('Should correctly serialize a given javascript object', function(done) {
//   // Create a simple object
//   var doc = { a: 1, func: function() {} };
//   // Create a BSON parser instance
//   var bson = BSON;
// 
//   var buffer = bson.serialize(doc, {
//     checkKeys: true,
//     serializeFunctions: false
//   });
// 
//   expect(buffer.length).to.equal(12);
// 
//   // Serialize the object to a buffer, checking keys and serializing functions
//   buffer = bson.serialize(doc, {
//     checkKeys: true,
//     serializeFunctions: true
//   });
//   // Validate the correctness
//   expect(buffer.length).to.equal(37);
// 
//   done();
// });
// 
// /**
//  * A simple example showing the usage of BSON.serialize function returning serialized BSON Buffer object.
//  *
//  * @_class bson
//  * @_function serialize
//  * @ignore
//  */
// it('Should correctly serialize a given javascript object using a bson instance', function(done) {
//   // Create a simple object
//   var doc = { a: 1, func: function() {} };
//   // Create a BSON parser instance
//   var bson = BSON;
// 
//   // Serialize the object to a buffer, checking keys and not serializing functions
//   var buffer = bson.serialize(doc, {
//     checkKeys: true,
//     serializeFunctions: false
//   });
//   // Validate the correctness
//   expect(buffer.length).to.equal(12);
// 
//   // Serialize the object to a buffer, checking keys and serializing functions
//   buffer = bson.serialize(doc, {
//     checkKeys: true,
//     serializeFunctions: true
//   });
//   // Validate the correctness
//   expect(37).to.equal(buffer.length);
// 
//   done();
// });
// 
// // /**
// //  * A simple example showing the usage of BSON.deserialize function returning a deserialized Javascript function.
// //  *
// //  * @_class bson
// //  * @_function BSON.deserialize
// //  * @ignore
// //  */
// //  it('Should correctly deserialize a buffer using the BSON class level parser', function(done) {
// //   // Create a simple object
// //   var doc = {a: 1, func:function(){ console.log('hello world'); }}
// //   // Create a BSON parser instance
// //   var bson = BSON;
// //   // Serialize the object to a buffer, checking keys and serializing functions
// //   var buffer = bson.serialize(doc, {
// //     checkKeys: true,
// //     serializeFunctions: true
// //   });
// //   // Validate the correctness
// //   expect(65).to.equal(buffer.length);
// //
// //   // Deserialize the object with no eval for the functions
// //   var deserializedDoc = bson.deserialize(buffer);
// //   // Validate the correctness
// //   expect('object').to.equal(typeof deserializedDoc.func);
// //   expect(1).to.equal(deserializedDoc.a);
// //
// //   // Deserialize the object with eval for the functions caching the functions
// //   deserializedDoc = bson.deserialize(buffer, {evalFunctions:true, cacheFunctions:true});
// //   // Validate the correctness
// //   expect('function').to.equal(typeof deserializedDoc.func);
// //   expect(1).to.equal(deserializedDoc.a);
// //   done();
// // }
// 
// // /**
// //  * A simple example showing the usage of BSON instance deserialize function returning a deserialized Javascript function.
// //  *
// //  * @_class bson
// //  * @_function deserialize
// //  * @ignore
// //  */
// // it('Should correctly deserialize a buffer using the BSON instance parser', function(done) {
// //   // Create a simple object
// //   var doc = {a: 1, func:function(){ console.log('hello world'); }}
// //   // Create a BSON parser instance
// //   var bson = BSON;
// //   // Serialize the object to a buffer, checking keys and serializing functions
// //   var buffer = bson.serialize(doc, true, true, true);
// //   // Validate the correctness
// //   expect(65).to.equal(buffer.length);
// //
// //   // Deserialize the object with no eval for the functions
// //   var deserializedDoc = bson.deserialize(buffer);
// //   // Validate the correctness
// //   expect('object').to.equal(typeof deserializedDoc.func);
// //   expect(1).to.equal(deserializedDoc.a);
// //
// //   // Deserialize the object with eval for the functions caching the functions
// //   deserializedDoc = bson.deserialize(buffer, {evalFunctions:true, cacheFunctions:true});
// //   // Validate the correctness
// //   expect('function').to.equal(typeof deserializedDoc.func);
// //   expect(1).to.equal(deserializedDoc.a);
// //   done();
// // }
// 
// // /**
// //  * A simple example showing the usage of BSON.deserializeStream function returning deserialized Javascript objects.
// //  *
// //  * @_class bson
// //  * @_function BSON.deserializeStream
// //  * @ignore
// //  */
// // it('Should correctly deserializeStream a buffer object', function(done) {
// //   // Create a simple object
// //   var doc = {a: 1, func:function(){ console.log('hello world'); }}
// //   var bson = BSON;
// //   // Serialize the object to a buffer, checking keys and serializing functions
// //   var buffer = bson.serialize(doc, {
// //     checkKeys: true,
// //     serializeFunctions: true
// //   });
// //   // Validate the correctness
// //   expect(65).to.equal(buffer.length);
// //
// //   // The array holding the number of retuned documents
// //   var documents = new Array(1);
// //   // Deserialize the object with no eval for the functions
// //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0);
// //   // Validate the correctness
// //   expect(65).to.equal(index);
// //   expect(1).to.equal(documents.length);
// //   expect(1).to.equal(documents[0].a);
// //   expect('object').to.equal(typeof documents[0].func);
// //
// //   // Deserialize the object with eval for the functions caching the functions
// //   // The array holding the number of retuned documents
// //   var documents = new Array(1);
// //   // Deserialize the object with no eval for the functions
// //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0, {evalFunctions:true, cacheFunctions:true});
// //   // Validate the correctness
// //   expect(65).to.equal(index);
// //   expect(1).to.equal(documents.length);
// //   expect(1).to.equal(documents[0].a);
// //   expect('function').to.equal(typeof documents[0].func);
// //   done();
// // }
// 
// // /**
// //  * A simple example showing the usage of BSON instance deserializeStream function returning deserialized Javascript objects.
// //  *
// //  * @_class bson
// //  * @_function deserializeStream
// //  * @ignore
// //  */
// // it('Should correctly deserializeStream a buffer object', function(done) {
// //   // Create a simple object
// //   var doc = {a: 1, func:function(){ console.log('hello world'); }}
// //   // Create a BSON parser instance
// //   var bson = BSON;
// //   // Serialize the object to a buffer, checking keys and serializing functions
// //   var buffer = bson.serialize(doc, true, true, true);
// //   // Validate the correctness
// //   expect(65).to.equal(buffer.length);
// //
// //   // The array holding the number of retuned documents
// //   var documents = new Array(1);
// //   // Deserialize the object with no eval for the functions
// //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0);
// //   // Validate the correctness
// //   expect(65).to.equal(index);
// //   expect(1).to.equal(documents.length);
// //   expect(1).to.equal(documents[0].a);
// //   expect('object').to.equal(typeof documents[0].func);
// //
// //   // Deserialize the object with eval for the functions caching the functions
// //   // The array holding the number of retuned documents
// //   var documents = new Array(1);
// //   // Deserialize the object with no eval for the functions
// //   var index = bson.deserializeStream(buffer, 0, 1, documents, 0, {evalFunctions:true, cacheFunctions:true});
// //   // Validate the correctness
// //   expect(65).to.equal(index);
// //   expect(1).to.equal(documents.length);
// //   expect(1).to.equal(documents[0].a);
// //   expect('function').to.equal(typeof documents[0].func);
// //   done();
// // }
// 
// it('should properly deserialize multiple documents using deserializeStream', function() {
//   const bson = BSON;
//   const docs = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'quux' }];
// 
//   // Serialize the test data
//   const serializedDocs = [];
//   for (let i = 0; i < docs.length; i++) {
//     serializedDocs[i] = bson.serialize(docs[i]);
//   }
//   const buf = Buffer.concat(serializedDocs);
// 
//   const parsedDocs = [];
//   bson.deserializeStream(buf, 0, docs.length, parsedDocs, 0);
// 
//   docs.forEach((doc, i) => expect(doc).to.deep.equal(parsedDocs[i]));
// });
// 
// /**
//  * @ignore
//  */
// it('ObjectId should have a correct cached representation of the hexString', function(done) {
//   ObjectId.cacheHexString = true;
//   var a = new ObjectId();
//   var __id = a.__id;
//   expect(__id).to.equal(a.toHexString());
// 
//   // hexString
//   a = new ObjectId(__id);
//   expect(__id).to.equal(a.toHexString());
// 
//   // fromHexString
//   a = ObjectId.createFromHexString(__id);
//   expect(a.__id).to.equal(a.toHexString());
//   expect(__id).to.equal(a.toHexString());
// 
//   // number
//   var genTime = a.generationTime;
//   a = new ObjectId(genTime);
//   __id = a.__id;
//   expect(__id).to.equal(a.toHexString());
// 
//   // generationTime
//   delete a.__id;
//   a.generationTime = genTime;
//   expect(__id).to.equal(a.toHexString());
// 
//   // createFromTime
//   a = ObjectId.createFromTime(genTime);
//   __id = a.__id;
//   expect(__id).to.equal(a.toHexString());
//   ObjectId.cacheHexString = false;
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should fail to create ObjectId due to illegal hex code', function(done) {
//   try {
//     new ObjectId('zzzzzzzzzzzzzzzzzzzzzzzz');
//     expect(false).to.be.ok;
//   } catch (err) {
//     expect(true).to.be.ok;
//   }
// 
//   expect(false).to.equal(ObjectId.isValid(null));
//   expect(false).to.equal(ObjectId.isValid({}));
//   expect(false).to.equal(ObjectId.isValid({ length: 12 }));
//   expect(false).to.equal(ObjectId.isValid([]));
//   expect(false).to.equal(ObjectId.isValid(true));
//   expect(true).to.equal(ObjectId.isValid(0));
//   expect(false).to.equal(ObjectId.isValid('invalid'));
//   expect(true).to.equal(ObjectId.isValid('zzzzzzzzzzzz'));
//   expect(false).to.equal(ObjectId.isValid('zzzzzzzzzzzzzzzzzzzzzzzz'));
//   expect(true).to.equal(ObjectId.isValid('000000000000000000000000'));
//   expect(true).to.equal(ObjectId.isValid(new ObjectId('thisis12char')));
// 
//   var tmp = new ObjectId();
//   // Cloning tmp so that instanceof fails to fake import from different version/instance of the same npm package
//   var objectIdLike = {
//     id: tmp.id,
//     toHexString: function() {
//       return tmp.toHexString();
//     }
//   };
// 
//   expect(true).to.equal(tmp.equals(objectIdLike));
//   expect(true).to.equal(tmp.equals(new ObjectId(objectIdLike)));
//   expect(true).to.equal(ObjectId.isValid(objectIdLike));
// 
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should correctly serialize the BSONRegExp type', function(done) {
//   var doc = { regexp: new BSONRegExp('test', 'i') };
//   var doc1 = { regexp: /test/i };
//   var serialized_data = BSON.serialize(doc);
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   doc1 = BSON.deserialize(serialized_data);
//   var regexp = new RegExp('test', 'i');
//   expect(regexp).to.deep.equal(doc1.regexp);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should correctly deserialize the BSONRegExp type', function(done) {
//   var doc = { regexp: new BSONRegExp('test', 'i') };
//   var serialized_data = BSON.serialize(doc);
// 
//   var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//   BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//   assertBuffersEqual(done, serialized_data, serialized_data2, 0);
// 
//   var doc1 = BSON.deserialize(serialized_data, { bsonRegExp: true });
//   expect(doc1.regexp instanceof BSONRegExp).to.be.ok;
//   expect('test').to.equal(doc1.regexp.pattern);
//   expect('i').to.equal(doc1.regexp.options);
//   done();
// });
// 
// /**
//  * @ignore
//  */
// it('Should return boolean for ObjectId equality check', function(done) {
//   var id = new ObjectId();
//   expect(true).to.equal(id.equals(new ObjectId(id.toString())));
//   expect(true).to.equal(id.equals(id.toString()));
//   expect(false).to.equal(id.equals('1234567890abcdef12345678'));
//   expect(false).to.equal(id.equals('zzzzzzzzzzzzzzzzzzzzzzzz'));
//   expect(false).to.equal(id.equals('foo'));
//   expect(false).to.equal(id.equals(null));
//   expect(false).to.equal(id.equals(undefined));
//   done();
// });
// 
// it('should serialize ObjectIds from old bson versions', function() {
//   // In versions 4.0.0 and 4.0.1, we used _bsontype="ObjectId" which broke
//   // backwards compatibility with mongodb-core and other code. It was reverted
//   // back to "ObjectID" (capital D) in later library versions.
//   // The test below ensures that all three versions of Object ID work OK:
//   // 1. The current version's class
//   // 2. A simulation of the class from library 4.0.0
//   // 3. The class currently in use by mongodb (not tested in browser where mongodb is unavailable)
// 
//   // test the old ObjectID class (in mongodb-core 3.1) because MongoDB drivers still return it
//   function getOldBSON() {
//     try {
//       // do a dynamic resolve to avoid exception when running browser tests
//       const file = require.resolve('mongodb-core');
//       const oldModule = require(file).BSON;
//       const funcs = new oldModule.BSON();
//       oldModule.serialize = funcs.serialize;
//       oldModule.deserialize = funcs.deserialize;
//       return oldModule;
//     } catch (e) {
//       return BSON; // if mongo is unavailable, e.g. browser tests, just re-use new BSON
//     }
//   }
// 
//   const OldBSON = getOldBSON();
//   const OldObjectID = OldBSON === BSON ? BSON.ObjectId : OldBSON.ObjectID;
// 
//   // create a wrapper simulating the old ObjectId class from v4.0.0
//   class ObjectIdv400 {
//     constructor() {
//       this.oid = new ObjectId();
//     }
//     get id() {
//       return this.oid.id;
//     }
//     toString() {
//       return this.oid.toString();
//     }
//   }
//   Object.defineProperty(ObjectIdv400.prototype, '_bsontype', { value: 'ObjectId' });
// 
//   // Array
//   const array = [new ObjectIdv400(), new OldObjectID(), new ObjectId()];
//   const deserializedArrayAsMap = BSON.deserialize(BSON.serialize(array));
//   const deserializedArray = Object.keys(deserializedArrayAsMap).map(
//     x => deserializedArrayAsMap[x]
//   );
//   expect(deserializedArray.map(x => x.toString())).to.eql(array.map(x => x.toString()));
// 
//   // Map
//   const map = new Map();
//   map.set('oldBsonType', new ObjectIdv400());
//   map.set('reallyOldBsonType', new OldObjectID());
//   map.set('newBsonType', new ObjectId());
//   const deserializedMapAsObject = BSON.deserialize(BSON.serialize(map), { relaxed: false });
//   const deserializedMap = new Map(
//     Object.keys(deserializedMapAsObject).map(k => [k, deserializedMapAsObject[k]])
//   );
// 
//   map.forEach((value, key) => {
//     expect(deserializedMap.has(key)).to.be.true;
//     const deserializedMapValue = deserializedMap.get(key);
//     expect(deserializedMapValue.toString()).to.equal(value.toString());
//   });
// 
//   // Object
//   const record = {
//     oldBsonType: new ObjectIdv400(),
//     reallyOldBsonType: new OldObjectID(),
//     newBsonType: new ObjectId()
//   };
//   const deserializedObject = BSON.deserialize(BSON.serialize(record));
//   expect(deserializedObject).to.have.keys(['oldBsonType', 'reallyOldBsonType', 'newBsonType']);
//   expect(record.oldBsonType.toString()).to.equal(deserializedObject.oldBsonType.toString());
//   expect(record.newBsonType.toString()).to.equal(deserializedObject.newBsonType.toString());
// });
// 
// it('should throw if invalid BSON types are input to BSON serializer', function() {
//   const oid = new ObjectId('111111111111111111111111');
//   const badBsonType = Object.assign({}, oid, { _bsontype: 'bogus' });
//   const badDoc = { bad: badBsonType };
//   const badArray = [oid, badDoc];
//   const badMap = new Map([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
//   expect(() => BSON.serialize(badDoc)).to.throw();
//   expect(() => BSON.serialize(badArray)).to.throw();
//   expect(() => BSON.serialize(badMap)).to.throw();
// });


////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////7
/////////////////////////////////////////////////////////////////////////




// const corruptTestVectors : { [key:string]: any}[] = JSON.parse(
//   decode(Deno.readFileSync("./bson_corrupt_test_vectors.json") ,"utf8")
// )
// 
// const validTestVectors : { [key:string]: any}[] = JSON.parse(
//   decode(Deno.readFileSync("./bson_valid_test_vectors.json") ,"utf8")
// )
// 
// // Translate extended json to correctly typed doc
// function translate(doc: { [key:string]: any}, object: { [key:string]: any}) : { [key:string]: any} {
//   for (let name in doc) {
//     if (
//       typeof doc[name] === 'number' ||
//       typeof doc[name] === 'string' ||
//       typeof doc[name] === 'boolean'
//     ) {
//       object[name] = doc[name];
//     } else if (Array.isArray(doc[name])) {
//       object[name] = translate(doc[name], []);
//     } else if (doc[name]['$numberLong']) {
//       object[name] = Long.fromString(doc[name]['$numberLong']);
//     } else if (doc[name]['$undefined']) {
//       object[name] = null;
//     } else if (doc[name]['$date']) {
//       const date = new Date();
//       date.setTime(parseInt(doc[name]['$date']['$numberLong'], 10));
//       object[name] = date;
//     } else if (doc[name]['$regexp']) {
//       object[name] = new RegExp(doc[name]['$regexp'], doc[name]['$options'] || '');
//     } else if (doc[name]['$oid']) {
//       object[name] = new ObjectId(doc[name]['$oid']);
//     } else if (doc[name]['$binary']) {
//       object[name] = new Binary(doc[name]['$binary'], doc[name]['$type'] || 1);
//     } else if (doc[name]['$timestamp']) {
//       object[name] = Timestamp.fromBits(
//         parseInt(doc[name]['$timestamp']['t'], 10),
//         parseInt(doc[name]['$timestamp']['i'])
//       );
//     } else if (doc[name]['$ref']) {
//       object[name] = new DBRef(doc[name]['$ref'], doc[name]['$id'], doc[name]['$db']);
//     } else if (doc[name]['$minKey']) {
//       object[name] = new MinKey();
//     } else if (doc[name]['$maxKey']) {
//       object[name] = new MaxKey();
//     } else if (doc[name]['$code']) {
//       object[name] = new Code(doc[name]['$code'], doc[name]['$scope'] || {});
//     } else if (doc[name] != null && typeof doc[name] === 'object') {
//       object[name] = translate(doc[name], {});
//     }
//   }
// 
//   return object;
// }
// 
// test({
//   name: "all corrupt BSON scenarios",
//   fn(): void {
//     for (const corruptTestVector of corruptTestVectors) {
//       assertThrows(() => BSON.deserialize(encode(corruptTestVector.encoded, "hex")))
//     }
//   }
// })
// 
// test({
//   name: "all valid BSON scenarios",
//   fn():void {
//     /*
//     // Iterate over all the results
//     scenarios.documents.forEach(function(doc) {
//       if (doc.skip) return;
//       // Create a buffer containing the payload
//       const expectedData = Buffer.from(doc.encoded, 'hex');
//       // Get the expectedDocument
//       const expectedDocument = translate(doc.document, {});
//       // Serialize to buffer
//       const buffer = BSON.serialize(expectedDocument);
//       // Validate the output
//       expect(expectedData.toString('hex')).to.equal(buffer.toString('hex'));
//       // Attempt to deserialize
//       const object = BSON.deserialize(buffer, { promoteLongs: false });
//       // // Validate the object
//       expect(JSON.stringify(expectedDocument)).to.deep.equal(JSON.stringify(object));
//     });
//     */
//     let expectedBson: Uint8Array;
//     let expectedDoc: { [key:string]: any};
//     let bson: Uint8Array;
//     let doc: { [key:string]: any};
//     for (const validTestVector of validTestVectors) {
//       // assertThrows(() => BSON.deserialize(encode(corruptTestVector.encoded, "hex")))
//       expectedBson = encode(validTestVector.encoded, "hex");
//       expectedDoc = translate(validTestVector.document, {});
//       bson = BSON.serialize(expectedDoc);
//       /////////
//       console.error("bson", String(bson), "expectedBson", String(expectedBson));
//       ////////
//       assertEquals(bson, expectedBson);
//       doc = BSON.deserialize(bson, {promoteLongs: false});
//       assertEquals(doc, expectedDoc);
//     }
//   }
// })


runIfMain(import.meta)
