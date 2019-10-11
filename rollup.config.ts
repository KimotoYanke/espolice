import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { type } from "os";
const sourceMaps = require("rollup-plugin-sourcemaps");
const json = require("rollup-plugin-json");
const typescript = require("rollup-plugin-typescript2");

const pkg = require("./package.json");

const libraryName = "index";

const pluginsCommons = [
  json(),
  commonjs(),
  resolve({
    preferBuiltins: true,
    extensions: [".ts", ".js"]
  }),
  sourceMaps()
];
const ts = typescript();
export default [
  {
    input: `src/index.ts`,
    output: [
      {
        file: pkg.main,
        name: libraryName,
        format: "umd",
        sourcemap: true
      }
    ],
    watch: {
      include: "src/**"
    },
    external: [...Object.keys(pkg.dependencies)],
    plugins: [...pluginsCommons, ts]
  },
  {
    input: `src/index.ts`,
    output: [
      {
        file: pkg.module,
        name: libraryName,
        format: "esm",
        sourcemap: true
      }
    ],
    watch: {
      include: "src/**"
    },
    external: [...Object.keys(pkg.dependencies)],
    plugins: [...pluginsCommons, ts]
  }
];
