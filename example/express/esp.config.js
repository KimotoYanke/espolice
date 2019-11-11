import { dir, mount } from "espolice";
const RouteIndex = require("./templates/index");
import { TestIndex, TestSubmodule } from "./templates/test";
import { Other } from "./templates/other";
const OtherDir = dir()
  .haveChildFile(RouteIndex, "index.js")
  .otherChildrenFiles(Other);
OtherDir.otherChildrenDirs(OtherDir);
const RootDir = dir()
  .haveChildFile(RouteIndex, "index.js")
  .haveChildFile(TestIndex, "test.js")
  .haveChildFile(TestSubmodule, "testsub.js")
  .otherChildrenFiles(Other)
  .otherChildrenDirs(OtherDir);

mount(RootDir, "./routes", {
  usePrettier: true
});
