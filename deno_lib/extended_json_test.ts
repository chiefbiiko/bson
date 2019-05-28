import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assert, assertEquals, assertThrows } from "https://deno.land/x/testing/asserts.ts";
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
    regexp: new BSONRegExp('hello world', 'i'),
    symbol: new BSONSymbol('symbol'),
    timestamp: Timestamp.fromNumber(1000),
    int32Number: 300,
    doubleNumber: 200.2,
    longNumberIntFit: 0x19000000000000,
    doubleNumberIntFit: 19007199250000000.12
  };

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
    assertEquals(doc.int32Number._bsontype, "Int32")
        assertEquals(doc.doubleNumber._bsontype, "Double")
        assertEquals(doc.longNumberIntFit._bsontype, "Long")
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
    assertEquals(doc.int32._bsontype, "Int32")
    doc = EJSON.parse(text);
    assertEquals(doc.int32, 10)
  }
});

test({
  name: 'should correctly serialize bson types when they are values',
  fn():void {
    let serialized: string = EJSON.stringify(new ObjectId('591801a468f9e7024b6235ea'), { relaxed: false });
    assertEquals(serialized, '{"$oid":"591801a468f9e7024b6235ea"}')
    serialized = EJSON.stringify(new Int32(42), { relaxed: false });
    assertEquals(serialized, '{"$numberInt":"42"}')
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new ObjectId('591801a468f9e7024b6235ea')] }
      },
      { relaxed: false }
    );
    assertEquals(serialized, '{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}')
    serialized = EJSON.stringify(new Binary(new Uint8Array([1, 2, 3, 4, 5])), { relaxed: false });
    assertEquals(serialized, '{"$binary":{"base64":"AQIDBAU=","subType":"00"}}')
  }
});

test({
  name: 'should correctly parse null values', fn():void{
    assertEquals(EJSON.parse("null"), null)
assertEquals(EJSON.parse("[null]")[0], null)
    let input: string = '{"result":[{"_id":{"$oid":"591801a468f9e7024b623939"},"emptyField":null}]}';
    let parsed : { [key:string]: any} = EJSON.parse(input);
    assertEquals(parsed,{
      result: [{ _id: new ObjectId('591801a468f9e7024b623939'), emptyField: null }]
    });
  }
});

test({
  name: 'should correctly throw when passed a non-string to parse', fn():void {
    assertThrows(() => EJSON.parse({}))
  }
});

test({
  name: 'should allow relaxed parsing by default', fn():void {
    const input: { [key:string]: any} = {
      int: { $numberInt: '500' },
      long: { $numberLong: '42' },
      double: { $numberDouble: '24' },
      date: { $date: { $numberLong: '1452124800000' } }
    };
    const parsed: {[key:string]: any} = EJSON.parse(JSON.stringify(input));
    assertEquals(parsed,{
      int: 500,
      long: 42,
      double: 24,
      date: new Date(1452124800000)
    });
  }
});

test({
  name:'should allow regexp', fn():void {
    const parsedRegExp: string = EJSON.stringify({ test: /some-regex/i });
    const parsedBSONRegExp: string = EJSON.stringify(
      { test: new BSONRegExp('some-regex', 'i') },
      { relaxed: true }
    );
    assertEquals(parsedBSONRegExp, parsedRegExp)
  }
});

test({
  name: 'should serialize from BSON object to EJSON object', fn():void {
    const bson: { [key:string]: any} = {
      binary: new Binary(''),
      code: new Code('function() {}'),
      dbRef: new DBRef('tests', new Int32(1), 'test'),
      decimal128: Decimal128.fromString("128"),
      double: new Double(10.1),
      int32: new Int32(10),
      long: Long.fromNumber(234),
      maxKey: new MaxKey(),
      minKey: new MinKey(),
      objectId: ObjectId.fromHexString('111111111111111111111111'),
      bsonRegExp: new BSONRegExp('hello world', 'i'),
      symbol: new BSONSymbol('symbol'),
      timestamp: Timestamp.fromString("1559018785970")
    };
    const ejson: { [key:string]: any}  = {
      binary: { $binary: { base64: '', subType: '00' } },
      code: { $code: 'function() {}' },
      dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
      decimal128: { $numberDecimal: '128' },
      double: { $numberDouble: '10.1' },
      int32: { $numberInt: '10' },
      long: { $numberLong: '234' },
      maxKey: { $maxKey: "9223372036854775807" },
      minKey: { $minKey: "-9223372036854775808" },
      objectId: { $oid: '111111111111111111111111' },
      bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
      symbol: { $symbol: 'symbol' },
      timestamp: { $timestamp: { t: 362, i: 4240624818 } }
    }
    assertEquals(EJSON.serialize(bson, { relaxed: false }),ejson);
  }
});

