import { FileNodeRule, isFileNodeRule } from "./file";
import { NodeRule } from ".";

type ChildrenOption<T> = {
  key: (t: T, i: number) => string;
};

export class DirNodeRule<Option = {}> {
  childFileNodes: { [key: string]: FileNodeRule } = {};
  childDirNodes: { [key: string]: DirNodeRule } = {};

  dirInitFunction: (p: string) => void = () => {};
  setDirInitFunction(emitFunction: (p: string) => void) {
    this.dirInitFunction = emitFunction;
  }
  fileInitFunction: (p: string) => void = () => {};
  setFileInitFunction(emitFunction: (p: string) => void) {
    this.fileInitFunction = emitFunction;
  }

  haveChildFile(f: FileNodeRule, filename: string) {
    this.childFileNodes[filename] = f;
    return this;
  }
  haveChildDir(d: DirNodeRule, filename: string) {
    this.childDirNodes[filename] = d;
    return this;
  }

  otherFileNode?: FileNodeRule;
  otherDirNode?: DirNodeRule;

  otherDirsMountedName: string = "otherDirs";
  otherFilesMountedName: string = "otherFiles";
  otherChildrenDirs(
    f: DirNodeRule | (() => DirNodeRule),
    mountedName?: string,
    opts?: ChildrenOption<DirNodeRule>
  ): DirNodeRule<Option> {
    if (typeof f === "function") {
      f = f();
    }
    if (mountedName) {
      this.otherDirsMountedName = mountedName;
    }
    this.otherDirNode = f;
    return this;
  }
  otherChildrenFiles<NewStateKey extends string>(
    f: FileNodeRule,
    mountedName?: NewStateKey,
    opts?: ChildrenOption<FileNodeRule>
  ): DirNodeRule<Option> {
    if (mountedName) {
      this.otherFilesMountedName = mountedName;
    }
    this.otherFileNode = f;
    return this;
  }
}

export const isDirNodeRule = (rule: NodeRule): rule is DirNodeRule => {
  return !isFileNodeRule(rule);
};

export const dir = (): DirNodeRule => {
  return new DirNodeRule();
};
