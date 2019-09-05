//@ts-nocheck
import { FileNodeRule } from "espolice";
export const Other: FileNodeRule = ({ getState, parent }) => {
  const { moduleName } = getState("moduleName");
  return $quasiquote => {
    console.log(
      //@unquote
      moduleName
    );
  };
};
export const Index: FileNodeRule = ({ getState, parent }) => {
  const { moduleName } = getState("moduleName");
  console.log(parent.childrenFiles);
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
  console.log(result);
  return result;
};
