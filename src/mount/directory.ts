import { PseudoNode } from ".";
import { DirNodeRule } from "..";
import { State, NodeRulePath, StateInterface } from "./state";
import * as path from "path";
import { findNodeRule } from "./find-node-rule";
import * as fs from "fs";
import { PseudoFile } from "./file";
import {
  mkdirpSync,
  isFileExistSync,
  rmpDirSync,
  isDirectoryExistSync
} from "./util";
import { Options } from "./options";
import { file } from "@babel/types";

const readdirAsPseudoDirectory = (
  pathFromRoot: string,
  rootPath: string,
  parent: PseudoDirectory | null,
  rootNodeRule: DirNodeRule,
  stateInterface: StateInterface,
  opts: Options
): PseudoDirectory => {
  const notNull = <T>(nullable: T | null): nullable is T => {
    return nullable !== null;
  };
  const dir = new PseudoDirectory(
    pathFromRoot,
    parent,
    rootPath,
    rootNodeRule,
    opts
  );
  const nodes = fs
    .readdirSync(path.resolve(rootPath, pathFromRoot))
    .map((childName: string): PseudoNode | null => {
      const newPathFromRoot = path.join(pathFromRoot, childName);
      if (opts && opts.ignore.includes(newPathFromRoot)) {
        return null;
      }
      if (fs.statSync(path.resolve(rootPath, newPathFromRoot)).isDirectory()) {
        const result = readdirAsPseudoDirectory(
          newPathFromRoot,
          rootPath,
          dir,
          rootNodeRule,
          stateInterface,
          opts
        );

        return result;
      }

      const result: PseudoFile = new PseudoFile(
        newPathFromRoot,
        dir,
        stateInterface
      );
      return result;
    })
    .filter(notNull);

  dir.children = nodes.map(node => {
    node.parent = dir;
    return node;
  });
  return dir;
};

export const addNewDirectory = (
  pathFromRoot: string,
  rootPath: string,
  rootNodeRule: DirNodeRule,
  root: PseudoDirectory,
  opts: Options
): PseudoDirectory | null => {
  const parentPathFromRoot = path.resolve(pathFromRoot, "..");
  const parent =
    root.findNodeFromThis(parentPathFromRoot) ||
    addNewDirectory(parentPathFromRoot, rootPath, rootNodeRule, root, opts);
  if (!parent || parent.type !== "dir") {
    return null;
  }

  const dir = new PseudoDirectory(
    pathFromRoot,
    parent,
    rootPath,
    rootNodeRule,
    opts
  );

  parent.children.push(dir);
  return dir;
};

export class PseudoDirectory {
  type: "dir";
  get name(): string {
    return path.basename(this.pathFromRoot);
  }
  pathFromRoot: string;
  children: (PseudoNode)[] = [];
  get childrenFiles(): string[] {
    return this.children
      .filter((n: PseudoNode): n is PseudoFile => n.type === "file")
      .map(n => path.basename(n.pathFromRoot));
  }
  get childrenDirs(): string[] {
    return this.children
      .filter((n: PseudoNode): n is PseudoFile => n.type === "dir")
      .map(n => path.basename(n.pathFromRoot));
  }
  parent: PseudoDirectory | null;
  rootNodeRule: DirNodeRule;
  isWriting: boolean = false;

  disabled: boolean = false;
  get enabled() {
    return !this.disabled;
  }

  get nodeRule(): DirNodeRule {
    return (findNodeRule(
      this.pathFromRoot,
      this.rootPath,
      this.rootNodeRule,
      true
    ) || [new DirNodeRule()])[0];
  }

  get nodeRulePath(): NodeRulePath | null {
    return (findNodeRule(
      this.pathFromRoot,
      this.rootPath,
      this.rootNodeRule,
      true
    ) || [, null])[1];
  }

  get dependentFiles(): PseudoFile[] {
    return Object.values(this.mapDependentFiles);
  }
  mapDependentFiles: { [keyof in string]: PseudoFile } = {};
  addDependentFile(file: PseudoFile) {
    this.mapDependentFiles[file.pathFromRoot] = file;
  }

