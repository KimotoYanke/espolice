import { Command, flags } from "@oclif/command";
import { isFileExistSync } from "../mount/util";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as cp from "child_process";

const findPackageJSON = (cwd = path.resolve(process.cwd())): any => {
  const packageJSONPath = path.join(cwd, "package.json");
  if (isFileExistSync(packageJSONPath)) {
    const buf = fs.readFileSync(packageJSONPath).toString();
    try {
      return JSON.parse(buf);
    } catch (e) {}
  } else {
    let parsedCwd = cwd.split(path.sep);
    parsedCwd.pop();
    return findPackageJSON(path.join(...parsedCwd));
  }
};

class EspoliceCommand extends Command {
  static description = "describe the command here";

  static flags = {
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    config: flags.string({ char: "c", name: "config file", default: "" })
  };

  static args = [{ name: "file" }];

  async run() {
    const { args, flags } = this.parse(EspoliceCommand);
    const tsDefaultConfigFile = "esp.config.ts";
    const jsDefaultConfigFile = "esp.config.js";
    const [configFile, isTheConfigFileDefault] = (():
      | ["esp.config.ts" | "esp.config.js", true]
      | [string, false] => {
      if (flags.config.trim().length === 0) {
        if (isFileExistSync(tsDefaultConfigFile)) {
          return [tsDefaultConfigFile, true];
        }
        return [jsDefaultConfigFile, true];
      }
      return [flags.config, false];
    })();

    if (!isFileExistSync(configFile)) {
      if (isTheConfigFileDefault && configFile === "esp.config.js") {
        this.error(`${configFile} or ${tsDefaultConfigFile} is not found.`);
        return;
      }
      this.error(`${configFile} is not found.`);
      return;
    }

    const ext = path.extname(configFile);
    const tsFlag = ext === ".ts" ? ["--extensions", ".ts"] : [];
    const argv = ["babel-node", ...tsFlag, configFile];
    const commandStream = cp.spawn("npx", argv, {
      cwd: process.cwd(),
      stdio: "inherit"
    });
    commandStream.on("error", (err: Error) => {
      console.error("Failed to start: ", err);
    });
    process.on("SIGINT", function() {
      commandStream.kill();
      console.log("exit");
      process.exit();
    });
  }
}

export default EspoliceCommand;