test({
  name: 'should deserialize from EJSON object to BSON object', fn():void {
    const ejson: { [key:string]: any} = {
      binary: { $binary: { base64: '', subType: '00' } },
      code: { $code: 'function() {}' },
      dbRef: { $ref: 'tests', $id: { $numberInt: '1' }, $db: 'test' },
      decimal128: { $numberDecimal: '41999999999999999999999999999' },
      double: { $numberDouble: '10.1' },
      int32: { $numberInt: '10' },
      long: { $numberLong: '234' },
      maxKey: { $maxKey: 1 },
      minKey: { $minKey: 1 },
      objectId: { $oid: '111111111111111111111111' },
      bsonRegExp: { $regularExpression: { pattern: 'hello world', options: 'i' } },
      symbol: { $symbol: 'symbol' },
      timestamp: { $timestamp: { t: 362, i: 4240624818  } }
    };
    const bson: {[key:string]: any} = EJSON.deserialize(ejson, { relaxed: false });
    // binary
    assert(bson.binary instanceof Binary);
    assertEquals(bson.binary.length, 0)
    // code
    assert(bson.code instanceof Code)
    assertEquals(bson.code.code,'function() {}');
    // dbRef
    assert(bson.dbRef instanceof DBRef);
    assertEquals(bson.dbRef.collection, 'tests');
    assertEquals(bson.dbRef.db, 'test');
    // decimal128
    assert(bson.decimal128 instanceof Decimal128);
    assertEquals(bson.decimal128.toString(), "41999999999999999999999999999")
    // double
    assert(bson.double instanceof Double);
    assertEquals(bson.double.value, 10.1);
    // int32
    assert(bson.int32 instanceof Int32);
    assertEquals(bson.int32.value, 10);
    //long
    assert(bson.long instanceof  Long);
    assertEquals(bson.long.toInt(), 234)
    // maxKey
    assert(bson.maxKey instanceof MaxKey);
    assertEquals(bson.maxKey.toString(), String((1n << 63n) - 1n))
    // minKey
    assert(bson.minKey instanceof MinKey);
    assertEquals(bson.minKey.toString(), String(-1n << 63n))
    // objectID
    assert(bson.objectId instanceof ObjectId)
    assertEquals(bson.objectId.toString(), '111111111111111111111111');
    // bsonRegExp
    assert(bson.bsonRegExp instanceof BSONRegExp);
    assertEquals(bson.bsonRegExp.pattern, 'hello world');
    assertEquals(bson.bsonRegExp.options, 'i');
    // symbol
    assert(bson.symbol instanceof BSONSymbol)
    assertEquals(bson.symbol.toString(), "symbol")
    // timestamp
    assert(bson.timestamp instanceof Timestamp)
  }
});

test({
  name: 'should return a native number for a double in relaxed mode', fn():void {
    const expected: number = 419.419
    let fraud = EJSON.deserialize({money: { $numberDouble: "419.419"} }, { relaxed: true });
    assertEquals(fraud.money,expected)
    fraud = EJSON.deserialize({money: { $numberDouble: 419.419} }, { relaxed: true });
      assertEquals(fraud.money,expected)
  }
});

test({
  name: 'should work for function-valued and array-valued replacer parameters', fn():void {
    const doc: { [key:string]: any} = { a: new Int32(10), b: new Int32(10) };
    const replacerArray: string[] = ['a', '$numberInt'];
    let serialized: string = EJSON.stringify(doc, replacerArray, 0, { relaxed: false });
    assertEquals(serialized, '{"a":{"$numberInt":"10"}}')
    serialized = EJSON.stringify(doc, replacerArray);
    assertEquals(serialized, '{"a":10}')
const replacerFunc: (key: string, value: any)=> boolean = (key: string, value: any) => key === 'b' ? undefined : value;
    serialized = EJSON.stringify(doc, replacerFunc, 0, { relaxed: false });
    assertEquals(serialized, '{"a":{"$numberInt":"10"}}')
    serialized = EJSON.stringify(doc, replacerFunc);
    assertEquals(serialized, '{"a":10}')
  }
});

test({name: 'should throw if invalid BSON types are input to EJSON serializer', fn():void {
  const oid: ObjectId = new ObjectId('111111111111111111111111');
  const badBsonType: {[key:string]: any} = Object.assign({}, oid, { _bsontype: 'bogus' });
  const badDoc: {[key:string]: any} = { bad: badBsonType };
  const badArray: {[key:string]: any}[] = [oid, badDoc];
  assertThrows(() => EJSON.serialize(badDoc))
  assertThrows(() => EJSON.serialize(badArray))
  // const badMap: Map<string, any> = new Map<string, any>([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
  // assertThrows(() => EJSON.serialize(badMap))
}});

runIfMain(import.meta, { parallel: true})
