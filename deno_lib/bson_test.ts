import { test, runIfMain } from "https://deno.land/x/testing/mod.ts";
import { assertEquals, assertThrows } from "https://deno.land/x/testing/asserts.ts";
import { Long } from "./long/mod.ts"
// import { Double } from "./double.ts"
import { Timestamp } from "./timestamp.ts"
import {ObjectId } from "./object_id.ts"
// import {BSONRegExp} from "./regexp.ts"
// import {BSONSymbol} from "./symbol.ts"
// import {Int32} from "./int32.ts"
import {Code} from "./code.ts"
// import {Decimal128} from "./decimal128.ts"
import {MinKey} from "./min_key.ts"
import {MaxKey} from "./max_key.ts"
import { DBRef} from "./db_ref.ts"
import {Binary} from "./binary.ts"
import * as BSON from "./bson.ts"
import { encode, decode} from "./transcoding.ts"

const corruptTestVectors : { [key:string]: any}[] = JSON.parse(
  decode(Deno.readFileSync("./bson_corrupt_test_vectors.json") ,"utf8")
)

const validTestVectors : { [key:string]: any}[] = JSON.parse(
  decode(Deno.readFileSync("./bson_valid_test_vectors.json") ,"utf8")
)

// Translate extended json to correctly typed doc
function translate(doc: { [key:string]: any}, object: { [key:string]: any}) : { [key:string]: any} {
  for (let name in doc) {
    if (
      typeof doc[name] === 'number' ||
      typeof doc[name] === 'string' ||
      typeof doc[name] === 'boolean'
    ) {
      object[name] = doc[name];
    } else if (Array.isArray(doc[name])) {
      object[name] = translate(doc[name], []);
    } else if (doc[name]['$numberLong']) {
      object[name] = Long.fromString(doc[name]['$numberLong']);
    } else if (doc[name]['$undefined']) {
      object[name] = null;
    } else if (doc[name]['$date']) {
      const date = new Date();
      date.setTime(parseInt(doc[name]['$date']['$numberLong'], 10));
      object[name] = date;
    } else if (doc[name]['$regexp']) {
      object[name] = new RegExp(doc[name]['$regexp'], doc[name]['$options'] || '');
    } else if (doc[name]['$oid']) {
      object[name] = new ObjectId(doc[name]['$oid']);
    } else if (doc[name]['$binary']) {
      object[name] = new Binary(doc[name]['$binary'], doc[name]['$type'] || 1);
    } else if (doc[name]['$timestamp']) {
      object[name] = Timestamp.fromBits(
        parseInt(doc[name]['$timestamp']['t'], 10),
        parseInt(doc[name]['$timestamp']['i'])
      );
    } else if (doc[name]['$ref']) {
      object[name] = new DBRef(doc[name]['$ref'], doc[name]['$id'], doc[name]['$db']);
    } else if (doc[name]['$minKey']) {
      object[name] = new MinKey();
    } else if (doc[name]['$maxKey']) {
      object[name] = new MaxKey();
    } else if (doc[name]['$code']) {
      object[name] = new Code(doc[name]['$code'], doc[name]['$scope'] || {});
    } else if (doc[name] != null && typeof doc[name] === 'object') {
      object[name] = translate(doc[name], {});
    }
  }

  return object;
}

test({
  name: "all corrupt BSON scenarios",
  fn(): void {
    for (const corruptTestVector of corruptTestVectors) {
      assertThrows(() => BSON.deserialize(encode(corruptTestVector.encoded, "hex")))
    }
  }
})

test({
  name: "all valid BSON scenarios",
  fn():void {
    /*
    // Iterate over all the results
    scenarios.documents.forEach(function(doc) {
      if (doc.skip) return;
      // Create a buffer containing the payload
      const expectedData = Buffer.from(doc.encoded, 'hex');
      // Get the expectedDocument
      const expectedDocument = translate(doc.document, {});
      // Serialize to buffer
      const buffer = BSON.serialize(expectedDocument);
      // Validate the output
      expect(expectedData.toString('hex')).to.equal(buffer.toString('hex'));
      // Attempt to deserialize
      const object = BSON.deserialize(buffer, { promoteLongs: false });
      // // Validate the object
      expect(JSON.stringify(expectedDocument)).to.deep.equal(JSON.stringify(object));
    });
    */
    let expectedBson: Uint8Array;
    let expectedDoc: { [key:string]: any};
    let bson: Uint8Array;
    let doc: { [key:string]: any};
    for (const validTestVector of validTestVectors) {
      // assertThrows(() => BSON.deserialize(encode(corruptTestVector.encoded, "hex")))
      expectedBson = encode(validTestVector.encoded, "hex");
      expectedDoc = translate(validTestVector.document, {});
      bson = BSON.serialize(expectedDoc);
      /////////
      console.error("bson", String(bson), "expectedBson", String(expectedBson));
      ////////
      assertEquals(bson, expectedBson);
      doc = BSON.deserialize(bson, {promoteLongs: false});
      assertEquals(doc, expectedDoc);
    }
  }
})


runIfMain(import.meta)
