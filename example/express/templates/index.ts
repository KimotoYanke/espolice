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

    // @unquote-splicing
    parent.childrenFiles
      .filter(childrenFile => childrenFile !== "index.js")
      .reduce(
        (prev, childrenFile) => [
          ...prev,
          //@ts-ignore
          ...$quasiquote => {
            //@ts-ignore
            register(
              require(//@literal
              childrenFile)
            );
          }
        ],
        []
      );

    //@ts-ignore
    export default () => {
      "@any";
    };
  };
  return result;
};
