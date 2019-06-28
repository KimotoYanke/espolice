import { State } from "../mount/state";
import { NodeRule } from ".";
export type FileNodeRule<Option = {}> = ({
  parent: DirNode
}: State<Option, any>) => object;

export const isFileNodeRule = (rule: NodeRule): rule is FileNodeRule => {
  return typeof rule === "function";
};
