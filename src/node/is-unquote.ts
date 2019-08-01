import * as t from "@babel/types";
const UNQUOTE_SIGNATURE = "@unquote";

export const isUnquote = (node: t.Node) => {
  return [
    ...(node.trailingComments || []),
    ...(node.leadingComments || [])
  ].some(c => {
    return c.value.trim() === UNQUOTE_SIGNATURE;
  });
};
