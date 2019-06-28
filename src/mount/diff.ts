import * as t from "@babel/types";
import { diff } from "deep-diff";

export const getDiff = (tmplAst: t.Program, ast: t.Program) => {
  const differences = diff<t.Program, t.Program>(tmplAst, ast).filter(d => {
    return !(
      d.path.includes("loc") ||
      d.path.includes("start") ||
      d.path.includes("end")
    );
  });
  differences.filter(d => d.path[d.path.length - 1] === "type");
  return differences;
};
