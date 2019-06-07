import { FileNodeRule } from "./file";
import { DirNodeRule } from "./dir";

export type NodeRule = DirNodeRule | FileNodeRule;
