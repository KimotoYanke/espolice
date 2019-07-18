import template from "@babel/template";
import { getDiff, isNode } from "../src/mount/diff";
import * as t from "@babel/types";
import "jest-extended";

describe("diff", () => {
  test("isNode", () => {
    const a = template.expression(`
    a
    `)();
    expect(isNode(a)).toBeTruthy();
  });
  test("diff", () => {
    const a = template.program(`
      console.log(a)
    `)();
    const b = template.program(`
      console.log(b)
    `)();

    const diff = getDiff(a, b);
    //expect(diff).toSatisfyAll(isNode);
  });
});
