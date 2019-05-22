// 'use strict';

// const fs = require('fs');
// const expect = require('chai').expect;
// const BSON = require('../..');
// const Binary = BSON.Binary;
// const assertBuffersEqual = require('./tools/utils').assertBuffersEqual;
// const Buffer = require('buffer').Buffer;

import { test, runIfMain } from "https://deno.land/std/testing/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import BSON, { Binary } from "./../../mod.ts";

// describe('BSON - Node only', function() {
//   it('Should Correctly Serialize and Deserialize a big Binary object', function(done) {
//     var data = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');
//     var bin = new Binary();
//     bin.write(data);
//     var doc = { doc: bin };
//     var serialized_data = BSON.serialize(doc);
//
//     var serialized_data2 = Buffer.alloc(BSON.calculateObjectSize(doc));
//     BSON.serializeWithBufferAndIndex(doc, serialized_data2);
//     assertBuffersEqual(done, serialized_data, serialized_data2, 0);
//
//     var deserialized_data = BSON.deserialize(serialized_data);
//     expect(doc.doc.value()).to.deep.equal(deserialized_data.doc.value());
//     done();
//   });
// });

test({
  name: "Should Correctly Serialize and Deserialize a big Binary object",
  fn(): void {
    const data: Uint8Array = Deno.readFileSync('./../data/test_gs_weird_bug.png');
    const bin: Binary = new Binary();
    bin.write(data);
    const doc: { doc: Binary } = { doc: bin };
    const serialized_data: Uint8Array = BSON.serialize(doc);

    const serialized_data2: Uint8Array = new Uint8Array(BSON.calculateObjectSize(doc));
    BSON.serializeWithBufferAndIndex(doc, serialized_data2);
    assertEquals(serialized_data, serialized_data2);

    const deserialized_data: { doc: Binary } = BSON.deserialize(serialized_data);
    assertEquals(doc.doc.value(), deserialized_data.doc.value());
  }
});

// describe('Full BSON - Node only', function() {
//   it('Should Correctly Serialize and Deserialize a big Binary object', function(done) {
//     var data = fs.readFileSync('test/node/data/test_gs_weird_bug.png', 'binary');
//     var bin = new Binary();
//     bin.write(data);
//     var doc = { doc: bin };
//     var serialized_data = BSON.serialize(doc);
//     var deserialized_data = BSON.deserialize(serialized_data);
//     expect(doc.doc.value()).to.equal(deserialized_data.doc.value());
//     done();
//   });

test({
  name: "Should Correctly Serialize and Deserialize a big Binary object",
  fn(): void {
    const data: Uint8Array = Deno.readFileSync('test/node/data/test_gs_weird_bug.png');
    const bin: Binary = new Binary();
    bin.write(data);
    const doc: { doc: Binary } = { doc: bin };
    const serialized_data: Uint8Array = BSON.serialize(doc);
    const deserialized_data: { doc: Binary} = BSON.deserialize(serialized_data);
    assertEquals(doc.doc.value(), deserialized_data.doc.value());
  }
})

//   it('Should Correctly Deserialize bson file from mongodump', function(done) {
//     var data = fs.readFileSync('test/node/data/test.bson', { encoding: null });
//     data = Buffer.from(data);
//     var docs = [];
//     var bsonIndex = 0;
//     while (bsonIndex < data.length)
//       bsonIndex = BSON.deserializeStream(data, bsonIndex, 1, docs, docs.length, { isArray: true });
//
//     expect(docs.length).to.equal(1);
//     done();
//   });
// });

test({
  name: "Should Correctly Deserialize bson file from mongodump",
  fn(): void {
    const data: Uint8Array = Deno.readFileSync('test/node/data/test.bson');
    const docs: unknown[] = [];
    let bsonIndex: number = 0;
    while (bsonIndex < data.length) {
      bsonIndex = BSON.deserializeStream(data, bsonIndex, 1, docs, docs.length, { isArray: true });
    }
    assertEquals(docs.length, 1);
  }
});

runIfMain(import.meta, { parallel: true });
