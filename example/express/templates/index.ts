//@ts-nocheck
import { FileNodeRule } from "espolice";
export const Other: FileNodeRule = ({ getState, parent }) => {
  const { moduleName } = getState(Index, "moduleName");
  return $quasiquote => {
    console.log("moduleName = @one");
  };
};
export const Index: FileNodeRule = ({ getState, parent }) => {
  const { moduleName } = getState(Index, "moduleName");
  return $quasiquote => {
    console.log(
      // @unquote
      moduleName
    );

    //@ts-ignore
    export default () => {
      "@any";
    };
  };
};
