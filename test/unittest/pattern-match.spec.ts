import template from "@babel/template";
import { patternMatch } from "../../src/pattern-matcher/pattern-match";
import "jest-extended";
import { nodePurify } from "../../src/node/node-purify";
import * as t from "@babel/types";
import { patternMatchAST } from "../../src/pattern-matcher";
import { isGroup } from "../../src/node/is-group";
import { isNode } from "../../src/node/is-node";
import { GroupResult } from "../../src/pattern-matcher/matched-list";

describe("パターンマッチ", () => {
  describe("文字列でのテスト", () => {
    test("通常文字列", () => {
      const result = patternMatch(
        "lorem ipsum".split(""),
        "lorem ipsum".split(""),
        {}
      );
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({});
    });
    test("1回グループ化", () => {
      const result = patternMatch("lo*um".split(""), "lorem ipsum".split(""), {
        isGroup: str => (str === "*" ? { type: "MULTIPLE", as: "*" } : false)
      });
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({ "*": "rem ips".split("") });
    });
    test("複数回グループ化", () => {
      const result = patternMatch(
        "loA Bum".split(""),
        "lorem ipsum".split(""),
        {
          isGroup: str =>
            str === "A"
              ? { type: "MULTIPLE", as: "A" }
              : str === "B"
              ? { type: "MULTIPLE", as: "B" }
              : false
        }
      );
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({ A: "rem".split(""), B: "ips".split("") });
    });
    test("始まりでのグループ化", () => {
      const result = patternMatch(
        "*m ipsum".split(""),
        "lorem ipsum".split(""),
        {
          isGroup: str => (str === "*" ? { type: "MULTIPLE", as: "*" } : false)
        }
      );
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({ "*": "lore".split("") });
    });
    test("終わりでのグループ化", () => {
      const result = patternMatch(
        "lorem ip*".split(""),
        "lorem ipsum".split(""),
        {
          isGroup: str => (str === "*" ? { type: "MULTIPLE", as: "*" } : false)
        }
      );
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({ "*": "sum".split("") });
    });
    test("ANYでグループ化", () => {
      const result = patternMatch(
        "loA Bum".split(""),
        "lorem ipsum".split(""),
        {
          isGroup: str =>
            str === "A"
              ? { type: "ANY", as: "A" }
              : str === "B"
              ? { type: "MULTIPLE", as: "B" }
              : false
        }
      );
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toStrictEqual({
        A: "rem".split(""),
        B: "ips".split("")
      });
    });

    test("SINGLEでグループ化", () => {
      const opts = {
        isGroup: (str: string): GroupResult | false =>
          str === "A"
            ? { type: "SINGLE", as: "A" }
            : str === "B"
            ? { type: "MULTIPLE", as: "B" }
            : false
      };
      const result1 = patternMatch(
        "Arem Bum".split(""),
        "lorem ipsum".split(""),
        { ...opts }
      );
      expect(result1).toBeFalse();

      const result2 = patternMatch(
        "AArem Bum".split(""),
        "lorem ipsum".split(""),
        { ...opts }
      );
      expect(result2).toStrictEqual({
        A: "o",
        B: "ips".split("")
      });
    });
    test("同期", () => {
      const opts = {
        isGroup: (str: string): GroupResult | false =>
          str === "A" ? { type: "SINGLE", as: "A" } : false
      };
      const result1 = patternMatch(
        "Aorem Apsum".split(""),
        "lorem lpsum".split(""),
        { ...opts }
      );
      if (!result1) {
        expect(result1).toBeTruthy();
        return;
      }

      const result2 = patternMatch("A A".split(""), "i l".split(""), {
        ...opts,
        formerMatchedList: result1
      });
      expect(result2).toStrictEqual({
        A: "i"
      });
    });
  });
  describe("オブジェクトでのテスト", () => {
    test("オブジェクト", () => {
      const result = patternMatch(
        { a: "a", b: "b", any: "ANY" },
        { a: "a", b: "b", any: "placedString" },
        {
          isGroup: str => (str === "ANY" ? { type: "ANY", as: "ANY" } : false)
        }
      );
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toStrictEqual({
        ANY: "placedString"
      });
    });
    test("anyの順番", () => {
      const one = template.expression`"@one"`();
      const tmpl = { 1: one, obj: { 2: one, 3: one } } as unknown;
      const obj = { 1: 1, obj: { 2: 2, 3: 3 } } as unknown;

      const result = patternMatch(nodePurify(tmpl) as t.Node, obj as t.Node, {
        isGroup: isGroup
      });
      expect(result).toEqual({
        one_0: 1,
        one_1: 2,
        one_2: 3
      });
    });
    test("同期", () => {
      const one = template.expression`"a = @one"`();
      const tmpl = { 1: one, 2: one } as unknown;
      const obj1 = { 1: 1, 2: 1 } as unknown;
      const obj2 = { 1: 1, 2: 2 } as unknown;

      const result1 = patternMatch(nodePurify(tmpl) as t.Node, obj1 as t.Node, {
        isGroup: isGroup
      });
      expect(result1).toEqual({
        a: 1
      });

      if (!result1) {
        return;
      }
      const result2 = patternMatch(nodePurify(tmpl) as t.Node, obj2 as t.Node, {
        formerMatchedList: result1,
        isGroup
      });
      expect(result2).toStrictEqual({
        a: 2
      });
    });
  });

  describe("ノードでのテスト", () => {
    test("BlockStatementでdirectivesをbodyへ移管する", () => {
      const tmplAst = nodePurify(
        template.statement`
    {
      "defaultFunc = @any";
    }
    `()
      );

      expect(tmplAst.directives).toHaveLength(0);
    });

    test("Programでdirectivesをbodyへ移管する", () => {
      const tmplAst = nodePurify(
        template.program`
      "defaultFunc = @any";
    `()
      );

      expect(tmplAst.directives).toHaveLength(0);
    });

    test("1回グループ化", () => {
      const tmplAst = nodePurify(
        template.program`
      export default ()=>{
        "placement = @any"
      } 
    `()
      );

      const objAst = nodePurify(
        template.program`
      export default () => {
        console.log("hogehoge")
      } 
    `()
      );

      const result = patternMatchAST(tmplAst, objAst, {});
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({
        placement: [nodePurify(template.statement`console.log("hogehoge")`())]
      });
    });

    test("1つのグループ化で2つ取得する", () => {
      const tmplAst = nodePurify(
        template.program`
      export default ()=>{
        "placement = @any"
      } 
    `()
      );

      const objAst = nodePurify(
        template.program`
      export default () => {
        console.log("hogehoge")
        console.log("piyopiyo")
      } 
    `()
      );

      const result = patternMatchAST(tmplAst, objAst, {});
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({
        placement: [
          nodePurify(template.statement`console.log("hogehoge")`()),
          nodePurify(template.statement`console.log("piyopiyo")`())
        ]
      });
    });

    test("空配列をグループ化", () => {
      const tmplAst = nodePurify(
        template.program`
      export default ()=>{
        "placement = @any"
      } 
    `()
      );

      const objAst = nodePurify(
        template.program`
      export default () => {
      } 
    `()
      );

      const result = patternMatchAST(tmplAst, objAst, {});
      if (typeof result === "boolean") {
        expect(result).not.toBeBoolean();
        return;
      }
      expect(result).toEqual({
        placement: []
      });
    });

    test("マッチしない場合falseを返す", () => {
      const tmplAst = nodePurify(
        template.program`
      export default ()=>{
        "placement = @any"
      } 
    `()
      );

      const objAst = nodePurify(
        template.program`
      unneededFunctionCall()
      export default () => {
      } 
    `()
      );

      const result = patternMatchAST(tmplAst, objAst, {});
      expect(result).toBeFalse();
    });

    describe("オブジェクトの場合", () => {
      test("プロパティの名前を指定してグループ化", () => {
        const tmplAst = nodePurify(
          template.program`
            export default {
              name:"first=@any",
              data:"second=@any",
            }`()
        );

        const objAst = nodePurify(
          template.program`
            export default {
              data:"two",
              name:"one",
            }`()
        );

        const result = patternMatchAST(tmplAst, objAst, {});
        expect(result).toEqual({
          first: t.stringLiteral("one"),
          second: t.stringLiteral("two")
        });
      });

      test("プロパティの名前の残りをグループ化", () => {
        const tmplAst = nodePurify(
          template.program`
            export default {
              name:"@one",
              data:"two=@one",
              property: property,
              ..."rest=@any"
            }`()
        );

        const objAst = nodePurify(
          template.program`
            export default {
              data:"two",
              name:"one",
              property: property,
              otherObject1: "other",
            }`()
        );

        const result = patternMatchAST(tmplAst, objAst, {});
        expect(result).toEqual({
          one_0: t.stringLiteral("one"),
          two: t.stringLiteral("two"),
          rest: [
            t.objectProperty(
              t.identifier("otherObject1"),
              t.stringLiteral("other")
            )
          ]
        });
      });
    });

    test("後者総取り", () => {
      const tmpl = template.program`console.log("a = @any", "b=@any")`();
      const obj = template.program`console.log(0,1,2,3)`();

      const result = patternMatchAST(tmpl, obj, {});
      expect(result).toEqual({
        a: [],
        b: [0, 1, 2, 3].map(n => t.numericLiteral(n))
      });
    });

    test("空", () => {
      const tmpl = template.program`console.log("a = @any", "b=@any")`();
      const obj = template.program``();

      const result = patternMatchAST(tmpl, obj, {});
      expect(result).toBeFalse();
    });

    test("oneの順番", () => {
      const tmpl = template.program`a("@one", "@one");b("@one","@one")`();
      const obj = template.program`a(0, 1);b(2,3)`();

      const result = patternMatchAST(tmpl, obj, {});
      expect(result).toEqual({
        one_0: t.numericLiteral(0),
        one_1: t.numericLiteral(1),
        one_2: t.numericLiteral(2),
        one_3: t.numericLiteral(3)
      });
    });
    test("oneの順番 - 複数階層", () => {
      const tmpl = template.program`a("@one", "@one");b("@one",c("@one","@one"))`();
      const obj = template.program`a(0, 1);b(2,c(3,4))`();

      const result = patternMatchAST(tmpl, obj, {});
      expect(result).toEqual({
        one_0: t.numericLiteral(0),
        one_1: t.numericLiteral(1),
        one_2: t.numericLiteral(2),
        one_3: t.numericLiteral(3),
        one_4: t.numericLiteral(4)
      });
    });
    test("anyの順番 - 複数階層", () => {
      const tmpl = template.program`a("@one", "@any");b("@one",c("@one","@any"))`();
      const obj = template.program`a(0, 1);b(2,c(3,4))`();

      const result = patternMatchAST(tmpl, obj, {});
      expect(result).toEqual({
        one_0: t.numericLiteral(0),
        any_1: [t.numericLiteral(1)],
        one_2: t.numericLiteral(2),
        one_3: t.numericLiteral(3),
        any_4: [t.numericLiteral(4)]
      });
    });
    test("@anyを囲む", () => {
      const tmpl = template.program`a("@one");"@any";a("@one")`();
      const obj0 = template.program`a("a");a("b")`();
      const obj1 = template.program`a("a");b();a("b")`();

      const result0 = patternMatchAST(tmpl, obj0, {});
      expect(result0).not.toBeFalse();
      expect(result0).toStrictEqual({
        one_0: t.stringLiteral("a"),
        any_1: [],
        one_2: t.stringLiteral("b")
      });

      const result1 = patternMatchAST(tmpl, obj1, {});
      expect(result1).not.toBeFalse();
      expect(result1).toStrictEqual({
        one_0: t.stringLiteral("a"),
        any_1: [t.expressionStatement(t.callExpression(t.identifier("b"), []))],
        one_2: t.stringLiteral("b")
      });
    });
  });
});
