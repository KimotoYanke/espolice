import template from "@babel/template";
import {
  patternMatch,
  GroupResult
} from "../src/pattern-matcher/pattern-matcher";
import "jest-extended";
import { isGroup } from "../src/pattern-matcher/is-group";
import { nodePurify } from "../src/pattern-matcher/node-purify";
import * as t from "@babel/types";
import { isNode } from "../src/pattern-matcher/is-node";

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
  test("string-empty", () => {
    const result = patternMatch("ingBing".split(""), "inging".split(""), {
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
    expect(result).toEqual({ B: "".split("") });
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
  test("string-end", () => {
    const result = patternMatch("str*".split(""), "string".split(""), {
      isGroup: str => (str === "*" ? { type: "MULTIPLE", as: "A" } : false)
    });
    if (typeof result === "boolean") {
      expect(result).not.toBeBoolean();
      return;
    }
    expect(result).toEqual({ A: "ing".split("") });
  });
  test("string-multi", () => {
    const result = patternMatch(
      "aAingBing".split(""),
      "aaaingbbing".split(""),
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
      A: "aa".split(""),
      B: "bb".split("")
    });
  });

  test("string-single", () => {
    const opts = {
      isGroup: (str: string): GroupResult | false =>
        str === "A"
          ? { type: "SINGLE", as: "A" }
          : str === "B"
          ? { type: "MULTIPLE", as: "B" }
          : false
    };
    const result1 = patternMatch(
      "AingBing".split(""),
      "aaingbbing".split(""),
      opts
    );
    expect(result1).toBeFalse();
    const result2 = patternMatch(
      "AAingBing".split(""),
      "agingbbing".split(""),
      opts
    );
    expect(result2).toStrictEqual({
      A: "g",
      B: "bb".split("")
    });
  });

  test("object-multi", () => {
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

  test("node", () => {
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

    const result = patternMatch(tmplAst, objAst, {
      isGroup: isGroup,
      isNode: isNode
    });
    if (typeof result === "boolean") {
      expect(result).not.toBeBoolean();
      return;
    }
    expect(result).toEqual({
      placement: [nodePurify(template.statement`console.log("hogehoge")`())]
    });
  });

  test("node-multiple", () => {
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

    const result = patternMatch(tmplAst, objAst, {
      isGroup: isGroup,
      isNode: isNode
    });
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

  test("node-empty", () => {
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

    const result = patternMatch(tmplAst, objAst, {
      isGroup: isGroup,
      isNode: isNode
    });
    if (typeof result === "boolean") {
      expect(result).not.toBeBoolean();
      return;
    }
    expect(result).toEqual({
      placement: []
    });
  });

  test("node-unmatched", () => {
    const tmplAst = nodePurify(
      template.program`
      export default ()=>{
        "placement = @any"
      } 
    `()
    );

    const objAst = nodePurify(
      template.program`
      console.log(2)
      export default () => {
      } 
    `()
    );

    const result = patternMatch(tmplAst, objAst, {
      isGroup: isGroup,
      isNode: isNode
    });
    expect(result).toBeFalse();
  });

  test("node-object", () => {
    const tmplAst = nodePurify(
      template.program`
      export default {
        name:"@one",
        data:"two=@one",
      } 
    `()
    );

    const objAst = nodePurify(
      template.program`
      export default {
        data:"two",
        name:"one",
      }
    `()
    );

    const result = patternMatch(tmplAst, objAst, {
      debug: true,
      isGroup: isGroup,
      isNode: isNode,
      isDisorderly: ast => t.isObjectExpression(ast) && "properties"
    });
    expect(result).toEqual({
      one: t.stringLiteral("one"),
      two: t.stringLiteral("two")
    });
  });
});
