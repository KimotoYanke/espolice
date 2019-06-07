import { DirNodeRule } from "../rule/dir";
import { NodeRule } from "../rule";

export type State<
  Options = {},
  Parent extends State<any, any> | null = null
> = {
  parent?: Parent;
} & Options;
