import * as chokidar from "chokidar";
import { DirNodeRule } from "../rule/dir";
import * as path from "path";
import * as t from "@babel/types";
import * as fs from "fs";
import { NodeRule } from "../rule";
import { State } from "./state";
import generate from "@babel/generator";

type PseudoNode = PseudoDirectory | PseudoFile;

class PseudoDirectory<StateDataType = {}> {
  type: "dir";
  get name(): string {
    return path.basename(this.pathFromRoot);
  }
  pathFromRoot: string;
  children: (PseudoNode)[];
  stateData: StateDataType;
  parent: PseudoDirectory | null;

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

class PseudoFile {
  type: "file";
  pathFromRoot: string;
  get name(): string {
    return path.basename(this.pathFromRoot);
  }

  ast: t.File;
  constructor(pathFromRoot: string) {
    this.type = "file";
    this.pathFromRoot = pathFromRoot;
  }
}

const readdirAsPseudoDirectory = (
  p: string,
  getParent?: () => PseudoDirectory,
  opts?: { ignore: string[] }
): PseudoDirectory => {
  const nodes = fs
    .readdirSync(p)
    .map(
      (childName: string): PseudoNode => {
        const pathFromRoot = path.join(p, childName);
        if (opts.ignore.includes(pathFromRoot)) {
          return;
        }
        if (fs.statSync(pathFromRoot).isDirectory()) {
          const result: PseudoDirectory = new PseudoDirectory(pathFromRoot, {});
          result.children = readdirAsPseudoDirectory(
            pathFromRoot,
            () => result,
            opts
          ).children;
          result.parent = getParent ? getParent() : undefined;

          return result;
        }

        const result: PseudoFile = new PseudoFile(pathFromRoot);
        return result;
      }
    )
    .filter(v => !!v);

  const dir = new PseudoDirectory(p, {});
  dir.children = nodes;
  return dir;
};

const findNodeRule = (
  pathFromRoot: string,
  rootNodeRule: DirNodeRule
): NodeRule => {
  const splittedPath = path.join(pathFromRoot).split("/");
  const nodes = splittedPath.reduce<NodeRule>(
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
    persistent: true,
    ignoreInitial: true
  });
  const root: PseudoDirectory = readdirAsPseudoDirectory(
    path.join(rootPath),
    undefined,
    {
      ignore: ["node_modules", ".git"]
    }
  );
  const findNodeFromRoot = pathFromRoot => root.findNodeFromThis(pathFromRoot);

  watcher.on("all", (event, p, stats) => {
    const pathFromRoot = path.relative(rootPath, p);
    const splittedPath = path.join(pathFromRoot).split("/");
    const parentPath = path.join(...splittedPath.slice(0, -1)) || null;
    const thisNodeRule = findNodeRule(pathFromRoot, rootNodeRule);
    if (event === "add") {
      if (typeof thisNodeRule === "function") {
        const thisNode = findNodeFromRoot(pathFromRoot) as PseudoFile;
        const parentDirNode = findNodeFromRoot(parentPath) as PseudoDirectory;
        fs.writeFileSync(
          path.join(rootPath, pathFromRoot),
          generate(thisNodeRule(parentDirNode.state)).code
        );
      }
    }
  });
};
