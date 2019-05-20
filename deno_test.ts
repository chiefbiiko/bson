import * as bson from "./bson.deno.esm.js";

console.log("bson", bson)

const doc = { fraud: "money" }
console.log("plain doc", doc)
const data = bson.serialize(doc);
console.log("bson data", data);
const doc2 = bson.deserialize(data);
console.log(doc2)
