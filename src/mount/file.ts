import * as path from "path";
import { PseudoDirectory } from "./directory";
import { State } from "./state";
import { FileNodeRule } from "..";
import { findNodeRule } from "./find-node-rule";
import { toProgram } from "./to-program";
import { MatchedList } from "../pattern-matcher/matched-list";
import { patternMatchAST, patternResetAST } from "../pattern-matcher";
import { fs } from "mz";
import generate from "@babel/generator";
import * as t from "@babel/types";
import { parse } from "@babel/parser";

export class PseudoFile<StateDataType = { [key in string]: any }> {
  type: "file";
  pathFromRoot: string;
  flagIsWriting: boolean = false;

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
    return (findNodeRule(
      this.pathFromRoot,
      this.rootPath,
      this.root.nodeRule,
      false
    ) || [defaultFileNodeRule])[0];
  }

  get nodeRulePath(): string | null {
    return (findNodeRule(
      this.pathFromRoot,
      this.rootPath,
      this.root.nodeRule,
      false
    ) || [, null])[1];
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
    if (matched) {
      this.matched = matched;
    }
    this.write();
  }

  write() {
    this.flagIsWriting = true;
    const newObj = patternResetAST(this.template, this.matched, false);
    this.ast = newObj as t.Program;
    console.log(JSON.stringify(this.template));
    console.log(JSON.stringify(this.ast));
    console.log(JSON.stringify(this.matched));
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
