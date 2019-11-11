import { StateInterface, State, NodeRulePath } from "./state";
import { PseudoFile } from "./file";
import { deepEqual } from "fast-equals";

export type DictNodeRulePathToFiles = {
  [key in NodeRulePath]: Set<PseudoFile> | undefined;
};
export const createStateInterface = (
  state: State,
  dictNodeRulePathToFiles: DictNodeRulePathToFiles
): StateInterface => {
  const getStateDatum = (key: string) => {
    return state.data[key] || undefined;
  };
  const setStateDatum = (key: string, datum: any) => {
    if (deepEqual(state.data[key], datum)) {
      return;
    }
    state.data[key] = datum;
    const userPaths = getDatumUsers(key);

    userPaths.forEach(nodeRulePath => {
      const nodes = getNodesFromNodeRulePath(nodeRulePath);
      if (nodes !== null) {
        nodes.forEach(node => {
          node.sync(state.data);
        });
      }
    });
  };
  const addDatumUser = (key: string, nodeRulePath: NodeRulePath) => {
    if (!state.datumUser[key]) {
      state.datumUser[key] = new Set([nodeRulePath]);
    } else {
      state.datumUser[key].add(nodeRulePath);
    }
  };
  const getDatumUsers = (key: string) => {
    return state.datumUser[key] || new Set([]);
  };
  const removeDatumUser = (nodeRulePath: NodeRulePath) => {
    for (let key in state.datumUser) {
      state.datumUser[key].delete(nodeRulePath);
    }
  };
  const getNodesFromNodeRulePath = (
    nodeRulePath: NodeRulePath
  ): Set<PseudoFile> | null => {
    return dictNodeRulePathToFiles[nodeRulePath] || null;
  };
  const getAllStateData = () => {
    return state.data;
  };

  return {
    getStateDatum,
    setStateDatum,
    addDatumUser,
    getDatumUsers,
    removeDatumUser,
    getNodesFromNodeRulePath,
    getAllStateData
  };
};
