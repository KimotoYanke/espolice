import { NodeRule } from ".";
import { PseudoDirectory } from "../mount/directory";
export type FileNodeRule = (args: {
  getParent: () => PseudoDirectory;
  getState: <S extends string>(...args: S[]) => { [key in S]: any };
  getPath: () => string;
}) => object;

export const isFileNodeRule = (rule: NodeRule): rule is FileNodeRule => {
  return typeof rule === "function";
};
