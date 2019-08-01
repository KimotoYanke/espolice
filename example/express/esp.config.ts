import { dir, DirNodeRule } from "../../src/rule/dir";
import { FileNodeRule } from "../../src/rule/file";
import { mount } from "../../src/mount";
import { transform } from "@babel/core";

const RouteIndex: FileNodeRule = ({ parent }) => {
  return transform('hello(hello);"@any"', {});
};

const RoutesDir: DirNodeRule = dir()
  .haveChildFile(RouteIndex, "index.js")
  .otherChildrenDirs(() => RoutesDir, "routes");

const RootDir: DirNodeRule = dir().haveChildDir(RoutesDir, "routes");

mount({}, RootDir, ".");
