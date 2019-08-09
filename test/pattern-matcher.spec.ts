import template from "@babel/template";
import {
  patternMatch,
  GroupResult
} from "../src/pattern-matcher/pattern-matcher";
import "jest-extended";
import { nodePurify } from "../src/node/node-purify";
import * as t from "@babel/types";
import { patternMatchAST } from "../src/pattern-matcher";

describe("パターンマッチ", () => {
  describe("文字列でのテスト", () => {
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
        opts
      );
      expect(result1).toBeFalse();

      const result2 = patternMatch(
        "AArem Bum".split(""),
        "lorem ipsum".split(""),
        opts
      );
      expect(result2).toStrictEqual({
        A: "o",
        B: "ips".split("")
      });
    });
  });
  test("オブジェクトでのテスト", () => {
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

      const result = patternMatchAST(tmplAst, objAst);
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

      const result = patternMatchAST(tmplAst, objAst);
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

      const result = patternMatchAST(tmplAst, objAst);
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

      const result = patternMatchAST(tmplAst, objAst);
      expect(result).toBeFalse();
    });

    describe("オブジェクトの場合", () => {
      test("プロパティの名前を指定してグループ化", () => {
        const tmplAst = nodePurify(
          template.program`
            export default {
              name:"one=@any",
              data:"two=@any",
            }`()
        );

        const objAst = nodePurify(
          template.program`
            export default {
              data:"two",
              name:"one",
            }`()
        );

        const result = patternMatchAST(tmplAst, objAst);
        expect(result).toEqual({
          one: t.stringLiteral("one"),
          two: t.stringLiteral("two")
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

        const result = patternMatchAST(tmplAst, objAst);
        expect(result).toEqual({
          one: t.stringLiteral("one"),
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

      const result = patternMatchAST(tmpl, obj);
      expect(result).toEqual({
        a: [],
        b: [0, 1, 2, 3].map(n => t.numericLiteral(n))
      });
    });

    test("空", () => {
      const tmpl = template.program`console.log("a = @any", "b=@any")`();
      const obj = template.program``();

      const result = patternMatchAST(tmpl, obj);
      expect(result).toBeFalse();
    });
  });
});
