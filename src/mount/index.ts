import * as chokidar from "chokidar";
import { DirNodeRule, isDirNodeRule } from "../rule/dir";
import * as path from "path";
import * as t from "@babel/types";
import * as fs from "mz/fs";
import { State } from "./state";
import { parse } from "@babel/parser";
import { isFileNodeRule, FileNodeRule } from "../rule/file";
import { patternMatchAST, patternResetAST } from "../pattern-matcher";
import generate from "@babel/generator";
import { toProgram } from "./to-program";
import { MatchedList } from "../pattern-matcher/matched-list";
import { PseudoDirectory, getRootDirectory } from "./directory";
import { findNodeRule } from "./find-node-rule";
import { PseudoFile } from "./file";

export type PseudoNode = PseudoDirectory | PseudoFile;

type Options = {
  loserMode: boolean;
};

export const mount = <RS extends State>(
  rootNodeRule: DirNodeRule,
  rootPath: string,
  options?: Partial<Options>
) => {
  const watcher = chokidar.watch(rootPath, {
    persistent: true,
    ignoreInitial: false
  });
  const root = getRootDirectory(rootPath, rootNodeRule);
  root.pathFromRoot = ".";

  watcher.on("all", (event, p, stats) => {
    const pathFromRoot = path.relative(path.resolve(rootPath), path.resolve(p));
    const splittedPath = pathFromRoot.split("/");
    const parentPath = path.join(...splittedPath.slice(0, -1)) || null;
    const thisNode = root.findNodeFromThis(pathFromRoot);
    const thisNodeRule = findNodeRule(pathFromRoot, rootPath, rootNodeRule);
    if (!thisNodeRule) {
      return;
    }
    if (thisNode && thisNode.type === "file" && thisNode.flagIsWriting) {
      thisNode.flagIsWriting = false;
      return;
    }
    switch (event) {
      case "add":
      case "change":
        console.log("add or change");
        if (thisNode && thisNode.type === "file") {
          thisNode.writeForNewAst(thisNode.read());
        }
        break;
      case "addDir":
        /*if (isDirNodeRule(thisNodeRule)) {
          thisNodeRule.childDirNodes;
        }*/
        break;
    }
  });
};
