import * as path from "path";
import { PseudoDirectory, addNewDirectory } from "./directory";
import { NodeRulePath, StateInterface } from "./state";
import { FileNodeRule, DirNodeRule } from "..";
import { findNodeRule } from "./find-node-rule";
import { toProgram } from "./to-program";
import { MatchedList } from "../pattern-matcher/matched-list";
import { patternMatchAST, patternResetAST } from "../pattern-matcher";
import * as fs from "fs";
import generate, { GeneratorOptions } from "@babel/generator";
import * as t from "@babel/types";
import { parse } from "@babel/parser";
import { nodePurify } from "../node/node-purify";
import { isFileExistSync, lsDirectorySync, rmpFileSync } from "./util";
import { Options } from "./options";
import { deepEqual } from "fast-equals";
import { eventLog } from "../cli/util";

export const addNewFile = (
  pathFromRoot: string,
  rootPath: string,
  rootNodeRule: DirNodeRule,
  root: PseudoDirectory,
  stateInterface: StateInterface,
  opts: Options
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
    const defaultFileNodeRule: FileNodeRule = () =>
      t.program([t.expressionStatement(t.stringLiteral("@any"))]);
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
  writeForNewAst(newAst: t.Node, state: MatchedList = {}) {
    const tmpl = this.template;
    const matched = patternMatchAST(tmpl, newAst, this.matched, false);
    if (matched) {
      this.matched = { ...matched, ...this.matched,  ...state };
      for (const key in matched) {
        if (!key.match(/^((one)|(some)|(any))_\d+$/)) {
          this.setStateDatum(key, matched[key]);
        }
      }
    }
    this.write();
  }

  get options(): Options {
    return this.parent.options;
  }

  generateCode(obj: t.Program): string {
    const generatorOptions: GeneratorOptions = {
      jsonCompatibleStrings: true
    };
    generatorOptions.jsescOption = {};
    // @ts-ignore
    generatorOptions.jsescOption["minimal"] = true;

    const babeledCode = generate(obj, { ...generatorOptions }).code;
    if (this.options.usePrettier) {
      try {
        return require("prettier").format(
          babeledCode,
          this.options.prettierOptions
        );
      } catch (e) {
        console.log("Error found: " + e);
      }
    }
    return babeledCode;
  }
  write() {
    const newObj = patternResetAST(this.template, { ...this.matched }, false);
    if (deepEqual(newObj, this.ast)) {
      return;
    }
    this.ast = newObj as t.Program;
    this.flagIsWriting = true;
    fs.writeFileSync(
      path.join(this.rootPath, this.pathFromRoot),
      this.generateCode(newObj)
    );
  }

  read() {
    if (!(fs.existsSync(this.path) && isFileExistSync(this.path))) {
      return null;
    }
    const code = fs.readFileSync(this.path).toString();
    let ast: t.Program | null = null;
    try {
      ast = parse(code, {
        allowImportExportEverywhere: true
      }).program;
    } catch (e) {
      eventLog("Code Error", this.pathFromRoot);
      console.log(e.toString());
      ast = null;
    }

    if (ast) {
      this.ast = nodePurify(ast);
      return ast;
    }
    return this.ast;
  }

  sync(state: MatchedList = {}) {
    const readAst = this.read();

    if (!readAst) {
      return;
    }
    this.writeForNewAst(readAst, state);
  }

  initialRegistration() {
    this.root.rootNodeRule.fileInitFunction(this.pathFromRoot);
  }

  remove() {
    if (this.nodeRulePath) {
      this.stateInterface.removeDatumUser(this.nodeRulePath);
    }

    if (this.parent) {
      const foundIndex = this.parent.children.findIndex(node => {
        return (
          node.type === "file" &&
          path.normalize(node.pathFromRoot) ===
            path.normalize(this.pathFromRoot)
        );
      });

      if (foundIndex >= 0) {
        this.parent.children.splice(foundIndex, 1);
      }

      this.parent.isWriting = true;
      this.parent.write();

      this.parent.syncDependents();
      this.parent.isWriting = false;
    }
    rmpFileSync(this.path);
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
