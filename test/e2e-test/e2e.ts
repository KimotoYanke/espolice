import * as path from "path";
import * as fs from "fs-extra";
import * as cp from "child_process";
import * as chokidar from "chokidar";
const initTED = (ted: string) => {
  const tedOptions: cp.ExecSyncOptions = {
    cwd: ted
  };
  const espOptions: cp.ExecSyncOptions = {
    cwd: __dirname
  };
  cp.execSync("yarn init --yes", tedOptions);
  cp.execSync("yarn link espolice", tedOptions);
  cp.execSync("yarn link babel-plugin-transform-quasiquote", tedOptions);
  cp.execSync(
    [
      "yarn add -D",
      "@babel/cli",
      "@babel/node",
      "@babel/core",
      "@babel/preset-env",
      "@babel/preset-typescript @babel/plugin-proposal-class-properties"
    ].join(" "),
    tedOptions
  );

  fs.writeFileSync(
    path.join(ted, ".babelrc"),
    JSON.stringify({
      presets: [
        [
          "@babel/env",
          {
            targets: {
              node: 8
            }
          }
        ],
        "@babel/typescript"
      ],
      plugins: [
        "@babel/proposal-class-properties",
        "babel-plugin-transform-quasiquote"
      ],
      parserOpts: {
        allowImportExportEverywhere: true
      }
    })
  );
};

const testEnvironmentDir = path.join(__dirname, "test-environment");
let watcher: chokidar.FSWatcher | null = null;
let stream: cp.ChildProcessWithoutNullStreams | null = null;
const makeTED = () => {
  if (fs.existsSync(testEnvironmentDir)) {
    fs.removeSync(testEnvironmentDir);
  }
  fs.mkdirpSync(testEnvironmentDir);
  initTED(testEnvironmentDir);
};

const makeEspConfig = (code: string) => {
  const espConfigPath = path.join(testEnvironmentDir, "esp.config.js");
  fs.writeFileSync(espConfigPath, code);
};

const testEsp = (
  onFileChanged: { [key in string]: (code: string) => void },
  testName: string,
  done: () => void
) => {
  watcher = chokidar.watch(testEnvironmentDir, {
    persistent: true,
    ignoreInitial: true,
    ignored: ["node_modules"],
    followSymlinks: false
  });
  watcher.on("all", (e, p) => {
    for (let k in onFileChanged) {
      if (e === "change" && path.relative(testEnvironmentDir, p).endsWith(k)) {
        const indexJS = fs.readFileSync(p).toString();
        onFileChanged[k](indexJS);
        console.log(k + " done");
        done();
      }
    }
  });
  watcher.on("ready", () => {
    stream = cp.spawn("espolice", [], {
      cwd: testEnvironmentDir
    });
    stream.stdout.on("data", data => {
      console.log(`${testName} espolice stdout: ${data}`);
    });

    stream.stderr.on("data", data => {
      console.error(`${testName} espolice stderr: ${data}`);
    });

    stream.on("error", (err: Error) => {
      throw err;
      return;
    });
  });
};

const finallyProc = async () => {
  await new Promise(resolve => {
    if (watcher) {
      watcher.close();
      watcher = null;
    }
    if (stream) {
      stream.on("exit", () => {
        stream = null;
        resolve();
      });
      stream.on("close", () => {
        stream = null;
        resolve();
      });
      stream.kill();
    }
  });
  return;
};

type Test = [boolean, () => Promise<void>];

const testFileImpl: Test = [
  false,
  async () => {
    makeTED();
    const result = new Promise<void>(resolve => {
      makeEspConfig(`
  import { dir, mount } from "espolice";
  const Index = () => {
    return $quasiquote => {
      console.log("Test");
    }
  }
  const RootDir = dir()
    .haveChildFile(Index, "index.js")

  mount(RootDir, "./src", {
    usePrettier: true
  });
  `);
      testEsp(
        {
          "src/index.js": code => {
            if (code.trim() === 'console.log("Test");') {
              testFileImpl[0] = true;
            } else {
              throw new Error(`code.trim() == ${code.trim()}`);
            }
          }
        },
        "file tmpl",
        () => resolve()
      );
    }).then(finallyProc);
    return result;
  }
];

const testOtherFileTmpl: Test = [
  false,
  async () => {
    makeTED();
    const result = new Promise<void>(resolve => {
      makeEspConfig(`
    import { dir, mount } from "espolice";
    const Index = () => {
      return $quasiquote => {
        console.log("Test");
      }
    }
    const Other = () => {
      return $quasiquote => {
        console.log("Other");
      }
    }
    const RootDir = dir()
      .haveChildFile(Index, "index.js")
      .otherChildrenFiles(Other)

    mount(RootDir, "./src", {
      usePrettier: true
    });
    `);
      fs.mkdirpSync(testEnvironmentDir + "/src");
      fs.writeFileSync(testEnvironmentDir + "/src/other.js", "");
      testEsp(
        {
          "src/other.js": code => {
            if (code.trim() == 'console.log("Other");') {
              testOtherFileTmpl[0] = true;
            } else {
              throw new Error(`code.trim() == ${code.trim()}`);
            }
          }
        },
        "other file tmpl",
        () => resolve()
      );
    }).then(finallyProc);
    return result;
  }
];

const all = { testFileImpl, testOtherFileTmpl };
const proc = async () => {
  for (const [name, test] of Object.entries(all)) {
    console.log(name);
    await test[1]().then(() => {
      if (test[0]) {
        console.log("✔");
      } else {
        console.log("✘");
      }
    });
  }
};
proc();
