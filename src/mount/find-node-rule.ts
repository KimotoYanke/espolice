import * as path from "path";
import { DirNodeRule, FileNodeRule } from "..";
import { NodeRule } from "../rule";
import { isFileNodeRule } from "../rule/file";

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
  const node: NodeRule | null = splittedPath.reduce<NodeRule | null>(
    (prev, current: string, currentIndex, array) => {
      if (prev === null) {
        return null;
      }

      if (isFileNodeRule(prev)) {
        return null;
      }

      if (currentIndex === array.length - 1) {
        if (isDirNodeRule === true) {
          return prev.childDirNodes[current] || prev.otherDirNode || null;
        }
        if (isDirNodeRule === false) {
          return prev.childFileNodes[current] || prev.otherFileNode || null;
        }
        return (
          prev.childFileNodes[current] ||
          prev.otherFileNode ||
          prev.childDirNodes[current] ||
          prev.otherDirNode ||
          null
        );
      }

      return prev.childDirNodes[current] || prev.otherDirNode || null;
    },
    rootNodeRule
  );
  return node as FindNodeRuleReturns<T>;
};
