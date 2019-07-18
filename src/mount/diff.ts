import * as t from "@babel/types";
import { diff } from "deep-diff";

interface Object {
  [key: string]: any;
  [key: number]: any;
}

const getDescendantFromPath = <O extends Object>(
  obj: O,
  path: (number | string)[]
): O | null => {
  let current: Object = { ...obj };
  const [key, ...nPath] = path;
  if (!current[key]) {
    return null;
  }
  if (nPath.length > 0) {
    return getDescendantFromPath(current[key], nPath);
  }
  return current[key];
};

const getObjectPathString = (path: (number | string)[]) => {
  return path.join(".");
};

interface BaseNode {
  leadingComments?: any | null;
  innerComments?: any | null;
  trailingComments?: any | null;
  start?: number | null;
  end?: number | null;
  loc?: any | null;
  type?: t.Node["type"];
}

export const isNode = (o: BaseNode): o is t.Node => {
  return !!o && !!o.type && typeof o.type === "string";
};

export const getDiff = (tmplAst: t.Program, ast: t.Program) => {
  const differences = diff(tmplAst, ast) || [];
  let filteredDifferences: any[] = differences.filter(d => {
    if (d.path) {
      return !(
        d.path.includes("loc") ||
        d.path.includes("start") ||
        d.path.includes("end")
      );
    }
    return true;
  });
  for (let i = 0; i < filteredDifferences.length; i++) {
    const d = filteredDifferences[i];
    const isObjectPathNode = (
      ast: Object,
      path: (string | number)[]
    ): boolean => {
      const des = getDescendantFromPath(ast, path);
      if (!des) return false;
      return isNode(des);
    };

    if (
      d.kind === "E" &&
      d.path &&
      isObjectPathNode(ast, d.path.slice(0, -1))
    ) {
      const p = d.path.slice(0, -1);
      const currentAddress = getObjectPathString(
        d.path.slice(0, -1).map((s: any) => s.toString())
      );
      filteredDifferences = filteredDifferences.filter(d => {
        return !getObjectPathString(
          d.path.map((s: any) => s.toString())
        ).startsWith(currentAddress);
      });
      filteredDifferences.push({
        kind: "E",
        path: d.path.slice(0, -1),
        rhs: getDescendantFromPath(ast, p),
        lhs: getDescendantFromPath(tmplAst, p)
      });
    }
  }
  return filteredDifferences;
};
