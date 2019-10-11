import { DirNodeRule, dir, mount } from "espolice";
import { Index, Other } from "./templates/index";
const OtherDir: DirNodeRule = dir()
  .haveChildFile(Index, "index.js")
  .otherChildrenFiles(Other);
OtherDir.otherChildrenDirs(OtherDir);
const RootDir: DirNodeRule = dir()
  .haveChildFile(Index, "index.js")
  .otherChildrenFiles(Other)
  .otherChildrenDirs(OtherDir);

mount(RootDir, "./routes", {
  usePrettier: true
});
