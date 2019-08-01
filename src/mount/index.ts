import * as chokidar from "chokidar";
import { DirNodeRule, isDirNodeRule } from "../rule/dir";
import * as path from "path";
import * as t from "@babel/types";
import * as fs from "fs";
import { NodeRule } from "../rule";
import { State } from "./state";
import { parse } from "@babel/parser";
import { isFileNodeRule } from "../rule/file";
import { patternMatchAST } from "../pattern-matcher";

type PseudoNode = PseudoDirectory | PseudoFile;

class PseudoDirectory<StateDataType = {}> {
  type: "dir";
  get name(): string {
    return path.basename(this.pathFromRoot);
  }
  pathFromRoot: string;
  children: (PseudoNode)[] = [];
  stateData: StateDataType;
  parent: PseudoDirectory | null = null;

  findNodeRule(root: DirNodeRule): DirNodeRule {
    return findNodeRule(this.pathFromRoot, root) as DirNodeRule;
  }

  findNodeFromThis(pathFromThis: string | string[]): PseudoNode | null {
    const [childPath, ...splittedPathFromChild] =
      pathFromThis instanceof Array
        ? pathFromThis
        : path.join(pathFromThis).split("/");

    if (!childPath) {
      return this;
    }

    const foundChild = this.children.find((node: PseudoNode) => {
      return node && node.name === childPath;
    });

    if (foundChild) {
      if (splittedPathFromChild.length === 0) {
        return foundChild;
      }
      if (foundChild.type === "dir") {
        return foundChild.findNodeFromThis(splittedPathFromChild);
      }
    }
    return null;
  }

  get state(): State<StateDataType, {}> {
    return {
      parent: this.parent ? this.parent.state : null,
      ...this.stateData
    };
  }
  constructor(pathFromRoot: string, stateData: StateDataType) {
    this.type = "dir";
    this.pathFromRoot = pathFromRoot;
    this.stateData = stateData;
  }
}

class PseudoFile<StateDataType = {}> {
  type: "file";
  pathFromRoot: string;
  get name(): string {
    return path.basename(this.pathFromRoot);
  }
  parent: PseudoDirectory | null = null;
  stateData: StateDataType;
  get state(): State<StateDataType, {}> {
    return {
      parent: this.parent ? this.parent.state : null,
      ...this.stateData
    };
  }
  ast?: t.File;
  constructor(pathFromRoot: string, stateData: StateDataType) {
    this.type = "file";
    this.pathFromRoot = pathFromRoot;
    this.stateData = stateData;
  }
}

const readdirAsPseudoDirectory = (
  p: string,
  getParent?: () => PseudoDirectory,
  opts?: { ignore: string[] }
): PseudoDirectory => {
  const notNull = <T>(nullable: T | null): nullable is T => {
    return nullable !== null;
  };
  const nodes = fs
    .readdirSync(p)
    .map(
      (childName: string): PseudoNode | null => {
        const pathFromRoot = path.join(p, childName);
        if (opts && opts.ignore.includes(pathFromRoot)) {
          return null;
        }
        if (fs.statSync(pathFromRoot).isDirectory()) {
          const result: PseudoDirectory = new PseudoDirectory(pathFromRoot, {});
          const directory = readdirAsPseudoDirectory(
            pathFromRoot,
            () => result,
            opts
          );
          if (directory) {
            result.children = directory.children;
          }
          result.parent = getParent ? getParent() : null;

          return result;
        }

        const result: PseudoFile = new PseudoFile(pathFromRoot, {});
        result.parent = getParent ? getParent() : null;
        return result;
      }
    )
    .filter(notNull);

  const dir = new PseudoDirectory(p, {});
  dir.children = nodes;
  return dir;
};

const findNodeRule = (
  pathFromRoot: string,
  rootNodeRule: DirNodeRule
): NodeRule | null => {
  const splittedPath = path.join(pathFromRoot).split("/");
  const nodes = splittedPath.reduce<NodeRule | null>(
    (prev, current: string, currentIndex, array) => {
      if (prev === null) {
        return null;
      }

      if (typeof prev === "function") {
        return null;
      }

      if (currentIndex === array.length - 1) {
        return (
          prev.childFileNodes[current] ||
          prev.otherFileNode ||
          prev.childDirNodes[current] ||
          prev.otherDirNode ||
          null
        );
      }

      return prev.childDirNodes[current] || prev.otherDirNode || null;
    },
    rootNodeRule
  );
  return nodes;
};

type Options = {
  loserMode: boolean;
};

export const mount = (
  rootState: State<{}, null>,
  rootNodeRule: DirNodeRule,
  rootPath: string,
  options?: Partial<Options>
) => {
  const watcher = chokidar.watch(rootPath, {
    persistent: true
  });
  const root: PseudoDirectory = readdirAsPseudoDirectory(
    path.join(rootPath),
    undefined,
    {
      ignore: ["node_modules", ".git"]
    }
  );
  const findNodeFromRoot = (pathFromRoot: string) =>
    root.findNodeFromThis(pathFromRoot);

  watcher.on("all", (event, p, stats) => {
    const pathFromRoot = path.relative(rootPath, p);
    const splittedPath = path.join(pathFromRoot).split("/");
    const parentPath = path.join(...splittedPath.slice(0, -1)) || null;
    const thisNodeRule = findNodeRule(pathFromRoot, rootNodeRule);
    if (!thisNodeRule) {
      return;
    }
    console.log("all");
    switch (event) {
      case "add":
      case "change":
        console.log("add or change");
        const code = fs
          .readFileSync(path.join(rootPath, pathFromRoot))
          .toString();
        const ast = parse(code).program;
        if (isFileNodeRule(thisNodeRule)) {
          const thisNode = findNodeFromRoot(pathFromRoot) as PseudoFile;
          const parentDirNode = findNodeFromRoot(
            parentPath || ""
          ) as PseudoDirectory;

          const tmpl = thisNodeRule(thisNode.state) as t.Program;
          console.log(patternMatchAST(tmpl, ast));
          /*fs.writeFileSync(
            path.join(rootPath, pathFromRoot),
          );*/
        }
        break;
      case "addDir":
        if (isDirNodeRule(thisNodeRule)) {
          thisNodeRule.childDirNodes;
        }
        break;
    }
  });
};
