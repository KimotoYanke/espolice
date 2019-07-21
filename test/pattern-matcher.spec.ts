import template from "@babel/template";
import { patternMatch } from "../src/pattern-matcher/pattern-matcher";
import "jest-extended";
import { isGroup } from "../src/pattern-matcher/is-group";
import { isNode } from "../src/pattern-matcher/is-node";
import { nodePurify } from "../src/pattern-matcher/node-purify";
import * as t from "@babel/types";

describe("pattern-match", () => {
  test("string", () => {
    const result = patternMatch("ingBing".split(""), "ingbbing".split(""), {
      isGroup: str =>
        str === "A"
          ? { type: "MULTIPLE", as: "A" }
          : str === "B"
          ? { type: "MULTIPLE", as: "B" }
          : false
    });
    if (typeof result === "boolean") {
      expect(result).not.toBeBoolean();
      return;
    }
    expect(result).toEqual({ B: "bb".split("") });
  });
  test("string-start", () => {
    const result = patternMatch("*ing".split(""), "straaingaaing".split(""), {
      isGroup: str => (str === "*" ? { type: "MULTIPLE", as: "A" } : false)
    });
    if (typeof result === "boolean") {
      expect(result).not.toBeBoolean();
      return;
    }
    expect(result).toEqual({ A: "straaingaa".split("") });
  });
  test("string-multi", () => {
    const result = patternMatch(
      "aAingBing".split(""),
      "aaaingbbing".split(""),
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
    expect(result).toStrictEqual({
      A: "aa".split(""),
      B: "bb".split("")
    });
  });

  test("object-multi", () => {
    const result = patternMatch(
      { a: "a", b: "b", any: "ANY" },
      { a: "a", b: "b", any: "placedString" },
      {
        isGroup: str =>
          str === "ANY" ? { type: "MULTIPLE", as: "ANY" } : false
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

  test("is-group", () => {
    const tmplAst = template.statement`"defaultFunc = @any"`();

    expect(t.isExpressionStatement(tmplAst)).toBeTruthy();
    expect(isGroup(tmplAst)).not.toBeFalsy();
  });

  test("node-purify", () => {
    const tmplAst = nodePurify(
      template.statement`
    {
      "defaultFunc = @any";
    }
    `()
    );

    expect(tmplAst.directives).toHaveLength(0);
  });

  /*test("node", () => {
    const tmplAst = [
      {
        type: "ExpressionStatement",
        expression: { type: "StringLiteral", value: "placement = @any" }
      }
    ];

    const objAst = [
      {
        type: "ExpressionStatement",
        expression: { type: "StringLiteral", value: "placedString" }
      }
    ];

    const result = patternMatch(tmplAst, objAst, {
      isGroup: isGroup,
      isNode: isNode
    });
    if (typeof result === "boolean") {
      expect(result).not.toBeBoolean();
      return;
    }
    expect(result.matched).toEqual({
      placement: [
        {
          type: "ExpressionStatement",
          expression: { type: "StringLiteral", value: "placedString" }
        }
      ]
    });
  });*/
});
