import { PseudoFile } from "./file";

export class State {
  data: { [key in string]: any } = {};
  datumUser: { [key in string]: Set<NodeRulePath> } = {};
}

export type StateInterface = {
  getStateDatum(key: string): any;
  setStateDatum(key: string, obj: any): void;
  addDatumUser(key: string, nodeRulePath: NodeRulePath): void;
  removeDatumUser(nodeRulePath: NodeRulePath): void;
  getDatumUsers(key: string): Set<NodeRulePath>;
  getNodesFromNodeRulePath(nodeRulePath: NodeRulePath): Set<PseudoFile> | null;
  getAllStateData(): { [key in string]: any };
};

export type NodeRulePath = string;
