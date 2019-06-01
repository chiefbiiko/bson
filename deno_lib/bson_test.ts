import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assert, assertEquals, assertThrows } from "https://deno.land/x/testing/asserts.ts";
import { Long } from "./long/mod.ts"
import { Double } from "./double.ts"
import { Timestamp } from "./timestamp.ts"
import {ObjectId } from "./object_id.ts"
import { DateTime } from "./datetime.ts"
import {BSONRegExp} from "./regexp.ts"
import {Int32} from "./int32.ts"
import {Code} from "./code.ts"
import {Decimal128} from "./decimal128.ts"
import {MinKey} from "./min_key.ts"
import {MaxKey} from "./max_key.ts"
import { DBRef} from "./db_ref.ts"
import {Binary} from "./binary.ts"
import { serialize, serializeInto, deserialize, deserializeStream, calculateObjectSize, BSON_INT32_MAX, BSON_BINARY_SUBTYPE_BYTE_ARRAY, BSON_BINARY_SUBTYPE_USER_DEFINED, JS_INT_MAX, BSON_INT64_MAX } from "./bson.ts"
import { encode } from "./transcoding.ts"

test({
  name: 'calculate the bson size of a given javascript object', fn():void {
    const doc : { [key:string]: any}= { a: 1, func: function() {} };
    let size: number = calculateObjectSize(doc, {
      serializeFunctions: false
    });
    assertEquals(size, 12)
    size = calculateObjectSize(doc, {
      serializeFunctions: true
    });
      assertEquals(size, 38)
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
  name:'serialize and deserialize an embedded array', fn():void {
    const expected_doc: {[key:string]: any}  = {
      a: 0,
      b: {
        c: [
          'tmp1',
          'tmp2',
          'tmp3',
          'tmp4',
          'tmp5',
          'tmp6',
          'tmp7',
          'tmp8',
          'tmp9',
          'tmp10',
          'tmp11',
          'tmp12',
          'tmp13',
          'tmp14',
          'tmp15',
          'tmp16'
        ]
      }
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
  name: 'serialized subtyped binary deserializes as Uint8Array by default', fn():void {
    const input_doc: {[key:string]: any} = { buf: new Binary(Uint8Array.from([36, 44, 99, 255]), BSON_BINARY_SUBTYPE_BYTE_ARRAY) };
    const expected_doc: {[key:string]: any} = { buf: Uint8Array.from([36, 44, 99, 255]) };
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    assert(doc.buf instanceof Uint8Array)
    const buf: Uint8Array = new Uint8Array(bson.byteLength)
    serializeInto(buf, input_doc)
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
  name: 'optionally roundtrip user defined binaries without promotion', fn():void {
    const expected_doc: {[key:string]: any} = { buf: new Binary(Uint8Array.from([36, 44, 99, 255]), BSON_BINARY_SUBTYPE_USER_DEFINED) };
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
  name: 'serialize and deserialize dates lossless', fn():void{
    const date : Date = new Date(Date.parse('2011-10-02T14:00:08.383Z'))
    const expected_doc: {[key:string]: any}  = {
      _id: new ObjectId('4e886e687ff7ef5e00000162'),
            date,
                  type: 2,
      foreign: 'local',

      links: [
        'http://www.reddit.com/r/worldnews/comments/kybm0/uk_home_secretary_calls_for_the_scrapping_of_the/'
      ]
    };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
        assertEquals(doc.date.getTime(), expected_doc.date.getTime())
    assertEquals(JSON.stringify(doc), JSON.stringify(expected_doc))
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize a js date', fn(): void {
    const date: Date = new Date();
    date.setUTCDate(12);
    date.setUTCFullYear(2009);
    date.setUTCMonth(11 - 1);
    date.setUTCHours(12);
    date.setUTCMinutes(0);
    date.setUTCSeconds(30);
    date.setUTCMilliseconds(166)
    const expected_doc: {[key:string]: any} = { date };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(bson.byteLength)
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialized datetime deserializes as js date', fn(): void {
    const date: Date = new Date();
    date.setUTCDate(12);
    date.setUTCFullYear(2009);
    date.setUTCMonth(11 - 1);
    date.setUTCHours(12);
    date.setUTCMinutes(0);
    date.setUTCSeconds(30);
    date.setUTCMilliseconds(166)
    const ms: string = "1258027230166"
    const input_doc: {[key:string]: any} = { date: new DateTime(ms) };
    const expected_doc: {[key:string]: any} = { date };
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(bson.byteLength)
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'optionally roundripping datetime', fn(): void {
    const ms: string = "1258027230166"
    const expected_doc: {[key:string]: any} = { date: new DateTime(ms) };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson, {promoteValues: false})
    assertEquals(doc, expected_doc)
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
  name: 'convert object id to itself', 
  fn():void {
    const a: ObjectId = new ObjectId();
    const b: ObjectId = new ObjectId(a);
    assert(b.equals(a))
    assertEquals(b, a)
  }
});

test({
  name: 'ObjectId.fromHexString validates string input', fn():void {
   assertThrows(():void => { ObjectId.fromHexString('00000000000000000000023') })
  }
});

test({
  name: 'ObjectId should correctly retrieve timestamp', fn():void {
    const date: Date = new Date();
    const oid: ObjectId = new ObjectId();
assertEquals(Math.floor(date.getTime() / 1000), oid.getTimestamp().getTime() / 1000)
  }
});

test({
  name: 'ObjectId.isValid validates strings, Uint8Arrays, and ObjectIds', fn():void {
    assert(!ObjectId.isValid(null))
    assert(!ObjectId.isValid("invalid"))
    assert(!ObjectId.isValid('zzzzzzzzzzzzzzzzzzzzzzzz'))
            assert(!ObjectId.isValid(-1))
                    assert(!ObjectId.isValid(2.2))
                    assert(!ObjectId.isValid(NaN))
                    assert(!ObjectId.isValid(Infinity))
        assert(ObjectId.isValid(0))
    assert(ObjectId.isValid('000000000000000000000000'))
        assert(ObjectId.isValid(encode('000000000000000000000000', "hex")))
    assert(ObjectId.isValid(new ObjectId(encode('thisis12char', "utf8"))))
  }
});

test({
  name: 'ObjectId equality check', fn():void {
    const oid: ObjectId = new ObjectId();
            assert(oid.equals(new ObjectId(oid.toString("hex"))))
    assert(oid.equals(new ObjectId(oid.toString())))
            assert(oid.equals(oid.toString("hex")))
    assert(!oid.equals('1234567890abcdef12345678'))
        assert(!oid.equals('zzzzzzzzzzzzzzzzzzzzzzzz'))
    assert(!oid.equals('fraud'))
        assert(!oid.equals(null))
        assert(!oid.equals(undefined))
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
  name: 'serialize and deserialize doc with number keys', fn():void {
    const expected_doc: {[key:string]: any} = { 1:1, 2:2 };
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
    const expected_doc: {[key:string]: any} = { z:3, a: 5, b:9 };
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

test({
  name: 'serialized BSONRegExp deserializes as RegExp by default', fn():void {
    const input_doc: {[key:string]: any}  = { rex: new BSONRegExp('test', 'i')};
  const expected_doc: {[key:string]: any}  = { rex: new RegExp('test', 'i')};
const bson: Uint8Array = serialize(input_doc)
const doc: {[key:string]: any} = deserialize(bson)
assertEquals(doc, expected_doc)
const buf: Uint8Array = new Uint8Array(calculateObjectSize(input_doc))
serializeInto(buf, input_doc)
assertEquals(buf, bson);
  }
});

test({
  name: 'optionally not promote BSONRegExp to RegExp', fn():void {
  const expected_doc: {[key:string]: any}  = { rex: new BSONRegExp('test', 'i')};
const bson: Uint8Array = serialize(expected_doc)
const doc: {[key:string]: any} = deserialize(bson, {promoteValues: false})
assertEquals(doc, expected_doc)
const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
serializeInto(buf, doc)
assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize dbref', fn():void {
    const expected_doc: {[key:string]: any} = { dbref: new DBRef('collection', new ObjectId()) };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc.dbref.toString(), expected_doc.dbref.toString())
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize long', fn():void {
  let expected_doc: { [key:string]: any} = { long: Long.fromNumber(9223372036854775807) };
    let bson: Uint8Array = serialize(expected_doc);
    let doc: { [key:string]: any} = deserialize(bson);
    assertEquals(doc, expected_doc)
    expected_doc = { long: Long.fromNumber(-9223372036854775) };
    bson = serialize(expected_doc);
    doc = deserialize(bson);
    assertEquals(doc, expected_doc)
    expected_doc = { long: Long.fromNumber(-9223372036854775809) };
    bson = serialize(expected_doc);
    doc = deserialize(bson);
    assertEquals(doc, expected_doc)
  }
});

test({
  name: 'deserialize large integers as number not long', fn(): void {
    function roundTrip(val: any): void {
      const expected_doc: {[key:string]: any} = { val };
      const bson: Uint8Array = serialize(expected_doc)
      const doc: {[key:string]: any} = deserialize(bson)
      assertEquals(doc, expected_doc)
      const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
      serializeInto(buf, doc)
      assertEquals(buf, bson);
    }
    roundTrip(Math.pow(2, 52));
    roundTrip(Math.pow(2, 53) - 1);
    roundTrip(Math.pow(2, 53));
    roundTrip(-Math.pow(2, 52));
    roundTrip(-Math.pow(2, 53) + 1);
    roundTrip(-Math.pow(2, 53));
    roundTrip(Math.pow(2, 65)); // Too big for Long.
    roundTrip(-Math.pow(2, 65));
    roundTrip(9223372036854775807);
    roundTrip(1234567890123456800); // Bigger than 2^53, stays a double.
    roundTrip(-1234567890123456800);
  }
});

test({
  name: 'serialize and deserialize timestamp as subclass of long', fn():void {
    const long: Long = Long.fromNumber(9223372036854775807);
    const timestamp: Timestamp = Timestamp.fromNumber(9223372036854775807);
    assert(long instanceof Long)
    assert(!(long instanceof Timestamp))
    assert(timestamp instanceof Timestamp)
    assert(timestamp instanceof Long)
    const expected_doc: { [key:string]: any} = {long, timestamp}
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and dedserialize a code object', fn():void {
    const expected_doc: {[key:string]: any} = { bad: { code: new Code('this.a > i', { f: 419 }) } };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    assertEquals(doc.bad.code.scope.f, expected_doc.bad.code.scope.f)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({name: 'serialize and deserialize utf8', fn():void {
  const expected_doc: {[key:string]: any} =  {
    name: '本荘由利地域に洪水警報',
    name1: 'öüóőúéáűíÖÜÓŐÚÉÁŰÍ',
    name2: 'abcdedede',
    name3: '本荘由利地域に洪水警報',
    name4: 'abcdedede',
    本荘由利地域に洪水警報: '本荘由利地域に洪水警報',
    本荘由利地本荘由利地: {
      本荘由利地域に洪水警報: '本荘由利地域に洪水警報',
      地域に洪水警報本荘由利: '本荘由利地域に洪水警報',
      洪水警報本荘地域に洪水警報本荘由利: '本荘由利地域に洪水警報'
    }
  };
  const bson: Uint8Array = serialize(expected_doc)
  const doc: {[key:string]: any} = deserialize(bson)
  assertEquals(doc, expected_doc)
  const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
  serializeInto(buf, doc)
  assertEquals(buf, bson);
}});

test({
  name: 'serialize and deserialize query object', fn():void {
      const expected_doc: {[key:string]: any} = { count: 'remove_with_no_callback_bug_test', query: {}, fields: null };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});


test({
  name: 'serialized symbol deserializes as string by default', fn(): void {
    const input_doc: {[key:string]: any} = { symbol: Symbol("deprecated") };
    const expected_doc: {[key:string]: any} = { symbol: "deprecated" };
  const bson: Uint8Array = serialize(input_doc)
  const doc: {[key:string]: any} = deserialize(bson)
  assertEquals(doc, expected_doc)
  const buf: Uint8Array = new Uint8Array(bson.byteLength)
  serializeInto(buf, input_doc)
  assertEquals(buf, bson);
  }
});

test({
  name: 'optionally deserialize symbol as is', fn(): void {
    let expected_doc: {[key:string]: any} = { symbol: Symbol("deprecated") };
  let bson: Uint8Array = serialize(expected_doc)
  let doc: {[key:string]: any} = deserialize(bson, { promoteValues: false})
  assertEquals(doc.symbol.toString(), expected_doc.symbol.toString())
  let buf: Uint8Array = new Uint8Array(bson.byteLength)
  serializeInto(buf, doc)
  assertEquals(buf, bson);
  }
});

test({
  name: 'serialize and deserialize deeply nested document', fn():void {
    const expected_doc: {[key:string]: any} = { a: { b: { c: { d: 2 } } } };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});

test({name:
  'serialize and deserialize complicated all typed object', fn():void {
    const date: Date = new Date();
    const oid: ObjectId = new ObjectId();
     const bin: Uint8Array = encode("binstring", "utf8")
    const input_doc: {[key:string]: any} = {
      string: 'hello',
      array: [1, 2, 3],
      hash: { a: 1, b: 2 },
      date: date,
      oid: oid,
      binary: new Binary(bin),
      decimal: Decimal128.fromString("4444444444499994111111119999999.00419000419"),
      int32: new Int32(32),
      int: 42,
      float: 33.3333,
      regexp: /regexp/,
      boolean: true,
      long: date.getTime(),
      where: new Code('this.a > i', { i: 1 }),
      dbref: new DBRef('namespace', oid, 'integration_tests_')
    };
    const expected_doc: {[key:string]: any} = {...input_doc, binary: bin, int32: 32}
    let bson: Uint8Array = serialize(input_doc)
    let doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
    bson = serialize(expected_doc)
    doc =  deserialize(bson)
        assertEquals(doc, expected_doc)
        serializeInto(buf, doc)
        assertEquals(buf, bson);
  }})
  


test({ 
  name: 'Should Correctly Serialize Complex Nested Object', fn():void {
      const expected_doc: {[key:string]: any} = {
      email: 'email@email.com',
      encrypted_password: 'password',
      friends: ['4db96b973d01205364000006', '4dc77b24c5ba38be14000002'],
      location: [72.4930088, 23.0431957],
      name: 'Amit Kumar',
      password_salt: 'salty',
      profile_fields: [],
      username: 'amit',
      _id: new ObjectId()
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
  name: 'serialize and deserialize cross references', fn():void {
    const oid1: ObjectId = new ObjectId();
    const oid2: ObjectId = new ObjectId();
    const expected_doc1: {[key:string]: any}  = {
      dbref: new DBRef('collection', oid2.toString("hex"), 'test'),
      _id: oid1
    };
    const expected_doc2: {[key:string]: any}  = {
      dbref: new DBRef( 'collection',   oid1.toString("hex"), 'test' ),
      _id: ObjectId.fromHexString(oid2.toString("hex"))
    };
    const bson1: Uint8Array = serialize(expected_doc1)
    const doc1: {[key:string]: any} = deserialize(bson1)
    assertEquals(doc1.dbref, expected_doc1.dbref)
        const buf: Uint8Array = new Uint8Array(bson1.byteLength)
    serializeInto(buf, doc1)
    assertEquals(buf, bson1);
    const bson2: Uint8Array = serialize(expected_doc2)
    const doc2: {[key:string]: any}  = deserialize(bson2)
        assertEquals(doc2.dbref, expected_doc2.dbref)
    serializeInto(buf, doc2)
    assertEquals(buf, bson2);
    assertEquals(doc1.dbref.oid.toString("hex"), doc2._id.toString("hex"))
    assertEquals(doc2.dbref.oid.toString("hex"), doc1._id.toString("hex"))
  }
});

test({name: 'serialize and deserialize regexp with special chars', fn():void {
    const expected_doc: {[key:string]: any}  = { b: /foobaré/ };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
}});

test({name:'serialize and deserialize complicated object', fn():void{
  const expected_doc: {[key:string]: any}  = { a: { b: { c: [new ObjectId(), new ObjectId()] } }, d: { f: 1332.3323 } };
  const bson: Uint8Array = serialize(expected_doc)
  const doc: {[key:string]: any} = deserialize(bson)
  assertEquals(doc, expected_doc)
  const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
  serializeInto(buf, doc)
  assertEquals(buf, bson);
}});

test({
  name:'serialize and deserialize yet another nested object', fn():void {
    const expected_doc: {[key:string]: any}  = {
      _id: { date: new Date(), gid: '6f35f74d2bea814e21000000' },
      value: {
        b: { countries: { '--': 386 }, total: 1599 },
        bc: { countries: { '--': 3 }, total: 10 },
        gp: { countries: { '--': 2 }, total: 13 },
        mgc: { countries: { '--': 2 }, total: 14 }
      }
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
  name: 'serialize and deserialize nested object with even more nesting', fn():void {
    const expected_doc: {[key:string]: any}  = {
      _id: { date: { a: 1, b: 2, c: new Date() }, gid: '6f35f74d2bea814e21000000' },
      value: {
        b: { countries: { '--': 386 }, total: 1599 },
        bc: { countries: { '--': 3 }, total: 10 },
        gp: { countries: { '--': 2 }, total: 13 },
        mgc: { countries: { '--': 2 }, total: 14 }
      }
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
  name: 'serialize and deserialize empty name object', fn():void {
      const expected_doc: {[key:string]: any}  = {
      '': 'test',
      bbbb: 1
    };
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
    assertEquals(doc[""], "test")
    assertEquals(doc.bbbb, 1)
  }
});

test({
  name: 'serialized double desereializes as number by default', fn():void {
    // if (Double != null) {
        const input_doc: {[key:string]: any}  = { value: new Double(100)};
      const expected_doc: {[key:string]: any}  = { value: 100};
    const bson: Uint8Array = serialize(input_doc)
    const doc: {[key:string]: any} = deserialize(bson)
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(input_doc))
    serializeInto(buf, input_doc)
    assertEquals(buf, bson);
  }
});

test({
  name: 'optionally deserializing double as double', fn():void {
        const expected_doc: {[key:string]: any}  = { value: new Double(100)};
    const bson: Uint8Array = serialize(expected_doc)
    const doc: {[key:string]: any} = deserialize(bson, { promoteValues: false})
    assertEquals(doc, expected_doc)
    const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
    serializeInto(buf, doc)
    assertEquals(buf, bson);
  }
});



test({
  name: 'serialize and deserialize MinKey and MaxKey values', fn():void {
    const expected_doc: {[key:string]: any}  = {     _id: new ObjectId('4e886e687ff7ef5e00000162'),
        minKey: new MinKey(),
        maxKey: new MaxKey()};
  const bson: Uint8Array = serialize(expected_doc)
  const doc: {[key:string]: any} = deserialize(bson)
  assert(doc.minKey instanceof MinKey)
  assert(doc.maxKey instanceof MaxKey)
  assertEquals(JSON.stringify(doc), JSON.stringify(expected_doc))
  const buf: Uint8Array = new Uint8Array(calculateObjectSize(doc))
  serializeInto(buf, doc)
  assertEquals(buf, bson);
  }
});

test({
  name: "deserializes min or max keys compare as expected", 
  fn():void {
    const expected_doc: {[key:string]: any}  = {     _id: new ObjectId('4e886e687ff7ef5e00000162'),
        minKey: new MinKey(),
        maxKey: new MaxKey()};
  const bson: Uint8Array = serialize(expected_doc)
  const doc: {[key:string]: any} = deserialize(bson)
  for (let i: number = 1e6; i > -1; --i) {
    let r : number = Math.floor(Math.random() * JS_INT_MAX)
    assert(doc.minKey.value.lessThan(r * -1))
    assert(doc.maxKey.value.greaterThan(r))
    r = Math.floor(Math.random() * BSON_INT64_MAX)
    assert(doc.minKey.value.lessThan(r * -1))
    assert(doc.maxKey.value.greaterThan(r))
  }
  }
})

test({
  name: 'deserialize throws on invalid bson', fn():void {
  assertThrows(():void => { deserialize(new Uint8Array(3))})
assertThrows(():void => { deserialize(new Uint8Array(5).fill(255, 0, 2))})
  }
});

test({
  name: 'should throw if invalid BSON types are input to BSON serializer', fn():void {
    const badBsonType: { [key:string]: any} = { _bsontype: Symbol('bogus') }
    const badDoc:  { [key:string]: any} = { bad: badBsonType };
    const badArray = [badBsonType, badDoc];
    const badMap: Map<string,any> = new Map([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
    assertThrows(() :void => { serialize(badDoc)})
    assertThrows(() :void => { serialize(badArray)})
    assertThrows(() :void => { serialize(badMap)})
  }
});

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

test({
  name: 'deserialize multiple documents using deserializeStream', fn():void {
    const expected_docs: {[key:string]: any}[] = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'quux' }];
    // concat buffers :\
    const bson_arr: Uint8Array[] = expected_docs.map((d: { [key:string]: any}): Uint8Array => serialize(d))
    const size: number = bson_arr.reduce((acc, cur): number =>acc + cur.byteLength, 0)
    let offset: number = 0
    const bson: Uint8Array = new Uint8Array(size)
    for (const b of bson_arr) {
      bson.set(b, offset)
      offset += b.byteLength;
    }
    const result: {index: number, docs: any[]} = deserializeStream(bson);
    result.docs.forEach((doc:any, i: number): void => { assertEquals(doc, expected_docs[i]) })
  }
});

runIfMain(import.meta, { parallel: true})
