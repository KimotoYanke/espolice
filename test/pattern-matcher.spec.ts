import template from "@babel/template";
import { patternMatch } from "../src/mount/pattern-matcher";
import "jest-extended";

describe("diff", () => {
  test("isNode", () => {
    const result = patternMatch(
      "str*ing".split(""),
      "straaingaaing".split(""),
      {
        isGroup: str => (str === "*" ? "A" : false)
      }
    );
    if (typeof result === "boolean") {
      expect(result).not.toBeBoolean();
      return;
    }
    expect(result[0].matched).toEqual({ A: "aaingaa".split("") });
  });
});
