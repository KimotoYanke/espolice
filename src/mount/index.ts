import * as chokidar from "chokidar";
import { DirNodeRule } from "../rule/dir";
import * as path from "path";
import { State, NodeRulePath, StateInterface } from "./state";
import {
  PseudoDirectory,
  getRootDirectory,
  addNewDirectory
} from "./directory";
import { findNodeRule } from "./find-node-rule";
import { PseudoFile, addNewFile } from "./file";
import { mkdirpSync, isFileExistSync, isDirectoryExistSync } from "./util";
import { eventLog } from "../cli/util";
import {
  DictNodeRulePathToFiles,
  createStateInterface
} from "./state-interface";
import { Options, normalizeOptions } from "./options";
import anymatch from "anymatch";

export type PseudoNode = PseudoDirectory | PseudoFile;

export const mount = (
  rootNodeRule: DirNodeRule,
  rootPath: string,
  options?: Partial<Options>
) => {
  mkdirpSync(rootPath);
  const nOpts = normalizeOptions(options);

  const dictNodeRulePathToFiles: DictNodeRulePathToFiles = {};
  const state: State = new State();

  const stateInterface: StateInterface = createStateInterface(
    state,
    dictNodeRulePathToFiles
  );

  const onAddChangeInit = (pathFromRoot: string, p: string, event: string) => {
    if (!isFileExistSync(p)) {
      return;
    }
    if (
      nOpts.ignore.some(ignorePattern => {
        return anymatch(ignorePattern, pathFromRoot);
      })
    ) {
      return;
    }
    if (!nOpts.ext.includes(path.extname(pathFromRoot))) {
      return;
    }
    if (event === "init") {
      eventLog("FILE Found", pathFromRoot);
    } else if (event === "add") {
      eventLog("FILE Added", pathFromRoot);
    } else {
      eventLog("FILE Edited", pathFromRoot);
    }
    const thisFileNode =
      root.findNodeFromThis(pathFromRoot) ||
      addNewFile(
        pathFromRoot,
        rootPath,
        rootNodeRule,
        root,
        stateInterface,
        normalizeOptions(options)
      );
    if (
      thisFileNode &&
      thisFileNode.type === "file" &&
      thisFileNode.flagIsWriting
    ) {
      thisFileNode.flagIsWriting = false;
      return;
    }

    if (thisFileNode && thisFileNode.type === "file") {
      if (event === "add" && !thisFileNode.parent.isWriting) {
        thisFileNode.parent.syncDependents();
      }
      if (thisFileNode.nodeRulePath) {
        if (!dictNodeRulePathToFiles[thisFileNode.nodeRulePath]) {
          dictNodeRulePathToFiles[thisFileNode.nodeRulePath] = new Set();
        }
        if (dictNodeRulePathToFiles[thisFileNode.nodeRulePath]) {
          (
            dictNodeRulePathToFiles[thisFileNode.nodeRulePath] || {
              add: (_: PseudoFile) => {}
            }
          ).add(thisFileNode);
        }
      }
      thisFileNode.sync();
    }
  };
  const onAddInitDir = (pathFromRoot: string, p: string, event: string) => {
    if (!isDirectoryExistSync(p)) {
      return;
    }
    if (
      nOpts.ignore.some(ignorePattern => {
        return anymatch(ignorePattern, pathFromRoot);
      })
    ) {
      return;
    }

    if (event === "initDir") {
      eventLog("DIR Found", pathFromRoot);
    } else {
      eventLog("DIR Added", pathFromRoot);
    }
    const thisDirNode = addNewDirectory(
      pathFromRoot,
      rootPath,
      rootNodeRule,
      root,
      normalizeOptions(options)
    );

    if (thisDirNode) {
      thisDirNode.isWriting = true;
      thisDirNode.write();
      thisDirNode.isWriting = false;
    }
  };
  rootNodeRule.setFileInitFunction((pathFromRoot: string) => {
    const p = path.resolve(rootPath, pathFromRoot);
    onAddChangeInit(pathFromRoot, p, "init");
  });
  rootNodeRule.setDirInitFunction((pathFromRoot: string) => {
    const p = path.resolve(rootPath, pathFromRoot);
    onAddInitDir(pathFromRoot, p, "initDir");
  });

  const root = getRootDirectory(
    rootPath,
    rootNodeRule,
    stateInterface,
    normalizeOptions(options)
  );
  root.pathFromRoot = ".";
  root.write();
  const watcher = chokidar.watch(rootPath, {
    persistent: true,
    ignoreInitial: true,
    ignored: nOpts.ignore
  });

  watcher.on(
    "all",
    (event: "add" | "addDir" | "change" | "unlink" | "unlinkDir", p) => {
      const pathFromRoot = path.relative(
        path.resolve(rootPath),
        path.resolve(p)
      );
      const thisNodeRule = findNodeRule(pathFromRoot, rootPath, rootNodeRule);
      if (!thisNodeRule) {
        return;
      }
      switch (event) {
        case "add":
        case "change":
          {
            onAddChangeInit(pathFromRoot, p, event);
          }
          break;
        case "addDir":
          {
            onAddInitDir(pathFromRoot, p, event);
          }
          break;
        case "unlink": {
          eventLog("FILE Removed", pathFromRoot);
          const thisFileNode =
            root.findNodeFromThis(pathFromRoot) ||
            addNewFile(
              pathFromRoot,
              rootPath,
              rootNodeRule,
              root,
              stateInterface,
              normalizeOptions(options)
            );

          if (thisFileNode && thisFileNode.type === "file") {
            thisFileNode.remove();
          }
          break;
        }
        case "unlinkDir": {
          eventLog("DIR Removed", pathFromRoot);
          const thisDirNode =
            root.findNodeFromThis(pathFromRoot) ||
            addNewDirectory(
              pathFromRoot,
              rootPath,
              rootNodeRule,
              root,
              normalizeOptions(options)
            );

          if (thisDirNode && thisDirNode.type === "dir") {
            thisDirNode.remove();
          }
        }
      }
    }
  );
  root.initialRegistration();
};
