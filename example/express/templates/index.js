import * as path from "path";
export const Index = ({ getState, getParent }) => {
  const parent = getParent();
  const stateDatumKey = "[" + parent.pathFromRoot + "]moduleName";
  const moduleName = getState(stateDatumKey);
  const result = $quasiquote => {
    import { Router } from "express";
    const router = Router();

    // @unquote-splicing
    parent.childrenFiles
      .filter(childrenFile => childrenFile !== "index.js")
      .reduce(
        (prev, childrenFile) => [
          ...prev,
          ...$quasiquote => {
            router.use(
              //@literal
              "/" + path.basename(childrenFile, ".js"),
              require(//@literal
              "./" + childrenFile)
            );
          }
        ],
        []
      );

    export default router;
  };
  return result;
};
