import * as path from "path";
import { PseudoDirectory, addNewDirectory } from "./directory";
import { NodeRulePath, StateInterface } from "./state";
import { FileNodeRule, DirNodeRule } from "..";
import { findNodeRule } from "./find-node-rule";
import { toProgram } from "./to-program";
import { MatchedList } from "../pattern-matcher/matched-list";
import { patternMatchAST, patternResetAST } from "../pattern-matcher";
import { fs } from "mz";
import generate, { GeneratorOptions } from "@babel/generator";
import * as t from "@babel/types";
import { parse } from "@babel/parser";
import { nodePurify } from "../node/node-purify";
import { isEqual } from "lodash";
import { isFileExistSync } from "./util";

export const addNewFile = (
  pathFromRoot: string,
  rootPath: string,
  rootNodeRule: DirNodeRule,
  root: PseudoDirectory,
  stateInterface: StateInterface,
  opts?: { ignore: string[] }
): PseudoFile | null => {
  const parentPathFromRoot = path.dirname(pathFromRoot);
  const parent =
    root.findNodeFromThis(parentPathFromRoot) ||
    addNewDirectory(parentPathFromRoot, rootPath, rootNodeRule, root, opts);
  if (!parent || parent.type !== "dir") {
    return null;
  }

  const file = new PseudoFile(pathFromRoot, parent, stateInterface);

  parent.children.push(file);
  return file;
};

export class PseudoFile {
  type: "file";
  pathFromRoot: string;
  flagIsWriting: boolean = false;

  get name(): string {
    return path.basename(this.pathFromRoot);
  }
  parent: PseudoDirectory;
  ast?: t.Node;
  stateInterface!: StateInterface;
  get getStateDatum() {
    return this.stateInterface.getStateDatum;
  }
  get setStateDatum() {
    return this.stateInterface.setStateDatum;
  }

  addDatumUser(key: string) {
    if (this.nodeRulePath) {
      this.stateInterface.addDatumUser(key, this.nodeRulePath);
    }
  }
  get allStateData() {
    return this.stateInterface.getAllStateData();
  }

  get getState(): <S extends string>(...args: S[]) => { [key in S]: any } {
    const getStateData = (key: string): any => {
      return this.getStateDatum(key);
    };
    const setStateData = (key: string, data: any) => {
      this.setStateDatum(key, data);
    };
    return <S extends string>(...keys: S[]) => {
      let result: { [key in S]?: any } = {};
      for (const key of keys) {
        this.addDatumUser(key);
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

  get getParent(): () => PseudoDirectory {
    return () => {
      this.parent.addDependentFile(this);
      return this.parent;
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
      (findNodeRule(
        this.pathFromRoot,
        this.rootPath,
        this.root.nodeRule,
        false
      ) || [defaultFileNodeRule])[0] || defaultFileNodeRule
    );
  }

  get nodeRulePath(): NodeRulePath | null {
    return (findNodeRule(
      this.pathFromRoot,
      this.rootPath,
      this.root.nodeRule,
      false
    ) || [, null])[1];
  }

  get template(): t.Program {
    const tmplAst = this.nodeRule({
      getParent: this.getParent,
      getState: this.getState,
      getPath: () => this.pathFromRoot
    });
    const tmpl = toProgram(tmplAst);
    return tmpl;
  }

  matched: MatchedList = {};
  writeForNewAst(newAst: t.Node) {
    const tmpl = this.template;
    const matched = patternMatchAST(tmpl, newAst, false);
    if (matched) {
      this.matched = matched;
      for (const key in matched) {
        if (!key.match(/^((one)|(some)|(any))_\d+$/)) {
          this.setStateDatum(key, matched[key]);
        }
      }
    }
    this.write();
  }

  write() {
    const newObj = patternResetAST(this.template, { ...this.matched }, false);
    const generateWithOpts = (obj: t.Program, newOptions: GeneratorOptions) => {
      const options: GeneratorOptions = {
        jsonCompatibleStrings: true
      };
      options.jsescOption = {};
      // @ts-ignore
      options.jsescOption["minimal"] = true;
      return generate(obj, { ...options, ...newOptions });
    };
    if (isEqual(newObj, this.ast)) {
      return;
    }
    this.ast = newObj as t.Program;
    this.flagIsWriting = true;
    fs.writeFileSync(
      path.join(this.rootPath, this.pathFromRoot),
      generateWithOpts(newObj, { jsonCompatibleStrings: true }).code
    );
  }

  read() {
    if (!(fs.existsSync(this.path) && isFileExistSync(this.path))) {
      return null;
    }
    const code = fs.readFileSync(this.path).toString();
    const ast = parse(code, {
      allowImportExportEverywhere: true
    }).program;
    this.ast = nodePurify(ast);
    return ast;
  }

  sync() {
    const readAst = this.read();

    if (!readAst) {
      return;
    }
    this.writeForNewAst(readAst);
  }

  constructor(
    pathFromRoot: string,
    parent: PseudoDirectory,
    stateInterface: StateInterface
  ) {
    this.type = "file";
    this.parent = parent;
    this.pathFromRoot = pathFromRoot;
    this.stateInterface = stateInterface;
  }
}
