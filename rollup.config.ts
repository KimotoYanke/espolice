import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
const sourceMaps = require("rollup-plugin-sourcemaps");
const json = require("rollup-plugin-json");
const typescript = require("rollup-plugin-typescript2");

const pkg = require("./package.json");

const libraryName = "index";

const plugins = [
  json(),
  commonjs(),
  resolve({
    preferBuiltins: true,
    extensions: [".ts", ".js"]
  }),
  sourceMaps(),
  typescript()
];

export default [
  {
    input: `src/index.ts`,
    output: [
      {
        file: pkg.main,
        name: libraryName,
        format: "umd",
        sourcemap: true
      },
      { file: pkg.module, format: "es", sourcemap: true }
    ],
    watch: {
      include: "src/**"
    },
    external: [...Object.keys(pkg.dependencies)],
    plugins
  }
];
