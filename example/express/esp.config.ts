import { dir, DirNodeRule } from "../../src/rule/dir";
import { FileNodeRule } from "../../src/rule/file";
import { mount } from "../../src/mount";
import * as t from "@babel/types";

const RouteIndex: FileNodeRule = ({ parent }) => {
  return t.program([
    t.expressionStatement(
      t.callExpression(t.identifier("hello"), [t.identifier("hello")])
    )
  ]);
};

const RoutesDir: DirNodeRule = dir()
  .haveChildFile(RouteIndex, "index.js")
  .otherChildrenDirs(() => RoutesDir, "routes");

const RootDir: DirNodeRule = dir().haveChildDir(RoutesDir, "routes");

mount(".", RootDir);
