import { State } from "../state";
export type FileNodeRule<Option = {}> = ({
  parent: DirNode
}: State<Option, any>) => object;
