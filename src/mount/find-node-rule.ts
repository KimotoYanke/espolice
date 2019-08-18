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
          if (prevNodeRule.childDirNodes[current]) {
            return [
              prevNodeRule.childDirNodes[current],
              prevPath + "/" + current
            ];
          }
          if (prevNodeRule.otherDirNode) {
            return [prevNodeRule.otherDirNode, prevPath + "/*"];
          }
          return null;
        }
        if (isDirNodeRule === false) {
          if (prevNodeRule.childFileNodes[current]) {
            return [
              prevNodeRule.childFileNodes[current],
              prevPath + "/" + current
            ];
          }
          if (prevNodeRule.otherFileNode) {
            return [prevNodeRule.otherFileNode, prevPath + "/*"];
          }
          return null;
        }
        if (prevNodeRule.childFileNodes[current]) {
          return [
            prevNodeRule.childFileNodes[current],
            prevPath + "/" + current
          ];
        }

        if (prevNodeRule.otherFileNode) {
          return [prevNodeRule.otherFileNode, prevPath + "/*"];
        }
        if (prevNodeRule.childDirNodes[current]) {
          return [
            prevNodeRule.childDirNodes[current],
            prevPath + "/" + current
          ];
        }
        if (prevNodeRule.otherDirNode) {
          return [prevNodeRule.otherDirNode, prevPath + "/*"];
        }
        return null;
      }

      if (prevNodeRule.childDirNodes[current]) {
        return [prevNodeRule.childDirNodes[current], prevPath + "/" + current];
      }
      if (prevNodeRule.otherDirNode) {
        return [prevNodeRule.otherDirNode, prevPath + "/*"];
      }
      return null;
    },
    [rootNodeRule, ""]
  );
  if (!nodeRuleNodeRulePath) {
    return null;
  }
  const [nodeRule, nodeRulePath] = nodeRuleNodeRulePath;
  return [nodeRule, nodeRulePath] as FindNodeRuleReturns<T>;
};
