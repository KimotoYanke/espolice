import * as t from "@babel/types";
import { patternMatch } from "./pattern-matcher";
import { isNode } from "./is-node";
import { isGroup } from "./is-group";
import { isDisorderly } from "./is-disorderly";
import { nodePurify } from "./node-purify";

export const patternMatchAST = (tmpl: t.Node, obj: t.Node, debug?: boolean) => {
  return patternMatch(nodePurify(tmpl), nodePurify(obj), {
    debug,
    isNode,
    isGroup,
    isDisorderly
  });
};
