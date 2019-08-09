//@ts-nocheck
import { FileNodeRule } from "espolice";
export const Index: FileNodeRule = ({ getState, parent }) => {
  const state = getState(Index, "moduleName");
  return $quasiquote => {
    console.log(
      // @literal
      state.moduleName
    );

    //@ts-ignore
    export default () => {
      "@any";
    };
  };
};
