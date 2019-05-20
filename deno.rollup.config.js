import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeBuiltins from 'rollup-plugin-node-builtins';

// leftovers for a cli script
// rename global to globalThis
// global -> globalThis
// give all function options defaults
// (function[^\n]+)options -> $1options = {}

export default {
  input: './lib/bson.js',
  output: {
    file: './bson.deno.esm.js',
    format: 'es',
    name: 'BSON',
    exports: 'named'
  },
  plugins: [
    nodeBuiltins(),
    nodeResolve({
      ignoreGlobal: false,
      preferBuiltins: true,
      dedupe: [ 'base64-js' ],
    }),
    commonjs()
  ]
}
