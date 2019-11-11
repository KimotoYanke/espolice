import * as path from "path";
export const Other = ({ getState, getParent, getPath }) => {
  const parent = getParent();
  const stateDatumKey = "[" + parent.pathFromRoot + "]moduleName";
  const filename = getState("filename")["filename"] || /*@literal*/ "";
  const p = getPath();
  return $quasiquote => {
    import { Router } from "express";
    import parser from "body-parser";
    const router = Router();

    router.get("/", (req, res, next) => {
      console.log(/*@unquote*/ filename);
      ("@some");
    });
    export default router;
  };
};