  findNodeFromThis(pathFromThis: string | string[]): PseudoNode | null {
    if (pathFromThis === ".") {
      return this;
    }
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

  write() {
    if (this.disabled) {
      return;
    }

    const thisFullpath = path.join(this.rootPath, this.pathFromRoot);
    mkdirpSync(thisFullpath);
    for (const dirName of Object.keys(this.nodeRule.childDirNodes)) {
      const directoryFullPath = path.resolve(
        this.rootPath,
        this.pathFromRoot,
        dirName
      );
      mkdirpSync(directoryFullPath);
    }

    for (const fileName of Object.keys(this.nodeRule.childFileNodes)) {
      const fileFullPath = path.resolve(
        this.rootPath,
        this.pathFromRoot,
        fileName
      );
      if (!isFileExistSync(fileFullPath)) {
        fs.writeFileSync(fileFullPath, "");
      }
    }
  }

  remove() {
    this.disabled = true;
    while (this.children.length > 0) {
      this.children[0].remove();
    }

    if (this.parent) {
      const filtered = this.parent.children.filter(
        node =>
          !(node.type === "dir" && node.pathFromRoot === this.pathFromRoot)
      );

      this.parent.children = filtered;

      this.parent.isWriting = true;
      this.parent.write();
      this.parent.syncDependents();
      this.parent.isWriting = false;
    }
    rmpDirSync(this.path);
  }

  syncDependents() {
    if (this.disabled) {
      return;
    }
    for (let i = 0; i < this.dependentFiles.length; i++) {}
    for (const file of this.dependentFiles) {
      file.flagIsWriting = true;
      file.sync();
    }
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

  options: Options;

  initialRegistration() {
    const thisFullPath = path.resolve(this.rootPath, this.pathFromRoot);
    if (this.disabled) {
      return;
    }
    this.rootNodeRule.dirInitFunction(this.pathFromRoot);

    const dirNames = Object.keys(this.nodeRule.childDirNodes);
    const fileNames = Object.keys(this.nodeRule.childFileNodes);
    for (const fileName of fileNames) {
      const file = this.findNodeFromThis(fileName);
      if (file) {
        file.initialRegistration();
      }
    }

    for (const dirName of dirNames) {
      const dir = this.findNodeFromThis(dirName);
      if (dir) {
        dir.initialRegistration();
      }
    }

    const ls = fs.readdirSync(thisFullPath);

    for (const fileName of ls.filter(
      f =>
        isFileExistSync(path.resolve(this.rootPath, this.pathFromRoot, f)) &&
        !fileNames.includes(f)
    )) {
      const file = this.findNodeFromThis(fileName);
      if (file) {
        file.initialRegistration();
      }
    }

    for (const dirName of ls.filter(
      f =>
        isDirectoryExistSync(
          path.resolve(this.rootPath, this.pathFromRoot, f)
        ) && !dirNames.includes(f)
    )) {
      const dir = this.findNodeFromThis(dirName);
      if (dir) {
        dir.initialRegistration();
      }
    }
  }

  constructor(
    pathFromRoot: string,
    parent: PseudoDirectory | null,
    rootPath: string,
    rootNodeRule: DirNodeRule,
    options: Options
  ) {
    this.type = "dir";
    this.pathFromRoot = pathFromRoot;
    this.localState = new State();
    this.parent = parent;
    this.rootPath = rootPath;
    this.rootNodeRule = rootNodeRule;
    this.options = options;
  }
}

export const getRootDirectory = (
  rootPath: string,
  rootNodeRule: DirNodeRule,
  stateInterface: StateInterface,
  opts: Options
) => {
  const root: PseudoDirectory = readdirAsPseudoDirectory(
    ".",
    rootPath,
    null,
    rootNodeRule,
    stateInterface,
    opts
  );
  return root;
};
