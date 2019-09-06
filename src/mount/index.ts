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

export type PseudoNode = PseudoDirectory | PseudoFile;

const opts = {
  ignore: ["node_modules", ".gitignore"]
};

type Options = {
  loserMode: boolean;
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

  const nodeRulePathToNodesDict: {
    [key in NodeRulePath]: Set<PseudoFile> | undefined;
  } = {};
  const state: State = new State();

  const getStateDatum = (key: string) => {
    return state.data[key] || undefined;
  };
  const setStateDatum = (key: string, datum: any) => {
    if (isEqual(state.data[key], datum)) {
      return;
    }
    state.data[key] = datum;
    const userPaths = getDatumUsers(key);

    userPaths.forEach(nodeRulePath => {
      console.log("write from state change: ", userPaths);
      const nodes = getNodesFromNodeRulePath(nodeRulePath);
      if (nodes !== null) {
        nodes.forEach(node => {
          node.sync();
        });
      }
    });
  };
  const addDatumUser = (key: string, nodeRulePath: NodeRulePath) => {
    if (!state.datumUser[key]) {
      state.datumUser[key] = new Set([nodeRulePath]);
    } else {
      state.datumUser[key].add(nodeRulePath);
    }
  };
  const getDatumUsers = (key: string) => {
    return state.datumUser[key] || new Set([]);
  };
  const getNodesFromNodeRulePath = (nodeRulePath: NodeRulePath) => {
    return nodeRulePathToNodesDict[nodeRulePath] || null;
  };

  const stateInterface: StateInterface = {
    getStateDatum,
    setStateDatum,
    addDatumUser,
    getDatumUsers,
    getNodesFromNodeRulePath
  };

  const root = getRootDirectory(rootPath, rootNodeRule, stateInterface, opts);
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
          console.log("flagIsWriting");
          thisFileNode.flagIsWriting = false;
          return;
        }

        console.log("add or change");
        if (thisFileNode && thisFileNode.type === "file") {
          if (event === "add") {
            thisFileNode.parent.syncDependents();
          }
          if (thisFileNode.nodeRulePath) {
            if (!nodeRulePathToNodesDict[thisFileNode.nodeRulePath]) {
              nodeRulePathToNodesDict[thisFileNode.nodeRulePath] = new Set();
            }
            if (nodeRulePathToNodesDict[thisFileNode.nodeRulePath]) {
              (
                nodeRulePathToNodesDict[thisFileNode.nodeRulePath] || {
                  add: (_: PseudoFile) => {}
                }
              ).add(thisFileNode);
            }
          }
          thisFileNode.writeForNewAst(thisFileNode.read());
        }
        break;
      case "addDir":
        console.log("addDir");
        const thisDirNode = addNewDirectory(
          pathFromRoot,
          rootPath,
          rootNodeRule,
          root,
          opts
        );
        /*if (isDirNodeRule(thisNodeRule)) {
          thisNodeRule.childDirNodes;
        }*/
        break;
    }
  });
};
