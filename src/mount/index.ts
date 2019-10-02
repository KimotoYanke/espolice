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
import { FileNodeRule } from "..";
import { isEqual } from "lodash";
import { fs } from "mz";
import { mkdirpSync } from "./util";
import { eventLog } from "../cli";
import {
  DictNodeRulePathToFiles,
  createStateInterface
} from "./state-interface";
import { Options, normalizeOptions } from "./options";

export type PseudoNode = PseudoDirectory | PseudoFile;

const opts = {
  ignore: ["node_modules", ".gitignore"]
};

export const mount = <RS extends State>(
  rootNodeRule: DirNodeRule,
  rootPath: string,
  options?: Partial<Options>
) => {
  mkdirpSync(rootPath);
  const watcher = chokidar.watch(rootPath, {
    persistent: true,
    ignoreInitial: false
  });

  const dictNodeRulePathToFiles: DictNodeRulePathToFiles = {};
  const state: State = new State();

  const stateInterface: StateInterface = createStateInterface(
    state,
    dictNodeRulePathToFiles
  );

  const root = getRootDirectory(
    rootPath,
    rootNodeRule,
    stateInterface,
    normalizeOptions(options)
  );
  root.pathFromRoot = ".";
  root.write();

  watcher.on("all", (event, p, stats) => {
    const pathFromRoot = path.relative(path.resolve(rootPath), path.resolve(p));
    const thisNodeRule = findNodeRule(pathFromRoot, rootPath, rootNodeRule);
    if (!thisNodeRule) {
      return;
    }
    switch (event) {
      case "add":
      case "change":
        {
          eventLog("FILE Add or Change", pathFromRoot);
          const thisFileNode =
            root.findNodeFromThis(pathFromRoot) ||
            addNewFile(
              pathFromRoot,
              rootPath,
              rootNodeRule,
              root,
              stateInterface,
              opts
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
        }
        break;
      case "addDir":
        {
          eventLog("DIR Added", pathFromRoot);
          const thisDirNode = addNewDirectory(
            pathFromRoot,
            rootPath,
            rootNodeRule,
            root,
            opts
          );

          if (thisDirNode) {
            thisDirNode.isWriting = true;
            thisDirNode.write();
            thisDirNode.isWriting = false;
          }
          /*if (isDirNodeRule(thisNodeRule)) {
          thisNodeRule.childDirNodes;
        }*/
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
            opts
          );

        if (thisFileNode) {
          const parent = thisFileNode.parent;
          if (parent) {
            const foundIndex = parent.children.findIndex(node => {
              node.type === "file" &&
                node.pathFromRoot === thisFileNode.pathFromRoot;
            });
            parent.children.splice(foundIndex, 1);
            if (thisFileNode.nodeRulePath) {
              stateInterface.removeDatumUser(thisFileNode.nodeRulePath);
            }

            parent.isWriting = true;
            parent.write();
            parent.syncDependents();
            parent.isWriting = false;
          }
        }
        break;
      }
    }
  });
};
