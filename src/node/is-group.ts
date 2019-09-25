import * as t from "@babel/types";
import { isNode } from "./is-node";
import {
  IsGroupFunction,
  FromGroupFunction
} from "../pattern-matcher/matched-list";
import { nodePurify } from "./node-purify";

const parseGroupString = (
  str: string
): { key: string; cmd: string } | false => {
  const matched = str.trim().match(/^(?:([^=\s@]+)\s*=)?\s*@(\w+)$/);
  if (!matched) {
    return false;
  }
  const [_, key, cmd] = matched;
  return { key, cmd };
};

export const isGroup: IsGroupFunction = (obj: any) => {
  if (!obj) {
    return false;
  }
  if (Object.keys(obj).length === 0) {
    return false;
  }

  if (isNode(obj) && (obj.leadingComments || obj.trailingComments)) {
    obj.leadingComments;
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

export const fromGroup: FromGroupFunction = group => {
  switch (group.type) {
    case "ANY":
      return nodePurify(t.stringLiteral(group.as + " = @any"));
    case "MULTIPLE":
      return nodePurify(t.stringLiteral(group.as + " = @some"));
    case "SINGLE":
      return nodePurify(t.stringLiteral(group.as + " = @one"));
  }
};
