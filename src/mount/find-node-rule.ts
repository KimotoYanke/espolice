import * as path from "path";
import { DirNodeRule, FileNodeRule } from "..";
import { NodeRule } from "../rule";
import { isFileNodeRule } from "../rule/file";
import { NodeRulePath } from "./state";

export type FindNodeRuleReturns<T extends boolean> =
  | [
      (T extends true
        ? DirNodeRule
        : T extends false
        ? FileNodeRule
        : NodeRule),
      string
    ]
  | null;
export const findNodeRule = <T extends boolean>(
  pathFromRoot: string,
  rootPath: string,
  rootNodeRule: DirNodeRule,
  isDirNodeRule?: T
): FindNodeRuleReturns<T> => {
  const splittedPath = path
    .relative(path.resolve(rootPath), path.resolve(rootPath, pathFromRoot))
    .split("/");
  if (path.normalize(path.join(...splittedPath)) === ".") {
    return (isDirNodeRule === true
      ? [rootNodeRule, pathFromRoot]
      : null) as (FindNodeRuleReturns<T>);
  }
  const nodeRuleNodeRulePath:
    | [NodeRule, NodeRulePath]
    | null = splittedPath.reduce<[NodeRule, NodeRulePath] | null>(
    (prev, current: string, currentIndex, array) => {
      if (prev === null) {
        return null;
      }

      const [prevNodeRule, prevPath] = prev;
      if (isFileNodeRule(prevNodeRule)) {
        return null;
      }

      if (currentIndex === array.length - 1) {
        if (isDirNodeRule === true) {
          return (
            [prevNodeRule.childDirNodes[current], prevPath + "/" + current] || [
              prevNodeRule.otherDirNode,
              prevPath + "/*"
            ] ||
            null
          );
        }
        if (isDirNodeRule === false) {
          return (
            [
              prevNodeRule.childFileNodes[current],
              prevPath + "/" + current
            ] || [prevNodeRule.otherFileNode, prevPath + "/*"] ||
            null
          );
        }
        return (
          [prevNodeRule.childFileNodes[current], prevPath + "/" + current] || [
            prevNodeRule.otherFileNode,
            prevPath + "/*"
          ] || [
            prevNodeRule.childDirNodes[current],
            prevPath + "/" + current
          ] || [prevNodeRule.otherDirNode, prevPath + "/*"] ||
          null
        );
      }

      return (
        [prevNodeRule.childDirNodes[current], prevPath + "/" + current] || [
          prevNodeRule.otherDirNode,
          prevPath + "/*"
        ] ||
        null
      );
    },
    [rootNodeRule, ""]
  );
  if (!nodeRuleNodeRulePath) {
    return null;
  }
  const [nodeRule, nodeRulePath] = nodeRuleNodeRulePath;
  return [nodeRule, nodeRulePath] as FindNodeRuleReturns<T>;
};
