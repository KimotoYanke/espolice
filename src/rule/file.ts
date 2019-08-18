import { NodeRule } from ".";
import { PseudoDirectory } from "../mount/directory";
export type FileNodeRule = (args: {
  parent: PseudoDirectory;
  getState: <S extends string>(
    nodeRule: FileNodeRule,
    ...args: S[]
  ) => { [key in S]: any };
}) => object;

export const isFileNodeRule = (rule: NodeRule): rule is FileNodeRule => {
  return typeof rule === "function";
};
