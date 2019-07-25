import * as t from "@babel/types";
import { IsGroupFunction, GroupResult } from "./pattern-matcher";

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

export const isGroup: IsGroupFunction = (obj: any): false | GroupResult => {
  if (Object.keys(obj).length === 0) {
    return false;
  }

  if (t.isExpressionStatement(obj)) {
    return isGroup(obj.expression);
  }

  if (t.isSpreadElement(obj)) {
    return isGroup(obj.argument);
  }

  const strLiteral = obj;
  if (!t.isStringLiteral(strLiteral)) {
    return false;
  }

  const str = strLiteral.value;

  const result = parseGroupString(str);
  if (!result) {
    return false;
  }
  switch (result.cmd) {
    case "any":
      return { type: "ANY", as: result.key || "any" };
    case "some":
      return { type: "MULTIPLE", as: result.key || "some" };
    case "one":
      return { type: "SINGLE", as: result.key || "one" };
  }
  return false;
};
