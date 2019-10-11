import * as path from "path";
import * as fs from "fs-extra";
import * as cp from "child_process";

const initTED = (ted: string) => {
  const tedOptions: cp.ExecSyncOptions = {
    cwd: ted,
    stdio: "inherit"
  };
  const espOptions: cp.ExecSyncOptions = {
    cwd: ted,
    stdio: "inherit"
  };
  cp.execSync("yarn init", tedOptions);
  cp.execSync("yarn link", espOptions);
  cp.execSync("yarn link espolice", tedOptions);
  cp.execSync(
    "yarn add -D @babel/cli @babel/node @babel/env @babel/typescript @babel/proposal-class-properties babel-plugin-transform-quasiquote",
    tedOptions
  );
  fs.writeFileSync(
    path.join(ted, ".babelrc"),
    `
  {
    "presets": [
      [
        "@babel/env",
        {
          "targets": {
            "node": 8
          }
        }
      ],
      "@babel/typescript"
    ],
    "plugins": [
      "@babel/proposal-class-properties",
      "babel-plugin-transform-quasiquote"
    ],
    "parserOpts": {
      "allowImportExportEverywhere": true
    }
  }
  `
  );
};

const testEnvironmentDir = path.join(__dirname, ".test-environment");
const makeTED = () => {
  fs.mkdirpSync(testEnvironmentDir);
  initTED(testEnvironmentDir);
};
const resetTED = () => {
  fs.rmdirSync(testEnvironmentDir);
};

const makeEspConfig = (code: string) => {
  const espConfigPath = path.join(testEnvironmentDir, "esp.config.js");
  fs.writeFileSync(espConfigPath, code);
};
describe("e2e test", () => {
  beforeEach(makeTED);
  afterEach(resetTED);
  test("file tmpl", () => {
    makeEspConfig(`
    import { dir, mount } from "espolice";
    const Index = () => {
      return $quasiquote => {
        "Test";
      }
    }
    const RootDir = dir()
      .haveChildFile(Index, "index.js")

    mount(RootDir, "./routes", {
      usePrettier: true
    });
    `);
  });
});
