import * as chokidar from "chokidar";
import { DirNodeRule } from "../rule/dir";
import * as path from "path";
import { State, NodeRulePath, StateInterface } from "./state";
import { PseudoDirectory, getRootDirectory } from "./directory";
import { findNodeRule } from "./find-node-rule";
import { PseudoFile } from "./file";
import { FileNodeRule } from "..";

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

  const nodeRulePathToNodesDict: {
    [key in NodeRulePath]: Set<PseudoFile> | undefined
  } = {};
  const state: State = new State();

  const stateInterface: StateInterface = {
    getStateDatum(key: string) {
      return state.data[key] || undefined;
    },
    setStateDatum(key: string, datum: any) {
      state.data[key] = datum;
    },
    addDatumUser(key: string, nodeRulePath: NodeRulePath) {
      if (state.datumUser[key]) {
        state.datumUser[key].push(nodeRulePath);
      } else {
        state.datumUser[key] = [nodeRulePath];
      }
    },
    getDatumUsers(key: string) {
      return state.datumUser[key] || [];
    },
    getNodesFromNodeRulePath(nodeRulePath: NodeRulePath) {
      return nodeRulePathToNodesDict[nodeRulePath] || null;
    }
  };

  const root = getRootDirectory(rootPath, rootNodeRule, stateInterface);
  root.pathFromRoot = ".";

  watcher.on("all", (event, p, stats) => {
    const pathFromRoot = path.relative(path.resolve(rootPath), path.resolve(p));
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
          console.log(thisNode.nodeRulePath);
          if (thisNode.nodeRulePath) {
            if (!nodeRulePathToNodesDict[thisNode.nodeRulePath]) {
              nodeRulePathToNodesDict[thisNode.nodeRulePath] = new Set();
            }
            if (nodeRulePathToNodesDict[thisNode.nodeRulePath]) {
              (
                nodeRulePathToNodesDict[thisNode.nodeRulePath] || {
                  add: (_: PseudoFile) => {}
                }
              ).add(thisNode);
            }
          }
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
