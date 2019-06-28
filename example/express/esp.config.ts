import { dir, DirNodeRule } from "../../src/rule/dir";
import { FileNodeRule } from "../../src/rule/file";
import { mount } from "../../src/mount";
import { parse } from "@babel/parser";

const RouteIndex: FileNodeRule = ({ parent }) => {
  return parse('"ANY";hello(/*@requote*/ hello)', { ranges: false }).program;
};

const RoutesDir: DirNodeRule = dir()
  .haveChildFile(RouteIndex, "index.js")
  .otherChildrenDirs(() => RoutesDir, "routes");

const RootDir: DirNodeRule = dir().haveChildDir(RoutesDir, "routes");

mount({}, RootDir, ".");
