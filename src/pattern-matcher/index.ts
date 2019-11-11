import * as t from "@babel/types";
import { patternMatch } from "./pattern-match";
import { isNode } from "../node/is-node";
import { isGroup, fromGroup } from "../node/is-group";
import { isDisorderly } from "../node/is-disorderly";
import { nodePurify } from "../node/node-purify";
import { patternReset } from "./pattern-reset";
import { MatchedList } from "./matched-list";

export const patternMatchAST = (
  tmpl: t.Node,
  obj: t.Node,
  formerMatchedList: MatchedList,
  debug?: boolean
) => {
  return patternMatch(nodePurify(tmpl), nodePurify(obj), {
    debug,
    isNode,
    isGroup,
    isDisorderly,
    formerMatchedList,
    generic: ["one", "some", "any"]
  });
};
export const patternResetAST = (
  tmpl: t.Node,
  matched: MatchedList,
  debug?: boolean
) => {
  return patternReset(nodePurify(tmpl), matched, {
    debug,
    isNode,
    isGroup,
    fromGroup,
    isDisorderly,
    generic: ["one", "some", "any"]
  });
};
