//@ts-nocheck
import { FileNodeRule } from "espolice";
export const Other: FileNodeRule = ({ getState, getParent }) => {
  const { moduleName } = getState("moduleName");
  return $quasiquote => {
    console.log(
      //@unquote
      moduleName
    );
  };
};
export const Index: FileNodeRule = ({ getState, getParent }) => {
  const { moduleName } = getState("moduleName");
  const parent = getParent();
  const result = $quasiquote => {
    console.log("moduleName = @one");

    //@ts-ignore
    export default () => {
      "@any";
    };

    // @unquote-splicing
    parent.childrenFiles
      .filter(childrenFile => childrenFile !== "index.js")
      .map(childrenFile => $quasiquote =>
        console.log(
          //@literal
          childrenFile
        )
      );
  };
  return result;
};
