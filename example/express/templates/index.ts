//@ts-nocheck
import { FileNodeRule } from "espolice";
export const Other: FileNodeRule = ({ getState, getParent, getPath }) => {
  const parent = getParent();
  const stateDatumKey = "[" + parent.pathFromRoot + "]moduleName";
  const moduleName = getState(stateDatumKey)[stateDatumKey];
  return $quasiquote => {
    console.log(
      //@unquote
      moduleName
    );
  };
};
export const Index: FileNodeRule = ({ getState, getParent }) => {
  const parent = getParent();
  const stateDatumKey = "[" + parent.pathFromRoot + "]moduleName";
  const moduleName = getState(stateDatumKey);
  const result = $quasiquote => {
    console.log(
      //@literal
      stateDatumKey + " = @one"
    );

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
              "./" + childrenFile)
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
