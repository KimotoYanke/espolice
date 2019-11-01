import * as path from "path";
export const Other = ({ getState, getParent, getPath }) => {
  const parent = getParent();
  const stateDatumKey = "[" + parent.pathFromRoot + "]moduleName";
  const moduleName = getState(stateDatumKey)[stateDatumKey] || /*@literal*/ "";
  const p = getPath();
  return $quasiquote => {
    import { Router } from "express";
    import parser from "body-parser";
    const router = Router();

    ("@any");

    router.get("/", (req, res, next) => {
      "@some";
    });
    export default router;
  };
};
