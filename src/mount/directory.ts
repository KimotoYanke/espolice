import { PseudoNode } from ".";
import { DirNodeRule } from "..";
import { State } from "./state";
import * as path from "path";
import { findNodeRule } from "./find-node-rule";
import { fs } from "mz";
import { PseudoFile } from "./file";

const readdirAsPseudoDirectory = (
  pathFromRoot: string,
  rootPath: string,
  parent: PseudoDirectory | null,
  rootNodeRule: DirNodeRule,
  opts?: { ignore: string[] }
): PseudoDirectory => {
  const notNull = <T>(nullable: T | null): nullable is T => {
    return nullable !== null;
  };
  const dir = new PseudoDirectory(
    pathFromRoot,
    parent,
    rootNodeRule,
    rootPath,
    rootNodeRule
  );
  const nodes = fs
    .readdirSync(path.resolve(rootPath, pathFromRoot))
    .map(
      (childName: string): PseudoNode | null => {
        const newPathFromRoot = path.join(pathFromRoot, childName);
        if (opts && opts.ignore.includes(newPathFromRoot)) {
          return null;
        }
        if (
          fs.statSync(path.resolve(rootPath, newPathFromRoot)).isDirectory()
        ) {
          const result = readdirAsPseudoDirectory(
            newPathFromRoot,
            rootPath,
            dir,
            rootNodeRule,
            opts
          );

          return result;
        }

        const result: PseudoFile = new PseudoFile(newPathFromRoot, dir);
        return result;
      }
    )
    .filter(notNull);

  dir.children = nodes.map(node => {
    node.parent = dir;
    return node;
  });
  return dir;
};

export class PseudoDirectory<StateDataType = { [key in string]: any }> {
  type: "dir";
  get name(): string {
    return path.basename(this.pathFromRoot);
  }
  pathFromRoot: string;
  children: (PseudoNode)[] = [];
  stateData: StateDataType;
  parent: PseudoDirectory | null;
  rootNodeRule: DirNodeRule;

  get nodeRule(): DirNodeRule {
    return (findNodeRule(
      this.pathFromRoot,
      this.rootPath,
      this.rootNodeRule,
      true
    ) || [new DirNodeRule()])[0];
  }

  get nodeRulePath(): string | null {
    return (findNodeRule(
      this.pathFromRoot,
      this.rootPath,
      this.rootNodeRule,
      true
    ) || [, null])[1];
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
      if (foundChild.type === "dir") {
        return foundChild.findNodeFromThis(splittedPathFromChild);
      }

      if (splittedPathFromChild.length === 0) {
        return foundChild;
      }
    }
    return null;
  }

  localState: State;

  get root(): PseudoDirectory {
    if (!this.parent) {
      return this;
    }
    return this.parent.root;
  }

  rootPath: string;

  get path(): string {
    return path.resolve(this.rootPath, this.pathFromRoot);
  }

  constructor(
    pathFromRoot: string,
    parent: PseudoDirectory | null,
    stateData: StateDataType,
    rootPath: string,
    rootNodeRule: DirNodeRule
  ) {
    this.type = "dir";
    this.pathFromRoot = pathFromRoot;
    this.stateData = stateData;
    this.localState = new State();
    this.parent = parent;
    this.rootPath = rootPath;
    this.rootNodeRule = rootNodeRule;
  }
}

export const getRootDirectory = (
  rootPath: string,
  rootNodeRule: DirNodeRule
) => {
  const root: PseudoDirectory = readdirAsPseudoDirectory(
    ".",
    rootPath,
    null,
    rootNodeRule,
    {
      ignore: ["node_modules", ".git"]
    }
  );
  return root;
};
