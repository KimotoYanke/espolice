import * as t from "@babel/types";
import {
  IsGroupFunction,
  GroupResult
} from "../pattern-matcher/pattern-matcher";
import { isNode } from "./is-node";

const parseGroupString = (
  str: string
): { key: string; cmd: string } | false => {
  const matched = str.trim().match(/^(?:(\w+)\s*=)?\s*@(\w+)$/);
  if (!matched) {
    return false;
  }
  const [_, key, cmd] = matched;
  return { key, cmd };
};

export const isGroup: IsGroupFunction = (obj: any, count) => {
  if (!obj) {
    return [false, count];
  }
  if (Object.keys(obj).length === 0) {
    return [false, count];
  }

  if (isNode(obj) && (obj.leadingComments || obj.trailingComments)) {
    obj.leadingComments;
  }

  if (t.isExpressionStatement(obj)) {
    return isGroup(obj.expression, count);
  }

  if (t.isSpreadElement(obj)) {
    return isGroup(obj.argument, count);
  }

  const strLiteral = obj;
  if (!t.isStringLiteral(strLiteral)) {
    return [false, count];
  }

  const str = strLiteral.value;

  const result = parseGroupString(str);
  if (!result) {
    return [false, count];
  }
  switch (result.cmd) {
    case "any":
      return [
        { type: "ANY", as: result.key || "any_" + count },
        result.key ? count : count + 1
      ];
    case "some":
      return [
        { type: "MULTIPLE", as: result.key || "some_" + count },
        result.key ? count : count + 1
      ];
    case "one":
      return [
        { type: "SINGLE", as: result.key || "one_" + count },
        result.key ? count : count + 1
      ];
  }
  return [false, count];
};
