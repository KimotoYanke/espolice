import * as t from "@babel/types";
import { IsGroupFunction } from "./pattern-matcher";

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

export const isGroup: IsGroupFunction = (obj: any) => {
  if (Object.keys(obj).length === 0) {
    return false;
  }

  if (t.isExpressionStatement(obj)) {
    return isGroup(obj.expression);
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
  if (result.cmd !== "any") {
    return false;
  }
  return { type: "MULTIPLE", as: result.key };
};
