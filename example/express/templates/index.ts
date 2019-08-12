//@ts-nocheck
import { FileNodeRule } from "espolice";
export const Index: FileNodeRule = ({ getState, parent }) => {
  const { moduleName } = getState(Index, "moduleName");
  return $quasiquote => {
    console.log(
      // @literal
      moduleName
    );

    //@ts-ignore
    export default () => {
      "@any";
    };
  };
};
