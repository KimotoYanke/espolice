import * as t from "@babel/types";
import { patternMatch } from "./pattern-matcher";
import { isNode } from "../node/is-node";
import { isGroup } from "../node/is-group";
import { isDisorderly } from "../node/is-disorderly";
import { nodePurify } from "../node/node-purify";

export const patternMatchAST = (tmpl: t.Node, obj: t.Node, debug?: boolean) => {
  return patternMatch(nodePurify(tmpl), nodePurify(obj), {
    debug,
    isNode,
    isGroup,
    isDisorderly,
    generic: ["one", "some", "any"]
  });
};
