import { State } from "../mount/state";
export type FileNodeRule<Option = {}> = ({
  parent: DirNode
}: State<Option, any>) => object;
