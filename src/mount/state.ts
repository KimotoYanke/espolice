import { PseudoFile } from "./file";

export class State {
  data: { [key in string]: any } = {};
  datumUser: { [key in string]: NodeRulePath[] } = {};
}

export type StateInterface = {
  getStateDatum(key: string): any;
  setStateDatum(key: string, obj: any): void;
  addDatumUser(key: string, nodeRulePath: NodeRulePath): void;
  getDatumUsers(key: string): NodeRulePath[];
  getNodesFromNodeRulePath(nodeRulePath: NodeRulePath): Set<PseudoFile> | null;
};

export type NodeRulePath = string;
