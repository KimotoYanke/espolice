import * as t from "@babel/types";
import { isNode } from "./is-node";
export const nodePurify = (node: any): any => {
  if (typeof node !== "object" || !node) {
    return node;
  }
  if (isNode(node)) {
    delete node.loc;
    delete node.start;
    delete node.end;
    if (t.isBlockStatement(node)) {
      node.body = [
        ...node.directives.map(d =>
          t.expressionStatement(t.stringLiteral(d.value.value))
        ),
        ...node.body
      ];
      node.directives = [];
    }
    if (t.isObjectProperty(node)) {
      node.decorators = node.decorators || null;
    }
  }
  if (node["extra"]) {
    delete node["extra"];
  }
  if (node instanceof Array) {
    return node.map(n => nodePurify(n));
  }
  for (const key of Object.keys(node)) {
    node[key] = nodePurify(node[key]);
  }

  return node;
};
