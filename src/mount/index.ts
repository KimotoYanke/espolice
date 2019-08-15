import * as chokidar from "chokidar";
import { DirNodeRule, isDirNodeRule } from "../rule/dir";
import * as path from "path";
import * as t from "@babel/types";
import * as fs from "mz/fs";
import { NodeRule } from "../rule";
import { State } from "./state";
import { parse } from "@babel/parser";
import { isFileNodeRule, FileNodeRule } from "../rule/file";
import { patternMatchAST, patternResetAST } from "../pattern-matcher";
import generate from "@babel/generator";
import { toProgram } from "./to-program";
import { MatchedList } from "../pattern-matcher/matched-list";

type PseudoNode = PseudoDirectory | PseudoFile;

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
    return (
      findNodeRule(this.pathFromRoot, this.rootPath, this.rootNodeRule, true) ||
      new DirNodeRule()
    );
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

export class PseudoFile<StateDataType = { [key in string]: any }> {
  type: "file";
  pathFromRoot: string;
  writingByUs: boolean = false;

  get name(): string {
    return path.basename(this.pathFromRoot);
  }
  parent: PseudoDirectory;
  ast?: t.Node;
  localState: State;

  get getState(): <S extends string>(
    nodeRule: FileNodeRule,
    ...args: S[]
  ) => { [key in S]: any } {
    const getStateData = (key: string): any => {
      return this.localState.data[key];
    };
    const setStateData = (key: string, data: any) => {
      this.localState.data[key] = data;
    };
    return <S extends string>(nodeRule: FileNodeRule, ...keys: S[]) => {
      let result: { [key in S]?: any } = {};
      for (const key of keys) {
        this.localState.datumUser[key] = nodeRule;
        result = {
          ...result,
          get [key]() {
            return getStateData(key);
          },
          set [key](val: any) {
            setStateData(key, val);
          }
        };
      }
      return result as { [key in S]: any };
    };
  }

  get root(): PseudoDirectory {
    return this.parent.root;
  }

  get rootPath(): string {
    return this.parent.rootPath;
  }

  get path(): string {
    return path.resolve(this.rootPath, this.pathFromRoot);
  }

  get nodeRule(): FileNodeRule {
    const defaultFileNodeRule: FileNodeRule = () => t.program([]);
    return (
      findNodeRule(
        this.pathFromRoot,
        this.rootPath,
        this.root.nodeRule,
        false
      ) || defaultFileNodeRule
    );
  }

  get template(): t.Program {
    const tmplAst = this.nodeRule({
      parent: this.parent,
      getState: this.getState
    });
    const tmpl = toProgram(tmplAst);
    return tmpl;
  }

  matched: MatchedList = {};
  writeForNewAst(newAst: t.Node) {
    const tmpl = this.template;
    const matched = patternMatchAST(tmpl, newAst, false);
    console.log(tmpl);
    if (matched) {
      this.matched = matched;
    }
    this.write();
  }

  write() {
    this.writingByUs = true;
    const newObj = patternResetAST(this.template, this.matched, false);
    this.ast = newObj as t.Program;
    console.log(generate(newObj).code);
    fs.writeFileSync(
      path.join(this.rootPath, this.pathFromRoot),
      generate(newObj).code
    );
  }

  read() {
    const code = fs.readFileSync(this.path).toString();
    const ast = parse(code, {
      allowImportExportEverywhere: true
    }).program;
    this.ast = ast;
    return ast;
  }

  constructor(pathFromRoot: string, parent: PseudoDirectory) {
    this.type = "file";
    this.parent = parent;
    this.pathFromRoot = pathFromRoot;
    this.localState = new State();
  }
}

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

const findNodeRule = <T extends boolean>(
  pathFromRoot: string,
  rootPath: string,
  rootNodeRule: DirNodeRule,
  isDirNodeRule?: T
):
  | (T extends true ? DirNodeRule : T extends false ? FileNodeRule : NodeRule)
  | null => {
  const splittedPath = path
    .relative(path.resolve(rootPath), path.resolve(rootPath, pathFromRoot))
    .split("/");
  console.log(
    { pathFromRoot, splittedPath, rootNodeRule },
    path.relative(path.resolve(rootPath), path.resolve(rootPath, pathFromRoot)),
    path.join(...splittedPath)
  );
  if (path.normalize(path.join(...splittedPath)) === ".") {
    return (isDirNodeRule === true ? rootNodeRule : null) as
      | (T extends true
          ? DirNodeRule
          : T extends false
          ? FileNodeRule
          : NodeRule)
      | null;
  }
  const node: NodeRule | null = splittedPath.reduce<NodeRule | null>(
    (prev, current: string, currentIndex, array) => {
      if (prev === null) {
        return null;
      }

      if (isFileNodeRule(prev)) {
        return null;
      }

      if (currentIndex === array.length - 1) {
        if (isDirNodeRule === true) {
          return prev.childDirNodes[current] || prev.otherDirNode || null;
        }
        if (isDirNodeRule === false) {
          return prev.childFileNodes[current] || prev.otherFileNode || null;
        }
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
  return node as
    | (T extends true ? DirNodeRule : T extends false ? FileNodeRule : NodeRule)
    | null;
};

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
  const root: PseudoDirectory = readdirAsPseudoDirectory(
    ".",
    rootPath,
    null,
    rootNodeRule,
    {
      ignore: ["node_modules", ".git"]
    }
  );
  root.pathFromRoot = ".";
  const findNodeFromRoot = (pathFromRoot: string) =>
    root.findNodeFromThis(pathFromRoot);
  let flags: { [key in string]: boolean } = {};

  watcher.on("all", (event, p, stats) => {
    const pathFromRoot = path.relative(path.resolve(rootPath), path.resolve(p));
    if (flags[pathFromRoot]) {
      flags[pathFromRoot] = false;
      return;
    }
    const splittedPath = pathFromRoot.split("/");
    const parentPath = path.join(...splittedPath.slice(0, -1)) || null;
    const thisNode = root.findNodeFromThis(pathFromRoot);
    const thisNodeRule = findNodeRule(pathFromRoot, rootPath, rootNodeRule);
    console.log({ thisNodeRule });
    if (!thisNodeRule) {
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
        if (isDirNodeRule(thisNodeRule)) {
          thisNodeRule.childDirNodes;
        }
        break;
    }
  });
};
