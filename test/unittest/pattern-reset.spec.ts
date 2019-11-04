import "jest-extended";
import { patternMatch } from "../../src/pattern-matcher/pattern-match";
import { patternReset } from "../../src/pattern-matcher/pattern-reset";
import { MatchOptions } from "../../src/pattern-matcher/matched-list";
import { nodePurify } from "../../src/node/node-purify";
import template from "@babel/template";
import { patternMatchAST, patternResetAST } from "../../src/pattern-matcher";
import * as t from "@babel/types";

describe("パターンを元に戻す", () => {
  describe("文字列でのテスト", () => {
    test("1回グループ化", () => {
      const opts: Partial<MatchOptions> = {
        isGroup: str => (str === "*" ? { type: "MULTIPLE", as: "*" } : false),
        fromGroup: group => {
          return group.as;
        }
      };
      const matched = patternMatch(
        "lo*um".split(""),
        "lorem ipsum".split(""),
        opts
      );
      if (typeof matched === "boolean") {
        expect(matched).not.toBeBoolean();
        return;
      }

      const obj = patternReset("lo*um".split(""), matched, {
        ...opts
      });
      expect(obj.join("")).toEqual("lorem ipsum");
    });

    test("複数回グループ化", () => {
      const opts: Partial<MatchOptions> = {
        isGroup: str =>
          str === "A"
            ? { type: "MULTIPLE", as: "A" }
            : str === "B"
            ? { type: "MULTIPLE", as: "B" }
            : false,
        fromGroup: group => {
          return group.as;
        }
      };
      const matched = patternMatch(
        "loA Bum".split(""),
        "lorem ipsum".split(""),
        opts
      );
      if (typeof matched === "boolean") {
        expect(matched).not.toBeBoolean();
        return;
      }

      const obj = patternReset("loA Bum".split(""), matched, {
        ...opts
      });
      expect(obj.join("")).toEqual("lorem ipsum");
    });
  });
  describe("ノードでのテスト", () => {
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

      const matched = patternMatchAST(tmplAst, objAst);
      if (typeof matched === "boolean") {
        expect(matched).not.toBeBoolean();
        return;
      }

      expect(patternResetAST(tmplAst, matched)).toEqual(objAst);
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

      const matched = patternMatchAST(tmplAst, objAst);
      if (typeof matched === "boolean") {
        expect(matched).not.toBeBoolean();
        return;
      }
      expect(patternResetAST(tmplAst, matched)).toEqual(objAst);
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

      const matched = patternMatchAST(tmplAst, objAst);
      if (typeof matched === "boolean") {
        expect(matched).not.toBeBoolean();
        return;
      }
      expect(patternResetAST(tmplAst, matched)).toEqual(objAst);
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

        const matched = patternMatchAST(tmplAst, objAst);
        if (typeof matched === "boolean") {
          expect(matched).not.toBeBoolean();
          return;
        }
        expect(patternResetAST(tmplAst, matched)).toEqual(
          nodePurify(
            template.program`
        export default {
          name:"one",
          data:"two",
        }`()
          )
        );
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

        const matched = patternMatchAST(tmplAst, objAst);
        if (typeof matched === "boolean") {
          expect(matched).not.toBeBoolean();
          return;
        }
        expect(matched).toEqual({
          one_0: t.stringLiteral("one"),
          two: t.stringLiteral("two"),
          rest: [
            t.objectProperty(
              t.identifier("otherObject1"),
              t.stringLiteral("other")
            )
          ]
        });

        expect(patternResetAST(tmplAst, matched)).toEqual(
          nodePurify(
            template.program`
              export default {
                name: "one",
                data: "two",
                property: property,
                otherObject1: "other"
              }
            `()
          )
        );
      });
      test("testcase", () => {
        const tmpl: t.Program = template.program`
          "@any";
        `();
        const matched = {
          any_0: [
            {
              type: "ExpressionStatement",
              expression: { type: "StringLiteral", value: "a" }
            }
          ]
        };

        expect(patternResetAST(tmpl as t.Node, matched)).toEqual({
          type: "Program",
          body: [
            {
              type: "ExpressionStatement",
              expression: { type: "StringLiteral", value: "a" }
            }
          ],
          directives: [],
          interpreter: null
        });
      });
    });
  });
});
